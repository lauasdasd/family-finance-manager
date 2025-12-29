from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.cuenta import Cuenta
from schemas.cuenta import CuentaCreate, CuentaOut, CuentaUpdate, CuentaResponse

router = APIRouter(
    prefix="/cuentas",
    tags=["Cuentas"]
)

@router.post("/")
def create_cuenta(cuenta: CuentaCreate, db: Session = Depends(get_db)):
    nueva = Cuenta(**cuenta.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/")
def get_cuentas(db: Session = Depends(get_db)):
    return db.query(Cuenta).all()


@router.put("/{cuenta_id}")
def update_cuenta(
    cuenta_id: int,
    cuenta: CuentaUpdate,
    db: Session = Depends(get_db)
):
    db_cuenta = db.query(Cuenta).filter(Cuenta.id == cuenta_id).first()

    if not db_cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    db_cuenta.nombre = cuenta.nombre
    db_cuenta.tipo = cuenta.tipo

    db.commit()
    db.refresh(db_cuenta)
    return db_cuenta

@router.delete("/{cuenta_id}")
def delete_cuenta(cuenta_id: int, db: Session = Depends(get_db)):
    db_cuenta = db.query(Cuenta).filter(Cuenta.id == cuenta_id).first()

    if not db_cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    db.delete(db_cuenta)
    db.commit()
    return {"message": "Cuenta eliminada correctamente"}