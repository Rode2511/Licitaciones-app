from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException

from jose import jwt, JWTError

from services.auth_service import (
    SECRET_KEY,
    ALGORITHM
)


security = HTTPBearer()



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials


    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )


        email = payload.get("sub")
        role = payload.get("role")


        if not email:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )


        return {
            "email": email,
            "role": role
        }


    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )

def require_role(allowed_roles):

    def role_checker(
        current_user = Depends(get_current_user)
    ):

        if current_user["role"] not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="No tienes permisos suficientes"
            )

        return current_user


    return role_checker