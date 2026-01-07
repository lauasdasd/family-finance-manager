from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from dateutil.relativedelta import relativedelta
from datetime import date
from typing import Optional
from database import get_db
from models.persona import Persona
from models.cuenta import Cuenta
from models.cuota import Cuota
from models.cuenta_persona import CuentaPersona
from models.pago import Pago
from utils.fechas import cuota_es_del_mes

router = APIRouter(prefix="/resumen", tags=["Resumen"])

# --- UTILIDADES ---

def get_rango_mes(mes: int, anio: int):
    """Obtiene fecha inicio y fin de un mes para filtros de base de datos."""
    inicio = date(anio, mes, 1)
    if mes == 12:
        fin = date(anio + 1, 1, 1)
    else:
        fin = date(anio, mes + 1, 1)
    return inicio, fin

def es_movimiento_entrada(cuenta: Cuenta):
    """
    Lógica unificada para determinar si un movimiento suma dinero al titular.
    Suma si es tipo 'ingreso' o si es una transferencia con etiqueta (Entrada).
    """
    return (cuenta.tipo == "ingreso") or \
           (cuenta.tipo == "transferencia" and "(Entrada)" in (cuenta.nombre or ""))

# --- ENDPOINTS ---

@router.get("/mensual")
def resumen_mensual(
    mes: int = date.today().month,
    anio: int = date.today().year,
    db: Session = Depends(get_db)
):
    """Lista de cuotas no pagadas del mes para vista general."""
    cuotas = db.query(Cuota).join(Cuenta).filter(
        Cuota.pagada == False,
        Cuenta.anulada == False  # No mostrar anulados
    ).all()

    resumen = []
    for cuota in cuotas:
        cuenta = cuota.cuenta
        if not cuota_es_del_mes(cuenta.fecha_inicio, cuota.numero, mes, anio):
            continue

        resumen.append({
            "cuenta": cuenta.nombre,
            "cuota": cuota.numero,
            "monto": cuota.monto,
            "tipo": cuenta.tipo,
            "es_entrada": es_movimiento_entrada(cuenta),
            "tarjeta": cuenta.tarjeta.nombre if cuenta.tarjeta else "Sin tarjeta",
            "banco": cuenta.tarjeta.banco.nombre if (cuenta.tarjeta and cuenta.tarjeta.banco) else "Sin banco"
        })
    return resumen

@router.get("/mensual/persona/{persona_id}")
def resumen_mensual_persona(
    persona_id: int,
    mes: int = date.today().month,
    anio: int = date.today().year,
    db: Session = Depends(get_db)
):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    relaciones = db.query(CuentaPersona)\
        .filter(CuentaPersona.persona_id == persona_id)\
        .all()

    detalle = []
    total_asignado = 0
    total_pagado = 0

    for rel in relaciones:
        cuenta = rel.cuenta

        cuotas = db.query(Cuota)\
            .filter(
                Cuota.cuenta_id == cuenta.id,
                Cuota.pagada == False
            ).all()

        for cuota in cuotas:
            if not cuota_es_del_mes(
                cuenta.fecha_inicio,
                cuota.numero,
                mes,
                anio
            ):
                continue

            pagado = db.query(
                func.coalesce(func.sum(Pago.monto), 0)
            ).filter_by(
                persona_id=persona_id,
                cuenta_id=cuenta.id,
                cuota_id=cuota.id
            ).scalar()

            # Monto proporcional por cuota
            monto_persona = rel.monto_asignado / cuenta.cantidad_cuotas
            restante = monto_persona - pagado

            total_asignado += monto_persona
            total_pagado += pagado

            detalle.append({
                "cuenta": cuenta.nombre,
                "cuota": cuota.numero,
                "monto_asignado": monto_persona,
                "pagado": pagado,
                "restante": restante
            })

    return {
        "persona": persona.nombre,
        "mes": mes,
        "anio": anio,
        "total_asignado": total_asignado,
        "total_pagado": total_pagado,
        "total_restante": total_asignado - total_pagado,
        "detalle": detalle
    }
