from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
import models
import schemas

from services.auth_service import (
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# Iniciar sesión
@router.post("/login")
def login(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()


    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas"
        )


    if not verify_password(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas"
        )


    token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )


    return {
        "access_token": token,
        "token_type": "bearer"
    }