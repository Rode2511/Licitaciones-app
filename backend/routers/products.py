from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from dependencies import require_role

import models
import schemas


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# Crear producto
@router.post(
    "/",
    response_model=schemas.ProductResponse
)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
    )
):

    db_user = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()


    new_product = models.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        created_by=db_user.id if db_user else None,
        updated_by=db_user.id if db_user else None
    )


    db.add(new_product)

    db.commit()

    db.refresh(new_product)


    return new_product


# Listar productos
@router.get(
    "/",
    response_model=list[schemas.ProductResponse]
)
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
    )
):

    return db.query(
        models.Product
    ).all()