@router.get("/mensual/tarjetas")
def resumen_mensual_tarjetas(
    mes: int = date.today().month, 
    anio: int = date.today().year, 
    db: Session = Depends(get_db)
):
    cuotas = db.query(Cuota).join(Cuenta).filter(Cuota.pagada == False).all()
    
    tarjetas_resumen = {}

    for cuota in cuotas:
        cuenta = cuota.cuenta
        if not cuota_es_del_mes(cuenta.fecha_inicio, cuota.numero, mes, anio):
            continue
        
        # Identificador único por ID de tarjeta para evitar problemas con nombres duplicados
        t_id = cuenta.tarjeta.id if cuenta.tarjeta else 0
        t_nombre = cuenta.tarjeta.nombre if cuenta.tarjeta else "Efectivo/Otros"
        
        if t_id not in tarjetas_resumen:
            # Traemos la info de vencimiento del modelo Tarjeta
            vencimiento = cuenta.tarjeta.dia_vencimiento if cuenta.tarjeta else None
            cierre = cuenta.tarjeta.dia_cierre if cuenta.tarjeta else None
            tipo = cuenta.tarjeta.tipo if cuenta.tarjeta else "otro"
            limite = cuenta.tarjeta.limite_credito if cuenta.tarjeta else 0

            tarjetas_resumen[t_id] = {
                "nombre": t_nombre,
                "total": 0,
                "cuentas_count": 0,
                "banco": cuenta.tarjeta.banco.nombre if (cuenta.tarjeta and cuenta.tarjeta.banco) else "S/B",
                "dia_vencimiento": vencimiento,
                "dia_cierre": cierre,
                "tipo": tipo,
                "limite_credito": limite
            }

        tarjetas_resumen[t_id]["total"] += cuota.monto
        tarjetas_resumen[t_id]["cuentas_count"] += 1

    return list(tarjetas_resumen.values()) # Lo mandamos como lista para que React lo mapee fácil


def get_rango_mes(mes: int, anio: int):
    """Utilidad para obtener fecha inicio y fin de un mes"""
    inicio = date(anio, mes, 1)
    if mes == 12:
        fin = date(anio + 1, 1, 1)
    else:
        fin = date(anio, mes + 1, 1)
    return inicio, fin

