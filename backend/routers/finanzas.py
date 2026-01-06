from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from datetime import datetime, date
from models.cuenta import Cuenta
from models.cuota import Cuota
from typing import Optional

router = APIRouter(prefix="/finanzas", tags=["Finanzas"])

# backend/routers/finanzas.py

@router.get("/balance/{titular_id}")
def obtener_balance(
    titular_id: int, 
    mes: Optional[int] = None, 
    anio: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    hoy = date.today()
    m = mes if mes is not None else hoy.month
    a = anio if anio is not None else hoy.year

    fecha_inicio = date(a, m, 1)
    if m == 12:
        fecha_fin = date(a + 1, 1, 1)
    else:
        fecha_fin = date(a, m + 1, 1)

    # 1. INGRESOS: Todo lo que entró en el mes (pagado)
    total_ingresos = db.query(func.sum(Cuota.monto)).join(Cuenta).filter(
        Cuenta.titular_id == titular_id,
        Cuenta.tipo == "ingreso",
        Cuota.pagada == True,
        Cuota.fecha_vencimiento >= fecha_inicio,
        Cuota.fecha_vencimiento < fecha_fin
    ).scalar() or 0

    # 2. EGRESOS PAGADOS: Todo lo que ya pagaste este mes
    # (Importante: lo que efectivamente se pagó en este rango de fechas)
    total_egresos = db.query(func.sum(Cuota.monto)).join(Cuenta).filter(
        Cuenta.titular_id == titular_id,
        Cuenta.tipo == "egreso",
        Cuota.pagada == True,
        Cuota.fecha_vencimiento >= fecha_inicio,
        Cuota.fecha_vencimiento < fecha_fin
    ).scalar() or 0

    # 3. DEUDAS PENDIENTES: Lo que vence este mes (o antes) y no se pagó
    total_deuda_acumulada = db.query(func.sum(Cuota.monto)).join(Cuenta).filter(
        Cuenta.titular_id == titular_id,
        Cuenta.tipo == "egreso",
        Cuota.pagada == False,
        Cuota.fecha_vencimiento < fecha_fin  # Aquí incluimos el "arrastre"
    ).scalar() or 0

    return {
        "total_ingresos": total_ingresos,
        "total_egresos": total_egresos,
        "saldo_en_mano": total_ingresos - total_egresos,
        "deudas_pendientes": total_deuda_acumulada,
        "total_comprometido_mes": total_egresos + total_deuda_acumulada
    }