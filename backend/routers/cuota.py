from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.cuota import Cuota
from datetime import date

router = APIRouter(prefix="/cuotas", tags=["Cuotas"])

def generar_cuotas(db, cuenta_id, monto_total, cantidad_cuotas):
    monto_cuota = monto_total // cantidad_cuotas

    for i in range(1, cantidad_cuotas + 1):
        cuota = Cuota(
            cuenta_id=cuenta_id,
            numero=i,
            monto=monto_cuota
        )
        db.add(cuota)

    db.commit()

@router.patch("/{cuota_id}/pagar")
def pagar_cuota(cuota_id: int, db: Session = Depends(get_db)):
    cuota = db.query(Cuota).filter(Cuota.id == cuota_id).first()

    if not cuota:
        raise HTTPException(status_code=404, detail="Cuota no encontrada")
    if cuota.pagada:
        raise HTTPException(status_code=400, detail="La cuota ya está pagada")

    cuota.pagada = True
    cuota.fecha_pago = date.today()
    db.commit()

    return {"message": f"Cuota {cuota.numero} pagada"}

@router.get("/cuenta/{cuenta_id}")
def cuotas_por_cuenta(cuenta_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Cuota)
        .filter(Cuota.cuenta_id == cuenta_id)
        .order_by(Cuota.numero)
        .all()
    )

