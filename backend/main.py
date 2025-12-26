from fastapi import FastAPI

app = FastAPI(title="Family Finance Manager API")

@app.get("/")
def root():
    return {"message": "API funcionando 🚀"}
