from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models.persona import Persona
from schemas.persona import PersonaCreate, PersonaResponse,  PersonaUpdate
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


@router.put("/{persona_id}")
def update_persona(
    persona_id: int,
    persona: PersonaUpdate,
    db: Session = Depends(get_db)
):
    db_persona = db.query(Persona).filter(Persona.id == persona_id).first()

    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    db_persona.nombre = persona.nombre
    db_persona.tipo = persona.tipo

    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.delete("/{persona_id}")
def delete_persona(persona_id: int, db: Session = Depends(get_db)):
    db_persona = db.query(Persona).filter(Persona.id == persona_id).first()

    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    db.delete(db_persona)
    db.commit()
    return {"message": "Persona eliminada correctamente"}

