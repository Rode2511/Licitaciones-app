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
    jobs,
    payments,
    products,
    tenders,
    users
)

from services.scheduler_service import (
    start_scheduler,
    stop_scheduler
)

from services.bootstrap_service import (
    ensure_admin_user
)


load_dotenv()


# =========================================================
# CREAR TABLAS
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# CICLO DE VIDA
# =========================================================

@asynccontextmanager
async def lifespan(
    app: FastAPI
):

    # Crear administrador inicial
    # solo si todavía no existe.
    ensure_admin_user()


    # Iniciar scheduler
    start_scheduler()


    yield


    # Detener scheduler al cerrar
    stop_scheduler()


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="Sistema de Licitaciones",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
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
    allow_origins=allowed_origins,
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

app.include_router(
    jobs.router
)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message":
            "Sistema de Licitaciones API"
    }