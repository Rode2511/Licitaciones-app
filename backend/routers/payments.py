from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from dependencies import require_role

import models
import schemas


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



@router.post("/{tender_id}")
def create_payment(
    tender_id: int,
    payment: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin", "ejecutivo"])
    )
):


    tender = db.query(models.Tender).filter(
        models.Tender.id == tender_id
    ).first()


    if not tender:

        raise HTTPException(
            status_code=404,
            detail="Licitación no encontrada"
        )


    if tender.status != "por_cobrar":

        raise HTTPException(
            status_code=400,
            detail="La licitación no está pendiente de cobro"
        )


    new_payment = models.Payment(

        tender_id=tender_id,

        amount=payment.amount

    )


    db.add(new_payment)


    old_status = tender.status


    tender.status = "cobrada"


    history = models.StatusHistory(

        tender_id=tender.id,

        old_status=old_status,

        new_status="cobrada"

    )


    db.add(history)


    db.commit()


    db.refresh(new_payment)



    return {

        "mensaje": "Pago registrado correctamente",

        "payment_id": new_payment.id,

        "estado": tender.status

    }