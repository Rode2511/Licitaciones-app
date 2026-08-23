import os

from database import SessionLocal

import models

from services.auth_service import hash_password


def ensure_admin_user():

    admin_email = os.getenv(
        "ADMIN_EMAIL"
    )

    admin_password = os.getenv(
        "ADMIN_PASSWORD"
    )


    if not admin_email or not admin_password:

        print(
            "Administrador inicial no configurado"
        )

        return


    db = SessionLocal()


    try:

        existing_admin = db.query(
            models.User
        ).filter(
            models.User.email == admin_email
        ).first()


        if existing_admin:

            print(
                "Administrador inicial ya existe"
            )

            return


        admin = models.User(
            email=admin_email,
            password=hash_password(
                admin_password
            ),
            role="admin",
            created_by=None,
            updated_by=None
        )


        db.add(admin)

        db.commit()


        print(
            "Administrador inicial creado"
        )


    except Exception as error:

        db.rollback()

        print(
            "Error creando administrador inicial:",
            error
        )

        raise


    finally:

        db.close()