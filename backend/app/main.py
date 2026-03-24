from fastapi import FastAPI
from app.routers import auth, categories, chat, events, swipes, users

app = FastAPI()

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(chat.router)
app.include_router(events.router)
app.include_router(swipes.router)
app.include_router(users.router)

# https://fastapi.tiangolo.com/tutorial/first-steps/


@app.get("/")
async def root():
    return {"message": "Hello World"}
