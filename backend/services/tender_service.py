from fastapi import HTTPException
from sqlalchemy.orm import Session

import models

from services.email_service import send_email


def send_tender_service(
    tender_id: int,
    db: Session,
    current_user
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


    # Buscar usuario autenticado
    db_user = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()


    old_status = tender.status

    tender.status = "activa"

    # Auditoría de modificación
    tender.updated_by = (
        db_user.id
        if db_user
        else None
    )


    history = models.StatusHistory(
        tender_id=tender.id,
        old_status=old_status,
        new_status="activa",
        user_id=db_user.id if db_user else None
    )


    db.add(history)


    # Crear resumen de productos
    products_html = ""


    for item in products:

        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()


        if product:

            products_html += f"""
            <li>
                {product.name} -
                Cantidad: {item.quantity} -
                Precio: ${item.price}
            </li>
            """


    message = f"""
    La licitación <b>{tender.title}</b> fue enviada correctamente.

    <br><br>

    <b>Productos:</b>

    <ul>
        {products_html}
    </ul>

    <b>Presupuesto máximo:</b>
    ${tender.budget}

    <br>

    <b>Total de productos:</b>
    ${total}

    <br>

    <b>Fecha límite:</b>
    {tender.deadline}
    """


    send_email(
        tender.client.email,
        "Licitación enviada",
        message,
        tender.proposal_url
    )


    db.commit()

    db.refresh(tender)


    return {
        "mensaje": "Licitación enviada",
        "estado": tender.status
    }