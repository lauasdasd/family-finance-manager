from pydantic import BaseModel

class PersonaBase(BaseModel):
    nombre: str
    tipo: str

class PersonaCreate(PersonaBase):
    pass

class PersonaResponse(PersonaBase):
    id: int
    activo: bool

    class Config:
        from_attributes = True


class PersonaUpdate(PersonaBase):
    pass

class PersonaOut(PersonaBase):
    id: int

    class Config:
        from_attributes = True
