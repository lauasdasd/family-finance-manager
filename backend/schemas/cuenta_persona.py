from pydantic import BaseModel

class CuentaPersonaCreate(BaseModel):
    persona_id: int
    monto_asignado: float

class CuentaPersonaResponse(CuentaPersonaCreate):
    id: int

    class Config:
        from_attributes = True
