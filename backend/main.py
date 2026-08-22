from fastapi import FastAPI


from database import engine, Base
import models

from routers import clients
from routers import products
from routers import tenders
from routers import auth
from routers import users
from routers import payments

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Sistema de Licitaciones"
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