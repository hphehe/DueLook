from fastapi import FastAPI
import os
from controllers.auth_controller import router as auth_router
from controllers.email_controller import router as email_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in _origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(email_router)


@app.get("/")
def health():
    return {"status": "ok"}
