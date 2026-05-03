from fastapi import FastAPI

app = FastAPI()

@app.get("/") 
def read_root():
    return {"status": "DueLook API is running! Greetings from Batam!"}