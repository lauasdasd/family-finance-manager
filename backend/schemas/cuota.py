from pydantic import BaseModel
from typing import Optional
from datetime import date

class CuotaOut(BaseModel):
    id: int
    numero: int
    monto: int
    pagada: bool
    fecha_pago: Optional[date]

    class Config:
        from_attributes = True
