from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

from app.core.database import create_db_and_tables
from app.routers import auth, categories, chat, events, swipes, users, preferences


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Allows all origins for development. Restrict this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(chat.router)
app.include_router(events.router)
app.include_router(swipes.router)
app.include_router(users.router)
app.include_router(preferences.router)

# https://fastapi.tiangolo.com/tutorial/first-steps/


@app.get("/")
async def root():
    return {"message": "Hello World"}
