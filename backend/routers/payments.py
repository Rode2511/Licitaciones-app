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

    # Buscar licitación
    tender = db.query(models.Tender).filter(
        models.Tender.id == tender_id
    ).first()


    if not tender:

        raise HTTPException(
            status_code=404,
            detail="Licitación no encontrada"
        )


    # Solo se puede pagar si está por cobrar
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


    # Obtener productos asociados a la licitación
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


    # No permitir pagar más del saldo
    if payment.amount > saldo_pendiente:

        raise HTTPException(
            status_code=400,
            detail=(
                f"El pago supera el saldo pendiente. "
                f"Saldo actual: ${saldo_pendiente}"
            )
        )


    # Registrar nuevo pago
    new_payment = models.Payment(
        tender_id=tender_id,
        amount=payment.amount
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


        # Buscar usuario autenticado
        db_user = db.query(models.User).filter(
            models.User.email == current_user["email"]
        ).first()


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