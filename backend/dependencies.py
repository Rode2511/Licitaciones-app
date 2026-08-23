import os

from dotenv import load_dotenv

from fastapi import (
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer
)

from jose import (
    JWTError,
    jwt
)


load_dotenv()


SECRET_KEY = os.getenv(
    "SECRET_KEY"
)

ALGORITHM = "HS256"


if not SECRET_KEY:

    raise RuntimeError(
        "La variable SECRET_KEY no está configurada"
    )


security = HTTPBearer()


def get_current_user(
    credentials:
        HTTPAuthorizationCredentials
        = Depends(security)
):

    token = credentials.credentials


    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ]
        )


        email = payload.get(
            "sub"
        )


        role = payload.get(
            "role"
        )


        if not email or not role:

            raise HTTPException(
                status_code=
                    status.HTTP_401_UNAUTHORIZED,
                detail=
                    "Token inválido"
            )


        return {
            "email": email,
            "role": role
        }


    except JWTError:

        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,
            detail=
                "Token inválido o expirado"
        )


def require_role(
    allowed_roles: list[str]
):

    def role_checker(
        current_user=Depends(
            get_current_user
        )
    ):

        if (
            current_user["role"]
            not in allowed_roles
        ):

            raise HTTPException(
                status_code=
                    status.HTTP_403_FORBIDDEN,
                detail=
                    "No tienes permisos para realizar esta acción"
            )


        return current_user


    return role_checker