from sqlalchemy import Column, Integer, Boolean, ForeignKey, Date, Float
from sqlalchemy.orm import relationship 
from database import Base

class Cuota(Base):
    __tablename__ = "cuotas"

    id = Column(Integer, primary_key=True, index=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas.id"), nullable=False)
    numero = Column(Integer, nullable=False)
    monto = Column(Float, nullable=False) # Cambié a Float por consistencia
    pagada = Column(Boolean, default=False)
    fecha_vencimiento = Column(Date, nullable=False)
    fecha_pago = Column(Date, nullable=True)

    cuenta = relationship("Cuenta", back_populates="cuotas")