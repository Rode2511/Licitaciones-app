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


# Crear usuario
# Solo los administradores pueden crear otros usuarios
@router.post("/")
def create_user(
    user: schemas.AdminUserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
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


    allowed_roles = [
        "admin",
        "user"
    ]


    if user.role not in allowed_roles:

        raise HTTPException(
            status_code=400,
            detail="El rol debe ser admin o user"
        )


    # Buscar al administrador autenticado
    db_user = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()


    new_user = models.User(
        email=user.email,
        password=hash_password(
            user.password
        ),
        role=user.role,
        created_by=db_user.id if db_user else None,
        updated_by=db_user.id if db_user else None
    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return {
        "mensaje": "Usuario creado",
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "created_by": new_user.created_by,
        "created_at": new_user.created_at
    }


# Listar usuarios
@router.get(
    "/",
    response_model=list[schemas.UserResponse]
)
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin"])
    )
):

    return db.query(
        models.User
    ).all()