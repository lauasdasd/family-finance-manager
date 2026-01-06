from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from dateutil.relativedelta import relativedelta
from datetime import date
from typing import Optional  # <--- ESTO ES LO QUE FALTABA Y CAUSA EL ERROR
from database import get_db
from models.persona import Persona
from models.cuenta import Cuenta
from models.cuota import Cuota
from models.cuenta_persona import CuentaPersona
from models.pago import Pago
from utils.fechas import cuota_es_del_mes

router = APIRouter(prefix="/resumen", tags=["Resumen"])


@router.get("/mensual")
def resumen_mensual(
    mes: int = date.today().month,
    anio: int = date.today().year,
    db: Session = Depends(get_db)
):
    cuotas = db.query(Cuota)\
        .join(Cuenta)\
        .filter(Cuota.pagada == False)\
        .all()

    resumen = []

    for cuota in cuotas:
        cuenta = cuota.cuenta

        if not cuota_es_del_mes(cuenta.fecha_inicio, cuota.numero, mes, anio):
            continue

        tarjeta = cuenta.tarjeta
        banco = tarjeta.banco if tarjeta else None

        resumen.append({
            "cuenta": cuenta.nombre,
            "cuota": cuota.numero,
            "monto": cuota.monto,
            "tarjeta": tarjeta.nombre if tarjeta else "Sin tarjeta",
            "banco": banco.nombre if banco else "Sin banco"
        })

    return resumen



