from sqlalchemy import Column, Integer, ForeignKey, Float
from database import Base
from sqlalchemy.orm import relationship

class CuentaPersona(Base):
    __tablename__ = "cuenta_persona"

    id = Column(Integer, primary_key=True, index=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas.id"), nullable=False)
    persona_id = Column(Integer, ForeignKey("personas.id"), nullable=False)

    monto_asignado = Column(Float, nullable=False)

    cuenta = relationship(
        "Cuenta",
        back_populates="personas"
    )

    persona = relationship(
        "Persona",
        back_populates="cuentas_participadas"
    )
