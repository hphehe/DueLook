from fastapi import FastAPI

from controllers.email_controller import router as email_router

app = FastAPI()
app.include_router(email_router)


@app.get("/")
def health():
    return {"status": "ok"}
