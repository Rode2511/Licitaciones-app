import os

from contextlib import asynccontextmanager

from dotenv import load_dotenv

from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware
)

from database import (
    Base,
    engine
)

from routers import (
    auth,
    clients,
    payments,
    products,
    tenders,
    users
)

from services.scheduler_service import (
    start_scheduler,
    stop_scheduler
)


load_dotenv()


Base.metadata.create_all(
    bind=engine
)


@asynccontextmanager
async def lifespan(
    app: FastAPI
):

    start_scheduler()

    yield

    stop_scheduler()


app = FastAPI(
    title="Sistema de Licitaciones",
    lifespan=lifespan
)


# =========================================================
# CORS
# =========================================================

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]


frontend_url = os.getenv(
    "FRONTEND_URL"
)


if frontend_url:

    frontend_url = (
        frontend_url.rstrip("/")
    )


    if (
        frontend_url
        not in allowed_origins
    ):

        allowed_origins.append(
            frontend_url
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=
        allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    auth.router
)

app.include_router(
    users.router
)

app.include_router(
    clients.router
)

app.include_router(
    products.router
)

app.include_router(
    tenders.router
)

app.include_router(
    payments.router
)


@app.get("/")
def root():

    return {
        "message":
            "Sistema de Licitaciones API"
    }