from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.exceptions import register_exception_handlers
from todos.router import router as todos_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(todos_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
