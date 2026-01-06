# schemas/pago.py
from pydantic import BaseModel
from datetime import date
from typing import Optional

class PagoCreate(BaseModel):
    cuenta_id: int
    cuota_id: Optional[int] = None
    tarjeta_id: Optional[int] = None
    cuenta_pago_id: Optional[int] = None
    monto: float


class PagoOut(PagoCreate):
    id: int
    fecha: date

    class Config:
        from_attributes = True
