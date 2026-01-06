from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.cuenta_persona import CuentaPersona
from schemas.cuenta_persona import CuentaPersonaCreate

router = APIRouter(prefix="/cuentas-personas", tags=["Cuenta Compartida"])

@router.post("/{cuenta_id}")
def asignar_persona(
    cuenta_id: int,
    data: CuentaPersonaCreate,
    db: Session = Depends(get_db)
):
    relacion = CuentaPersona(
        cuenta_id=cuenta_id,
        persona_id=data.persona_id,
        monto_asignado=data.monto_asignado
    )

    db.add(relacion)
    db.commit()
    db.refresh(relacion)

    return relacion
