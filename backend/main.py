from fastapi import FastAPI

from routers import persona, cuenta, banco, tarjeta, cuenta_persona, pago, finanzas, resumen
from database import Base, engine

# importar modelos para que SQLAlchemy los conozca
from models import persona as persona_model
from models import cuenta as cuenta_model
from models import banco as banco_model
from models import tarjeta as tarjeta_model

# CREAR APP
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:5173"]  # tu frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Crear las tablas
Base.metadata.create_all(bind=engine)

# Incluir routers
app.include_router(persona.router)
app.include_router(cuenta.router)
app.include_router(banco.router)
app.include_router(tarjeta.router)
app.include_router(cuenta_persona.router)
app.include_router(pago.router)
app.include_router(finanzas.router)
app.include_router(resumen.router)


@app.get("/")
def root():
    return {"message": "API funcionando 🚀"}
