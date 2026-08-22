from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
import models
import schemas

from services.auth_service import hash_password
from dependencies import require_role


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



@router.post("/")
def create_user(
    user: schemas.AdminUserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin"])
    )
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()


    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Usuario ya existe"
        )


    new_user = models.User(

        email=user.email,

        password=hash_password(
            user.password
        ),

        role=user.role

    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return {
        "mensaje": "Usuario creado",
        "email": new_user.email,
        "role": new_user.role
    }