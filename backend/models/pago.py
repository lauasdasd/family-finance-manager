from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from database import Base
from datetime import date
from sqlalchemy.orm import relationship

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas.id"), nullable=False)
    persona_id = Column(Integer, ForeignKey("personas.id"), nullable=False)

    monto = Column(Float, nullable=False)
    fecha = Column(Date, default=date.today)

    cuenta = relationship("Cuenta")
    persona = relationship("Persona")
