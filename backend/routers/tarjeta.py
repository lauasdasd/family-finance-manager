from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from typing import Optional # Asegúrate de tener este import arriba
from models.tarjeta import Tarjeta
from models.cuota import Cuota
from models.cuenta import Cuenta as Movimiento 
from models.cuenta_persona import CuentaPersona
from schemas.tarjeta import TarjetaCreate, TarjetaOut
from datetime import date
from utils.fechas import cuota_es_del_mes

router = APIRouter(prefix="/tarjetas", tags=["Tarjetas"])

@router.post("/", response_model=TarjetaOut)
def crear_tarjeta(tarjeta: TarjetaCreate, db: Session = Depends(get_db)):
    nueva = Tarjeta(**tarjeta.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva  # devolvemos directamente la instancia

@router.get("/", response_model=list[TarjetaOut])
def listar_tarjetas(db: Session = Depends(get_db)):
    return db.query(Tarjeta).filter(Tarjeta.activo == True).all()


@router.put("/{tarjeta_id}")
def actualizar_tarjeta(tarjeta_id: int, tarjeta_data: dict, db: Session = Depends(get_db)):
    db_tarjeta = db.query(Tarjeta).filter(Tarjeta.id == tarjeta_id).first()
    if not db_tarjeta:
        return {"error": "No encontrada"}
    
    for key, value in tarjeta_data.items():
        setattr(db_tarjeta, key, value)
    
    db.commit()
    return {"status": "ok"}

@router.delete("/{tarjeta_id}")
def desactivar_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    tarjeta = db.query(Tarjeta).filter(Tarjeta.id == tarjeta_id).first()

    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    tarjeta.activo = False
    db.commit()
    return {"message": "Tarjeta desactivada"}

@router.patch("/{tarjeta_id}/activar")
def activar_tarjeta(tarjeta_id: int, db: Session = Depends(get_db)):
    tarjeta = db.query(Tarjeta).filter(Tarjeta.id == tarjeta_id).first()

    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    tarjeta.activo = True
    db.commit()
    return {"message": "Tarjeta reactivada"}

@router.get("/{persona_id}/tarjetas", response_model=list[TarjetaOut])
def listar_tarjetas_por_persona(persona_id: int, db: Session = Depends(get_db)):
    # 1. Consultamos la base de datos
    tarjetas = (
        db.query(Tarjeta)
        # 2. Cargamos las relaciones necesarias para que el esquema no falle
        .options(joinedload(Tarjeta.banco), joinedload(Tarjeta.persona))
        .filter(Tarjeta.persona_id == persona_id)
        .filter(Tarjeta.activo == True)
        .all()
    )

    # 3. Devolvemos la lista de objetos directamente
    # Pydantic (TarjetaOut) se encargará de convertirlos al JSON correcto
    return tarjetas

@router.get("/{tarjeta_id}/resumen")
def obtener_resumen_tarjeta(tarjeta_id: int, mes: int, anio: int, db: Session = Depends(get_db)):
    fecha_inicio = date(anio, mes, 1)
    proximo_mes = mes + 1 if mes < 12 else 1
    proximo_anio = anio if mes < 12 else anio + 1
    fecha_fin = date(proximo_anio, proximo_mes, 1)

    # 1. Traemos las cuotas con sus relaciones
    cuotas = db.query(Cuota).join(Movimiento).options(
        joinedload(Cuota.cuenta).joinedload(Movimiento.titular),
        joinedload(Cuota.cuenta).joinedload(Movimiento.personas).joinedload(CuentaPersona.persona),
        joinedload(Cuota.cuenta).joinedload(Movimiento.cuotas) # Cargamos la lista de cuotas para contar
    ).filter(
        Movimiento.tarjeta_id == tarjeta_id,
        Cuota.fecha_vencimiento >= fecha_inicio,
        Cuota.fecha_vencimiento < fecha_fin
    ).all()

    total_mes = sum(c.monto for c in cuotas)
    pagado = sum(c.monto for c in cuotas if c.pagada)
    
    detalles = []
    for c in cuotas:
        # 2. CALCULAMOS EL TOTAL: contamos cuántas cuotas tiene esta cuenta
        total_cuotas_cuenta = len(c.cuenta.cuotas)
        
        nombres_participantes = [p.persona.nombre for p in c.cuenta.personas]
        
        detalles.append({
            "fecha": c.fecha_vencimiento,
            "descripcion": c.cuenta.nombre,
            "monto": c.monto,
            # 3. AHORA SÍ: numero de cuota actual / total de cuotas
            "cuota_nro": f"{c.numero}/{total_cuotas_cuenta}", 
            "pagada": c.pagada,
            "tipo": c.cuenta.tipo,
            "involucrados": {
                "titular": c.cuenta.titular.nombre if c.cuenta.titular else "S/T",
                "participantes": nombres_participantes
            }
        })

    return {
        "total_resumen": total_mes,
        "total_pagado": pagado,
        "total_pendiente": total_mes - pagado,
        "movimientos": detalles,
        "ingresos": 0,
        "egresos": total_mes
    }

@router.get("/{tarjeta_id}/saldo")
def obtener_saldo_debito(
    tarjeta_id: int, 
    mes: Optional[int] = None, 
    anio: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    # 1. Definir rango de fechas
    hoy = date.today()
    m = mes if mes is not None else hoy.month
    a = anio if anio is not None else hoy.year
    
    fecha_inicio = date(a, m, 1)
    proximo_mes = m + 1 if m < 12 else 1
    proximo_anio = a if m < 12 else a + 1
    fecha_fin = date(proximo_anio, proximo_mes, 1)

    # 2. Consultar Totales
    ingresos = db.query(func.sum(Cuota.monto)).join(Movimiento).filter(
        Movimiento.tarjeta_id == tarjeta_id,
        Movimiento.tipo == "ingreso",
        Cuota.fecha_vencimiento >= fecha_inicio,
        Cuota.fecha_vencimiento < fecha_fin
    ).scalar() or 0

    egresos = db.query(func.sum(Cuota.monto)).join(Movimiento).filter(
        Movimiento.tarjeta_id == tarjeta_id,
        Movimiento.tipo == "egreso",
        Cuota.fecha_vencimiento >= fecha_inicio,
        Cuota.fecha_vencimiento < fecha_fin
    ).scalar() or 0

    # 3. Consultar Movimientos Detallados
    # NOTA: Usamos .personas porque así está en tu back_populates
    movimientos = (
        db.query(Cuota)
        .join(Movimiento)
        .options(
            joinedload(Cuota.cuenta).joinedload(Movimiento.titular),
            joinedload(Cuota.cuenta).joinedload(Movimiento.personas).joinedload(CuentaPersona.persona)
        )
        .filter(
            Movimiento.tarjeta_id == tarjeta_id,
            Cuota.fecha_vencimiento >= fecha_inicio,
            Cuota.fecha_vencimiento < fecha_fin
        )
        .order_by(Cuota.fecha_vencimiento.asc())
        .all()
    )

    detalles = []
    for c in movimientos:
        # Aquí también usamos .personas
        nombres_participantes = [p.persona.nombre for p in c.cuenta.personas]
        
        detalles.append({
            "fecha": c.fecha_vencimiento,
            "descripcion": c.cuenta.nombre,
            "monto": c.monto,
            "tipo": c.cuenta.tipo, 
            "cuota_nro": c.numero,
            "involucrados": {
                "titular": c.cuenta.titular.nombre if c.cuenta.titular else "S/T",
                "participantes": nombres_participantes
            }
        })

    return {
        "ingresos_mes": ingresos,
        "egresos_mes": egresos,
        "balance_mes": ingresos - egresos,
        "movimientos": detalles
    }

@router.post("/{tarjeta_id}/pagar-resumen")
def pagar_resumen_tarjeta(
    tarjeta_id: int, 
    mes: int = Query(...), 
    anio: int = Query(...), 
    db: Session = Depends(get_db)
):
    # Buscamos todas las cuotas de esa tarjeta
    cuotas = db.query(Cuota).join(Movimiento).filter(
        Movimiento.tarjeta_id == tarjeta_id,
        Cuota.pagada == False  # Solo las que faltan pagar
    ).all()

    cuotas_pagadas_count = 0
    for c in cuotas:
        # Usamos tu utilidad de fechas para filtrar
        if cuota_es_del_mes(c.cuenta.fecha_inicio, c.numero, mes, anio):
            c.pagada = True
            c.fecha_pago = date.today()
            cuotas_pagadas_count += 1

    if cuotas_pagadas_count == 0:
        raise HTTPException(status_code=400, detail="No hay cuotas pendientes para este periodo")
    # Cambiamos el error por un mensaje informativo
    if cuotas_pagadas_count == 0:
        return {"message": "El resumen ya estaba pagado", "status": "already_paid"}

    db.commit()
    return {"message": f"Se marcaron {cuotas_pagadas_count} cuotas como pagadas", "status": "success"}