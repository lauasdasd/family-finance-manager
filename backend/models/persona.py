from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    activo = Column(Boolean, default=True)
    # Titular de cuentas
    cuentas_titular = relationship(
        "Cuenta",
        back_populates="titular"
    )

    # Participaciones (cuentas compartidas)
    cuentas_participadas = relationship(
        "CuentaPersona",
        back_populates="persona"
    )

