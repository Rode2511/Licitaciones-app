from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from dependencies import require_role

import models
import schemas


router = APIRouter(
    prefix="/clients",
    tags=["Clients"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



@router.post("/", response_model=schemas.ClientResponse)
def create_client(
    client: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin", "ejecutivo"])
    )
):

    new_client = models.Client(
        name=client.name,
        company=client.company,
        email=client.email,
        phone=client.phone
    )


    db.add(new_client)
    db.commit()
    db.refresh(new_client)


    return new_client



@router.get("/", response_model=list[schemas.ClientResponse])
def get_clients(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin", "ejecutivo"])
    )
):

    clients = db.query(models.Client).all()

    return clients