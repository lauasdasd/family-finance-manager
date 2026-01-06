from pydantic import BaseModel
from datetime import date
from typing import List, Optional
from enum import Enum

# --- Enumeraciones ---
class TipoMovimiento(str, Enum):
    ingreso = "ingreso"
    egreso = "egreso"
    prestamo = "prestamo"
    transferencia = "transferencia"

# --- Esquemas Relacionados ---
class CuentaPersonaBase(BaseModel):
    persona_id: int
    monto_asignado: float

class CuotaOut(BaseModel):
    id: int
    numero: int
    monto: float
    pagada: bool
    fecha_vencimiento: date
    
    class Config:
        from_attributes = True

# --- Esquema de Creación (Input) ---
class CuentaCreate(BaseModel):
    nombre: str
    tipo: TipoMovimiento
    fecha_inicio: date
    titular_id: int
    monto_total: float
    cantidad_cuotas: Optional[int] = 1
    tarjeta_id: Optional[int] = None
    # ✅ AGREGAR ESTA LÍNEA PARA QUE EL BACKEND ACEPTE EL DESTINO
    tarjeta_destino_id: Optional[int] = None 
    participantes: List[CuentaPersonaBase] = []
# --- Esquema de Salida (Output) ---
class CuentaOut(BaseModel):
    id: int
    nombre: str
    tipo: str
    fecha_inicio: date
    titular_id: int
    tarjeta_id: Optional[int] = None
    cuotas: List[CuotaOut] = [] # ✅ Incluimos las cuotas en la salida

    class Config:
        from_attributes = True