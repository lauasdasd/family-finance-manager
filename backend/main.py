from fastapi import FastAPI
from routers import persona, cuenta
from database import Base, engine

# 👇 IMPORTANTE: importar los modelos
from models import persona as persona_model
from models import cuenta as cuenta_model

app = FastAPI(title="Family Finance Manager API")

# 👇 CREA LAS TABLAS
Base.metadata.create_all(bind=engine)

app.include_router(persona.router)
app.include_router(cuenta.router)

@app.get("/")
def root():
    return {"message": "API funcionando 🚀"}
