import os

from fastapi import APIRouter, Header, HTTPException

from services.scheduler_service import check_tenders


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("/check-tenders")
def run_check_tenders(
    x_cron_secret: str = Header(...)
):

    expected_secret = os.getenv(
        "CRON_SECRET"
    )


    if not expected_secret:

        raise HTTPException(
            status_code=500,
            detail="CRON_SECRET no está configurado"
        )


    if x_cron_secret != expected_secret:

        raise HTTPException(
            status_code=401,
            detail="No autorizado"
        )


    check_tenders()


    return {
        "message":
            "Revisión de licitaciones ejecutada"
    }