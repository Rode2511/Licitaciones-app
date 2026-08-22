from fastapi import HTTPException
from sqlalchemy.orm import Session

import models

from services.email_service import send_email



def send_tender_service(
    tender_id: int,
    db: Session
):

    tender = db.query(models.Tender).filter(
        models.Tender.id == tender_id
    ).first()


    if not tender:
        raise HTTPException(
            status_code=404,
            detail="Licitación no encontrada"
        )


    if tender.status != "borrador":

        raise HTTPException(
            status_code=400,
            detail="Solo se pueden enviar licitaciones en borrador"
        )


    if not tender.proposal_url:

        raise HTTPException(
            status_code=400,
            detail="La licitación necesita una propuesta adjunta"
        )


    products = db.execute(
        models.tender_products.select().where(
            models.tender_products.c.tender_id == tender_id
        )
    ).fetchall()


    if not products:

        raise HTTPException(
            status_code=400,
            detail="La licitación no tiene productos"
        )


    total = sum(
        item.quantity * item.price
        for item in products
    )


    if total > tender.budget:

        raise HTTPException(
            status_code=400,
            detail="El total supera el presupuesto"
        )


    old_status = tender.status

    tender.status = "activa"


    history = models.StatusHistory(
        tender_id=tender.id,
        old_status=old_status,
        new_status="activa"
    )


    db.add(history)


    send_email(
        tender.client.email,
        "Licitación enviada",
        f"La licitación {tender.title} fue enviada correctamente",
        tender.proposal_url
    )


    db.commit()


    return {
        "mensaje": "Licitación enviada",
        "estado": "activa"
    }