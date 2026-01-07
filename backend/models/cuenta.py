# models/cuenta.py
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Cuenta(Base):
    __tablename__ = "cuentas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    tipo = Column(String, nullable=False) # "ingreso", "egreso", "prestamo", "transferencia"
    fecha_inicio = Column(Date, nullable=False)
    anulada = Column(Boolean, default=False)
    
    titular_id = Column(Integer, ForeignKey("personas.id"))
    tarjeta_id = Column(Integer, ForeignKey("tarjetas.id"), nullable=True) 

    titular = relationship("Persona", back_populates="cuentas_titular")
    tarjeta = relationship("Tarjeta") 
    
    personas = relationship("CuentaPersona", back_populates="cuenta")
    cuotas = relationship("Cuota", back_populates="cuenta")