@router.get("/dashboard/maestro")
def dashboard_maestro(
    mes: Optional[int] = None, 
    anio: Optional[int] = None, 
    persona_id: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    """Datos principales para las tarjetas del Dashboard y Balance."""
    hoy = date.today()
    mes_target = mes or hoy.month
    anio_target = anio or hoy.year
    
    inicio_act, fin_act = get_rango_mes(mes_target, anio_target)
    fecha_target_dt = date(anio_target, mes_target, 1)
    fecha_previa = fecha_target_dt - relativedelta(months=1)
    inicio_ant, fin_ant = get_rango_mes(fecha_previa.month, fecha_previa.year)

    def obtener_resumen_vencimiento(f_inicio, f_fin):
        query = db.query(Cuota).join(Cuenta).filter(
            Cuota.fecha_vencimiento >= f_inicio,
            Cuota.fecha_vencimiento < f_fin,
            Cuenta.anulada == False
        )
        
        if persona_id:
            query = query.filter(Cuenta.titular_id == persona_id)
            
        cuotas = query.all()
        comp = 0 
        pend = 0 
        det = {}
        
        for c in cuotas:
            entrada = es_movimiento_entrada(c.cuenta)
            
            # Valor real: Positivo si entra, Negativo si sale
            valor_real = c.monto if entrada else -c.monto
            
            comp += valor_real
            if not c.pagada:
                pend += valor_real

            # Para el detalle de gastos por tarjeta (se muestra el consumo positivo)
            t_nom = c.cuenta.tarjeta.nombre if c.cuenta.tarjeta else "Efectivo/Varios"
            # Si entra dinero a la tarjeta, resta de la deuda acumulada del detalle
            det[t_nom] = det.get(t_nom, 0) + (-valor_real if c.cuenta.tipo != "ingreso" else 0)

        return {"total_comprometido": comp, "total_pendiente": pend, "detalle": det}

    datos_actual = obtener_resumen_vencimiento(inicio_act, fin_act)
    datos_pasado = obtener_resumen_vencimiento(inicio_ant, fin_ant)

    # Lógica de Deudas de Participantes (quién le debe al titular)
    resumen_personas = {}
    relaciones = db.query(CuentaPersona).options(joinedload(CuentaPersona.persona)).all()
    
    for rel in relaciones:
        cuotas_p = db.query(Cuota).filter(
            Cuota.cuenta_id == rel.cuenta_id,
            Cuota.pagada == False,
            Cuota.fecha_vencimiento < fin_act
        ).all()

        for cp in cuotas_p:
            pagado_p = db.query(func.coalesce(func.sum(Pago.monto), 0)).filter_by(
                persona_id=rel.persona_id, cuota_id=cp.id
            ).scalar()
            
            monto_cuota_persona = rel.monto_asignado / rel.cuenta.cantidad_cuotas
            debe = monto_cuota_persona - pagado_p
            if debe > 0:
                resumen_personas[rel.persona.nombre] = resumen_personas.get(rel.persona.nombre, 0) + debe

    return {
        "mes_vencido": {
            "mes": fecha_previa.month,
            "total_comprometido": datos_pasado["total_comprometido"],
            "total_pendiente": datos_pasado["total_pendiente"],
            "detalle": datos_pasado["detalle"]
        },
        "mes_actual": {
            "mes": mes_target,
            "total_comprometido": datos_actual["total_comprometido"],
            "total_pendiente": datos_actual["total_pendiente"],
            "detalle": datos_actual["detalle"]
        },
        "deudas_personas": resumen_personas,
        "deuda_total_actualizada": datos_pasado["total_pendiente"] + datos_actual["total_pendiente"]
    }

@router.get("/extracto-impresion")
def obtener_extracto_impresion(
    mes: int, 
    anio: int, 
    persona_id: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    """Genera la lista de movimientos detallada para la vista de impresión/PDF."""
    nombre_titular = "Reporte Global"
    if persona_id:
        persona = db.query(Persona).filter(Persona.id == persona_id).first()
        if persona: nombre_titular = persona.nombre

    inicio, fin = get_rango_mes(mes, anio)
    
    query = db.query(Cuota).join(Cuenta).filter(
        Cuota.fecha_vencimiento >= inicio,
        Cuota.fecha_vencimiento < fin,
        Cuenta.anulada == False
    )
    if persona_id:
        query = query.filter(Cuenta.titular_id == persona_id)
    
    cuotas = query.options(joinedload(Cuota.cuenta).joinedload(Cuenta.tarjeta)).all()
    
    movimientos_finales = []
    resumen_tarjetas_credito = {} 
    t_ingresos = 0
    t_egresos = 0

    for c in cuotas:
        monto = c.monto
        cuenta = c.cuenta
        tarjeta = cuenta.tarjeta
        
        if es_movimiento_entrada(cuenta):
            t_ingresos += monto
            movimientos_finales.append({
                "fecha": c.fecha_vencimiento.strftime("%d/%m/%Y"),
                "concepto": cuenta.nombre,
                "tipo": "ingreso",
                "monto": monto,
                "info": f"Entrada a: {tarjeta.nombre if tarjeta else 'Efectivo'}"
            })
        else:
            t_egresos += monto
            # Agrupar si es Crédito para el resumen final
            if tarjeta and tarjeta.tipo.lower() == "credito":
                nombre_t = tarjeta.nombre
                resumen_tarjetas_credito[nombre_t] = resumen_tarjetas_credito.get(nombre_t, 0) + monto
            else:
                info_pago = f"Débito: {tarjeta.nombre}" if tarjeta else "Efectivo/Otro"
                movimientos_finales.append({
                    "fecha": c.fecha_vencimiento.strftime("%d/%m/%Y"),
                    "concepto": cuenta.nombre,
                    "tipo": "egreso",
                    "monto": monto,
                    "info": info_pago
                })

    # Resumen de Tarjetas de Crédito (Periodo anterior)
    dt_periodo = date(anio, mes, 1) - relativedelta(months=1)
    periodo_consumos = dt_periodo.strftime("%m/%Y")

    for tarjeta, total in resumen_tarjetas_credito.items():
        movimientos_finales.append({
            "fecha": f"01/{mes:02d}/{anio}",
            "concepto": f"PAGO RESUMEN TARJETA {tarjeta}",
            "tipo": "egreso",
            "monto": total,
            "info": f"Consumos del periodo {periodo_consumos}"
        })

    return {
        "titular": nombre_titular,
        "periodo": f"{mes}/{anio}",
        "movimientos": sorted(movimientos_finales, key=lambda x: x['fecha']),
        "resumen": {
            "total_ingresos": t_ingresos,
            "total_egresos": t_egresos,
            "balance_neto": t_ingresos - t_egresos
        }
    }