from pydantic import BaseModel

class BancoBase(BaseModel):
    nombre: str

class BancoCreate(BancoBase):
    pass

class Banco(BancoBase):
    id: int
    activo: bool

    class Config:
        from_attributes = True
