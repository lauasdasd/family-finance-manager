from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models.persona import Persona
from schemas.persona import PersonaCreate, PersonaResponse
from database import Base

router = APIRouter(
    prefix="/personas",
    tags=["Personas"]
)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=PersonaResponse)
def crear_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    nueva_persona = Persona(
        nombre=persona.nombre,
        tipo=persona.tipo
    )
    db.add(nueva_persona)
    db.commit()
    db.refresh(nueva_persona)
    return nueva_persona

@router.get("/", response_model=list[PersonaResponse])
def listar_personas(db: Session = Depends(get_db)):
    return db.query(Persona).all()
