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


def get_db_user(
    db: Session,
    current_user
):

    return db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()


@router.post("/{tender_id}")
def create_payment(
    tender_id: int,
    payment: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
    )
):

    # Buscar licitación
    tender = db.query(models.Tender).filter(
        models.Tender.id == tender_id
    ).first()


    if not tender:

        raise HTTPException(
            status_code=404,
            detail="Licitación no encontrada"
        )


    # Solo se permiten pagos en estado por_cobrar
    if tender.status != "por_cobrar":

        raise HTTPException(
            status_code=400,
            detail="La licitación no está pendiente de cobro"
        )


    # El pago debe ser mayor que cero
    if payment.amount <= 0:

        raise HTTPException(
            status_code=400,
            detail="El monto del pago debe ser mayor que cero"
        )


    # Buscar usuario autenticado
    db_user = get_db_user(
        db,
        current_user
    )


    # Obtener productos de la licitación
    products = db.execute(
        models.tender_products.select().where(
            models.tender_products.c.tender_id == tender_id
        )
    ).fetchall()


    if not products:

        raise HTTPException(
            status_code=400,
            detail="La licitación no tiene productos facturados"
        )


    # Calcular total facturado
    total_facturado = round(
        sum(
            item.quantity * item.price
            for item in products
        ),
        2
    )


    # Obtener pagos anteriores
    previous_payments = db.query(
        models.Payment
    ).filter(
        models.Payment.tender_id == tender_id
    ).all()


    total_pagado = round(
        sum(
            previous_payment.amount
            for previous_payment in previous_payments
        ),
        2
    )


    # Calcular saldo pendiente
    saldo_pendiente = round(
        total_facturado - total_pagado,
        2
    )


    if saldo_pendiente <= 0:

        raise HTTPException(
            status_code=400,
            detail="La licitación ya no tiene saldo pendiente"
        )


    # Evitar sobrepago
    if payment.amount > saldo_pendiente:

        raise HTTPException(
            status_code=400,
            detail=(
                f"El pago supera el saldo pendiente. "
                f"Saldo actual: ${saldo_pendiente}"
            )
        )


    # Registrar pago con auditoría
    new_payment = models.Payment(
        tender_id=tender_id,
        amount=payment.amount,
        created_by=db_user.id if db_user else None,
        updated_by=db_user.id if db_user else None
    )


    db.add(new_payment)


    nuevo_saldo = round(
        saldo_pendiente - payment.amount,
        2
    )


    # Si el saldo llega a cero,
    # cambiar automáticamente a cobrada
    if nuevo_saldo == 0:

        old_status = tender.status

        tender.status = "cobrada"

        tender.updated_by = (
            db_user.id
            if db_user
            else None
        )


        history = models.StatusHistory(
            tender_id=tender.id,
            old_status=old_status,
            new_status="cobrada",
            user_id=db_user.id if db_user else None
        )


        db.add(history)


    db.commit()

    db.refresh(new_payment)


    return {
        "mensaje": "Pago registrado correctamente",
        "payment_id": new_payment.id,
        "monto_pagado": payment.amount,
        "total_facturado": total_facturado,
        "total_pagado": round(
            total_pagado + payment.amount,
            2
        ),
        "saldo_pendiente": nuevo_saldo,
        "estado": tender.status
    }