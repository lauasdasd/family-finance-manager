from pydantic import BaseModel
from typing import Optional

class TarjetaBase(BaseModel):
    nombre: str
    persona_id: int
    banco_id: int
    tipo: str = "credito" # Agregalo si no estaba
    dia_cierre: Optional[int] = None 
    dia_vencimiento: Optional[int] = None
    limite_credito: Optional[float] = 0.0

class TarjetaCreate(TarjetaBase):
    pass

class TarjetaUpdate(BaseModel):
    nombre: Optional[str]
    limite_credito: Optional[float] # <--- Cambiado de 'limite'

class BancoSimple(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True # Esto permite leer objetos de SQLAlchemy

class PersonaSimple(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True # Esto permite leer objetos de SQLAlchemy

class TarjetaOut(BaseModel):
    id: int
    nombre: str
    limite_credito: Optional[float] # <--- Cambiado de 'limite'
    tipo: str
    dia_cierre: Optional[int]
    dia_vencimiento: Optional[int]
    activo: bool
    banco: BancoSimple
    persona: PersonaSimple

    class Config:
        from_attributes = True
