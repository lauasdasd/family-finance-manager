# routers/pagos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
from models.pago import Pago
from schemas.pago import PagoCreate, PagoOut

router = APIRouter(prefix="/pagos", tags=["Pagos"])


@router.post("/", response_model=PagoOut)
def crear_pago(pago: PagoCreate, db: Session = Depends(get_db)):
    nuevo = Pago(
        cuenta_id=pago.cuenta_id,
        cuota_id=pago.cuota_id,
        tarjeta_id=pago.tarjeta_id,
        cuenta_pago_id=pago.cuenta_pago_id,
        monto=pago.monto,
        fecha=date.today()
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/cuenta/{cuenta_id}", response_model=list[PagoOut])
def pagos_por_cuenta(cuenta_id: int, db: Session = Depends(get_db)):
    return db.query(Pago).filter(Pago.cuenta_id == cuenta_id).all()
