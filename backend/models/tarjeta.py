from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class Tarjeta(Base):
    __tablename__ = "tarjetas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False) # Ej: "Naranja Visa"
    banco_id = Column(Integer, ForeignKey("bancos.id"))
    persona_id = Column(Integer, ForeignKey("personas.id"))
    
    tipo = Column(String) # "credito" o "debito"
    dia_cierre = Column(Integer, nullable=True) # Solo para crédito
    dia_vencimiento = Column(Integer, nullable=True) # Solo para crédito
    limite_credito = Column(Float, nullable=True) # Opcional, para saber cuánto te queda
    activo = Column(Boolean, default=True) 

    banco = relationship("Banco")
    persona = relationship("Persona")