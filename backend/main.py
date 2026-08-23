from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import engine, Base

import models

from routers import clients
from routers import products
from routers import tenders
from routers import auth
from routers import users
from routers import payments

from services.scheduler_service import (
    start_scheduler,
    stop_scheduler
)


Base.metadata.create_all(
    bind=engine
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    start_scheduler()

    yield

    stop_scheduler()



app = FastAPI(
    title="Sistema de Licitaciones",
    lifespan=lifespan
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
    auth.router
)

app.include_router(
    users.router
)

app.include_router(
    payments.router
)


@app.get("/")
def home():

    return {
        "mensaje": "API funcionando"
    }