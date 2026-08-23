from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from services.tender_service import send_tender_service
from services.file_service import save_file

from dependencies import require_role
from database import SessionLocal

import models
import schemas


router = APIRouter(
    prefix="/tenders",
    tags=["Tenders"]
)


# =========================================================
# BASE DE DATOS
# =========================================================

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


# =========================================================
# CREAR LICITACIÓN
# =========================================================

@router.post(
    "/",
    response_model=schemas.TenderResponse
)
def create_tender(
    tender: schemas.TenderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
    )
):

    db_user = get_db_user(
        db,
        current_user
    )


    new_tender = models.Tender(
        client_id=tender.client_id,
        title=tender.title,
        description=tender.description,
        budget=tender.budget,
        deadline=tender.deadline,
        status="borrador",
        created_by=db_user.id if db_user else None,
        updated_by=db_user.id if db_user else None
    )


    db.add(new_tender)

    db.commit()

    db.refresh(new_tender)


    return new_tender


# =========================================================
# OBTENER LICITACIONES
# =========================================================

@router.get(
    "/",
    response_model=list[schemas.TenderResponse]
)
def get_tenders(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
    )
):

    return db.query(
        models.Tender
    ).all()


# =========================================================
# OBTENER DETALLE DE LICITACIÓN
# =========================================================

@router.get(
    "/{tender_id}",
    response_model=schemas.TenderDetailResponse
)
def get_tender_detail(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
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


    # -----------------------------------------------------
    # PRODUCTOS DE LA LICITACIÓN
    # -----------------------------------------------------
    #
    # No usamos directamente tender.products porque
    # necesitamos obtener también quantity y price
    # guardados en la tabla intermedia tender_products.
    # -----------------------------------------------------

    tender_product_rows = db.execute(
        models.tender_products.select().where(
            models.tender_products.c.tender_id == tender_id
        )
    ).fetchall()


    products = []


    for item in tender_product_rows:

        product = db.query(
            models.Product
        ).filter(
            models.Product.id == item.product_id
        ).first()


        if product:

            products.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "quantity": item.quantity,
                "price": item.price
            })


    # -----------------------------------------------------
    # HISTORIAL DE ESTADOS
    # -----------------------------------------------------

    history_records = db.query(
        models.StatusHistory
    ).filter(
        models.StatusHistory.tender_id == tender_id
    ).order_by(
        models.StatusHistory.created_at.asc()
    ).all()


    history = []


    for record in history_records:

        user_email = "Sistema"


        if record.user_id is not None:

            user = db.query(
                models.User
            ).filter(
                models.User.id == record.user_id
            ).first()


            if user:
                user_email = user.email


        history.append({
            "id": record.id,
            "old_status": record.old_status,
            "new_status": record.new_status,
            "user_id": record.user_id,
            "user_email": user_email,
            "created_at": record.created_at
        })


    # -----------------------------------------------------
    # RESPUESTA COMPLETA
    # -----------------------------------------------------

    return {
        "id": tender.id,
        "title": tender.title,
        "description": tender.description,
        "budget": tender.budget,
        "deadline": tender.deadline,
        "status": tender.status,
        "proposal_url": tender.proposal_url,

        "client": {
            "id": tender.client.id,
            "name": tender.client.name,
            "company": tender.client.company,
            "email": tender.client.email
        },

        "products": products,

        "history": history
    }


# =========================================================
# AGREGAR PRODUCTO
# =========================================================

