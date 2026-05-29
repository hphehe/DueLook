from fastapi import FastAPI

from controllers.auth_controller import router as auth_router
from controllers.email_controller import router as email_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(email_router)


@app.get("/")
def health():
    return {"status": "ok"}
