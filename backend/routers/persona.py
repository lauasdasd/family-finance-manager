from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, get_db
from models.persona import Persona
from schemas.persona import PersonaCreate, PersonaResponse, PersonaUpdate
from database import Base

router = APIRouter(
    prefix="/personas",
    tags=["Personas"]
)

# --- RUTAS DE PERSONAS ---

@router.get("/", response_model=list[PersonaResponse])
def listar_personas(db: Session = Depends(get_db)):
    return db.query(Persona).all()

@router.post("/", response_model=PersonaResponse)
def crear_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    nueva_persona = Persona(nombre=persona.nombre, tipo=persona.tipo)
    db.add(nueva_persona)
    db.commit()
    db.refresh(nueva_persona)
    return nueva_persona

@router.patch("/{persona_id}/desactivar")
def desactivar_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    persona.activo = False
    db.commit()
    return {"message": "Persona desactivada"}

@router.patch("/{persona_id}/activar")
def activar_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    persona.activo = True
    db.commit()
    return {"message": "Persona activada"}

# --- DETALLE DE CUENTAS POR PERSONA ---

@router.get("/{persona_id}/cuentas")
def listar_cuentas_de_persona(persona_id: int, db: Session = Depends(get_db)):
    # Importamos dentro de la función para evitar Circular Imports y errores de carga
    from models.cuenta import Cuenta
    from models.cuenta_persona import CuentaPersona
    from models.cuota import Cuota
    
    # 1. Buscamos cuentas donde es participante (CuentaPersona)
    participaciones = (
        db.query(Cuenta)
        .join(CuentaPersona, Cuenta.id == CuentaPersona.cuenta_id)
        .filter(CuentaPersona.persona_id == persona_id)
        .all()
    )
    
    # 2. Buscamos cuentas donde es el titular (Cuenta.titular_id)
    titularidades = (
        db.query(Cuenta)
        .filter(Cuenta.titular_id == persona_id)
        .all()
    )
    
    # Combinamos ambas listas evitando duplicados usando un set de IDs
    dict_cuentas = {c.id: c for c in (participaciones + titularidades)}
    resultados = list(dict_cuentas.values())
    
    respuesta = []
    for cuenta in resultados:
        # Buscamos el monto en la tabla Cuota
        cuota = db.query(Cuota).filter(Cuota.cuenta_id == cuenta.id).first()
        
        respuesta.append({
            "id": cuenta.id,
            "nombre": cuenta.nombre,
            "tipo": cuenta.tipo,
            "monto": cuota.monto if cuota else 0
        })
    
    return respuesta