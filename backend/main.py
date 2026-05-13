from fastapi import FastAPI, UploadFile, File, HTTPException
from schemas import AnalyzedEmail
from file_parser import parse_eml
from llm_service import analyze

app = FastAPI()


@app.get("/")
def read_root():
    return {"status": "You are running!"}


@app.post("/emails/import", response_model=AnalyzedEmail)
async def import_emails(file: UploadFile = File(...)):
    name = file.filename or ""
    if not name.endswith(".eml"):
        raise HTTPException(status_code=400, detail="Only .eml files are supported")
    content = await file.read()
    record = parse_eml(content, name)
    return analyze(record)