@router.post(
    "/{tender_id}/products"
)
def add_product_to_tender(
    tender_id: int,
    item: schemas.TenderProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
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


    if tender.status != "borrador":

        raise HTTPException(
            status_code=400,
            detail="No se pueden modificar productos en este estado"
        )


    product = db.query(models.Product).filter(
        models.Product.id == item.product_id
    ).first()


    if not product:

        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )


    existing_product = db.execute(
        models.tender_products.select().where(
            models.tender_products.c.tender_id == tender_id,
            models.tender_products.c.product_id == item.product_id
        )
    ).first()


    if existing_product:

        raise HTTPException(
            status_code=400,
            detail="El producto ya está agregado a esta licitación"
        )


    existing_products = db.execute(
        models.tender_products.select().where(
            models.tender_products.c.tender_id == tender_id
        )
    ).fetchall()


    total_existente = sum(
        product_item.quantity * product_item.price
        for product_item in existing_products
    )


    total_nuevo = (
        item.quantity *
        item.price
    )


    total_final = (
        total_existente +
        total_nuevo
    )


    if total_final > tender.budget:

        raise HTTPException(
            status_code=400,
            detail=(
                f"El total de productos supera el presupuesto. "
                f"Total actual: ${total_existente}. "
                f"Nuevo total: ${total_final}. "
                f"Presupuesto máximo: ${tender.budget}"
            )
        )


    connection = models.tender_products.insert().values(
        tender_id=tender_id,
        product_id=item.product_id,
        quantity=item.quantity,
        price=item.price
    )


    db.execute(connection)


    db_user = get_db_user(
        db,
        current_user
    )


    tender.updated_by = (
        db_user.id
        if db_user
        else None
    )


    db.commit()


    return {
        "mensaje": "Producto agregado a la licitación",
        "total_productos": total_final,
        "presupuesto": tender.budget
    }


# =========================================================
# QUITAR PRODUCTO
# =========================================================

@router.delete(
    "/{tender_id}/products/{product_id}"
)
def remove_product_from_tender(
    tender_id: int,
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
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


    if tender.status != "borrador":

        raise HTTPException(
            status_code=400,
            detail="No se pueden modificar productos en este estado"
        )


    tender_product = db.execute(
        models.tender_products.select().where(
            models.tender_products.c.tender_id == tender_id,
            models.tender_products.c.product_id == product_id
        )
    ).first()


    if not tender_product:

        raise HTTPException(
            status_code=404,
            detail="El producto no está asociado a esta licitación"
        )


    delete_query = models.tender_products.delete().where(
        models.tender_products.c.tender_id == tender_id,
        models.tender_products.c.product_id == product_id
    )


    db.execute(delete_query)


    db_user = get_db_user(
        db,
        current_user
    )


    tender.updated_by = (
        db_user.id
        if db_user
        else None
    )


    db.commit()


    return {
        "mensaje": "Producto eliminado de la licitación"
    }


# =========================================================
# CAMBIAR ESTADO
# =========================================================

@router.patch(
    "/{tender_id}/status"
)
def change_status(
    tender_id: int,
    status: schemas.StatusChange,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
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


    old_status = tender.status


    valid_transitions = {

        "activa": [
            "perdida",
            "finalizada"
        ],

        "finalizada": [
            "por_cobrar"
        ]

    }


    if status.new_status not in valid_transitions.get(
        old_status,
        []
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"No se puede cambiar de "
                f"{old_status} a {status.new_status}"
            )
        )


    db_user = get_db_user(
        db,
        current_user
    )


    tender.status = status.new_status

    tender.updated_by = (
        db_user.id
        if db_user
        else None
    )


    history = models.StatusHistory(
        tender_id=tender.id,
        old_status=old_status,
        new_status=status.new_status,
        user_id=db_user.id if db_user else None
    )


    db.add(history)

    db.commit()

    db.refresh(tender)


    return {
        "mensaje": "Estado actualizado",
        "estado_anterior": old_status,
        "estado_nuevo": tender.status
    }


# =========================================================
# ENVIAR LICITACIÓN
# =========================================================

@router.post(
    "/{tender_id}/send"
)
def send_tender(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
    )
):

    return send_tender_service(
        tender_id,
        db,
        current_user
    )


# =========================================================
# SUBIR PROPUESTA PDF
# =========================================================

@router.post(
    "/{tender_id}/proposal"
)
def upload_proposal(
    tender_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "user"])
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


    if tender.status != "borrador":

        raise HTTPException(
            status_code=400,
            detail="Solo se puede subir una propuesta en estado borrador"
        )


    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PDF"
        )


    path = save_file(
        file,
        tender_id
    )


    db_user = get_db_user(
        db,
        current_user
    )


    tender.proposal_url = path

    tender.updated_by = (
        db_user.id
        if db_user
        else None
    )


    db.commit()

    db.refresh(tender)


    return {
        "mensaje": "Propuesta subida correctamente",
        "url": path
    }