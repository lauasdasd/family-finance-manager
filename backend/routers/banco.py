from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.banco import Banco
from schemas.banco import BancoCreate, Banco as BancoSchema

router = APIRouter(
    prefix="/bancos",
    tags=["Bancos"]
)

@router.post("/", response_model=BancoSchema)
def create_banco(banco: BancoCreate, db: Session = Depends(get_db)):
    db_banco = Banco(nombre=banco.nombre)
    db.add(db_banco)
    db.commit()
    db.refresh(db_banco)
    return db_banco

@router.get("/", response_model=list[BancoSchema])
def get_bancos(db: Session = Depends(get_db)):
    return db.query(Banco).filter(Banco.activo == True).all()

@router.put("/{banco_id}", response_model=BancoSchema)
def update_banco(
    banco_id: int,
    banco: BancoCreate,
    db: Session = Depends(get_db)
):
    db_banco = db.query(Banco).filter(
        Banco.id == banco_id,
        Banco.activo == True
    ).first()

    if not db_banco:
        raise HTTPException(status_code=404, detail="Banco no encontrado")

    db_banco.nombre = banco.nombre
    db.commit()
    db.refresh(db_banco)

    return db_banco


@router.delete("/{banco_id}")
def delete_banco(banco_id: int, db: Session = Depends(get_db)):
    db_banco = db.query(Banco).filter(
        Banco.id == banco_id,
        Banco.activo == True
    ).first()

    if not db_banco:
        raise HTTPException(status_code=404, detail="Banco no encontrado")

    db_banco.activo = False
    db.commit()

    return {"message": "Banco desactivado correctamente"}

@router.patch("/bancos/{banco_id}/activar")
def activar_banco(banco_id: int, db: Session = Depends(get_db)):
    banco = db.query(Banco).filter(Banco.id == banco_id).first()

    if not banco:
        raise HTTPException(status_code=404, detail="Banco no encontrado")

    banco.activo = True
    db.commit()
    db.refresh(banco)

    return {
        "message": "Banco reactivado correctamente",
        "banco": banco
    }
