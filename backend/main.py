from fastapi import FastAPI
from routers import persona

app = FastAPI(title="Family Finance Manager API")

app.include_router(persona.router)

@app.get("/")
def root():
    return {"message": "API funcionando 🚀"}
