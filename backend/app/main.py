from fastapi import FastAPI
from app.routers import *

app = FastAPI()

# https://fastapi.tiangolo.com/tutorial/first-steps/


@app.get("/")
async def root():
    return {"message": "Hello World"}