@router.get("/mensual")
def resumen_mensual(
    mes: int = date.today().month,
    anio: int = date.today().year,
    db: Session = Depends(get_db)
):
    cuotas = (
        db.query(Cuota)
        .join(Cuenta)
        .filter(Cuota.pagada == False)
        .all()
    )

    resumen = []

    for cuota in cuotas:
        cuenta = cuota.cuenta

        if not cuota_es_del_mes(
            cuenta.fecha_inicio,
            cuota.numero,
            mes,
            anio
        ):
            continue

        tarjeta = cuenta.tarjeta
        banco = tarjeta.banco if tarjeta else None

        resumen.append({
            "cuenta": cuenta.nombre,
            "cuota": cuota.numero,
            "monto": cuota.monto,
            "tarjeta": tarjeta.nombre if tarjeta else "Sin tarjeta",
            "banco": banco.nombre if banco else "Sin banco"
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
    persona_id: Optional[int] = None,  # <--- Agregamos el parámetro opcional
    db: Session = Depends(get_db)
):
    hoy = date.today()
    mes_target = mes or hoy.month
    anio_target = anio or hoy.year
    
    # Rangos de fechas
    inicio_act, fin_act = get_rango_mes(mes_target, anio_target)
    fecha_target_dt = date(anio_target, mes_target, 1)
    fecha_previa = fecha_target_dt - relativedelta(months=1)
    inicio_ant, fin_ant = get_rango_mes(fecha_previa.month, fecha_previa.year)

    # MODIFICAMOS la función interna para que filtre por titular
    def obtener_resumen_vencimiento(f_inicio, f_fin):
        query = db.query(Cuota).join(Cuenta).filter(
            Cuenta.tipo == "egreso",
            Cuota.fecha_vencimiento >= f_inicio,
            Cuota.fecha_vencimiento < f_fin
        )
        
        # FILTRO CLAVE: Si hay persona_id, solo traemos sus cuentas
        if persona_id:
            query = query.filter(Cuenta.titular_id == persona_id)
            
        cuotas = query.all()
        
        comp = 0 
        pend = 0 
        det = {}
        for c in cuotas:
            comp += c.monto
            if not c.pagada:
                pend += c.monto
            t_nom = c.cuenta.tarjeta.nombre if c.cuenta.tarjeta else "Efectivo/Varios"
            det[t_nom] = det.get(t_nom, 0) + c.monto
        return {"total_comprometido": comp, "total_pendiente": pend, "detalle": det}

    # Ahora los datos vendrán filtrados si persona_id existe
    datos_actual = obtener_resumen_vencimiento(inicio_act, fin_act)
    datos_pasado = obtener_resumen_vencimiento(inicio_ant, fin_ant)

    # 2. Lógica de Participantes (Esto ya es específico de personas, 
    # pero podemos hacer que solo muestre a OTROS si hay un titular seleccionado)
    resumen_personas = {}
    relaciones_query = db.query(CuentaPersona).options(joinedload(CuentaPersona.persona))
    
    # Si hay titular, quizás solo queremos ver quién le debe a ÉL
    # o simplemente filtrar la lista general.
    relaciones = relaciones_query.all()
    
    for rel in relaciones:
        # Buscamos cuotas de esta relación que venzan en el mes actual o pasado y no estén pagas
        cuotas_p = db.query(Cuota).filter(
            Cuota.cuenta_id == rel.cuenta_id,
            Cuota.pagada == False,
            Cuota.fecha_vencimiento < fin_act # Todo lo pendiente hasta fin de este mes
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
    # 1. OBTENER NOMBRE DEL TITULAR
    nombre_titular = "Reporte Global"
    if persona_id:
        persona = db.query(Persona).filter(Persona.id == persona_id).first()
        if persona:
            nombre_titular = persona.nombre

    inicio, fin = get_rango_mes(mes, anio)
    
    # ... (tu lógica de consulta de cuotas filtrada por persona_id) ...
    query = db.query(Cuota).join(Cuenta).filter(
        Cuota.fecha_vencimiento >= inicio,
        Cuota.fecha_vencimiento < fin
    )
    if persona_id:
        query = query.filter(Cuenta.titular_id == persona_id)
    
    cuotas = query.options(joinedload(Cuota.cuenta).joinedload(Cuenta.tarjeta)).all()
    movimientos_finales = []
    resumen_tarjetas_credito = {} # Solo para tipo == "credito"
    t_ingresos = 0
    t_egresos = 0

    for c in cuotas:
        monto = c.monto
        tipo_cuenta = c.cuenta.tipo.lower()
        tarjeta = c.cuenta.tarjeta
        
        if tipo_cuenta == "ingreso":
            t_ingresos += monto
            movimientos_finales.append({
                "fecha": c.fecha_vencimiento.strftime("%d/%m/%Y"),
                "concepto": c.cuenta.nombre,
                "tipo": "ingreso",
                "monto": monto,
                "info": "Ingreso Directo"
            })
        else:
            t_egresos += monto
            # LÓGICA SELECTIVA: Agrupar solo si es Tarjeta de CRÉDITO
            if tarjeta and tarjeta.tipo.lower() == "credito":
                nombre_t = tarjeta.nombre
                if nombre_t not in resumen_tarjetas_credito:
                    resumen_tarjetas_credito[nombre_t] = 0
                resumen_tarjetas_credito[nombre_t] += monto
            else:
                # Si es Débito, Efectivo o no tiene tarjeta, se muestra individual
                info_pago = f"Tarjeta Débito: {tarjeta.nombre}" if tarjeta else "Efectivo/Otro"
                movimientos_finales.append({
                    "fecha": c.fecha_vencimiento.strftime("%d/%m/%Y"),
                    "concepto": c.cuenta.nombre,
                    "tipo": "egreso",
                    "monto": monto,
                    "info": info_pago
                })

    # Generamos las líneas de resumen para las tarjetas de crédito
    # Usamos el mes anterior para el label del periodo de consumo
    dt_periodo = date(anio, mes, 1) - relativedelta(months=1)
    periodo_consumos = dt_periodo.strftime("%m/%Y")

    for tarjeta, total in resumen_tarjetas_credito.items():
        movimientos_finales.append({
            "fecha": f"01/{mes:02d}/{anio}", # Fecha simbólica de inicio de mes/vencimiento
            "concepto": f"PAGO RESUMEN TARJETA {tarjeta}",
            "tipo": "egreso",
            "monto": total,
            "info": f"Consumos agrupados del periodo {periodo_consumos}"
        })

    return {
        "titular": nombre_titular,  # <--- Nuevo campo
        "periodo": f"{mes}/{anio}",
        "movimientos": sorted(movimientos_finales, key=lambda x: x['fecha']),
        "resumen": {
            "total_ingresos": t_ingresos,
            "total_egresos": t_egresos,
            "balance_neto": t_ingresos - t_egresos
        }
    }