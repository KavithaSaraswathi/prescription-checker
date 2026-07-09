from fastapi import FastAPI

app = FastAPI(title="Prescription Authenticity Checker API")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}