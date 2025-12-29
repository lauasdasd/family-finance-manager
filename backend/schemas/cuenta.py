from pydantic import BaseModel

class CuentaBase(BaseModel):
    nombre: str
    tipo: str
    titular_id: int

class CuentaCreate(CuentaBase):
    pass

class CuentaOut(CuentaBase):
    id: int

    class Config:
        from_attributes = True
class CuentaUpdate(CuentaBase):
    pass

class CuentaResponse(CuentaBase):
    id: int

    class Config:
        from_attributes = True