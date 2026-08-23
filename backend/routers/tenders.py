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


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()



# Crear licitación
@router.post("/", response_model=schemas.TenderResponse)
def create_tender(
    tender: schemas.TenderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin", "ejecutivo"])
    )
):

    new_tender = models.Tender(
        client_id=tender.client_id,
        title=tender.title,
        description=tender.description,
        budget=tender.budget,
        deadline=tender.deadline,
        status="borrador"
    )


    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)


    return new_tender



# Obtener licitaciones
@router.get("/", response_model=list[schemas.TenderResponse])
def get_tenders(
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin", "ejecutivo"])
    )
):

    return db.query(models.Tender).all()



# Obtener detalle
@router.get(
    "/{tender_id}",
    response_model=schemas.TenderDetailResponse
)
def get_tender_detail(
    tender_id: int,
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


    return tender



# Agregar productos
@router.post("/{tender_id}/products")
def add_product_to_tender(
    tender_id: int,
    item: schemas.TenderProductCreate,
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


    total_actual = item.quantity * item.price


    if total_actual > tender.budget:

        raise HTTPException(
            status_code=400,
            detail="El producto supera el presupuesto"
        )


    connection = models.tender_products.insert().values(
        tender_id=tender_id,
        product_id=item.product_id,
        quantity=item.quantity,
        price=item.price
    )


    db.execute(connection)
    db.commit()


    return {
        "mensaje": "Producto agregado a la licitación"
    }



# Cambiar estado de licitación
@router.patch("/{tender_id}/status")
def change_status(
    tender_id: int,
    status: schemas.StatusChange,
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


    # Buscar el usuario autenticado
    db_user = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()


    tender.status = status.new_status


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


# Enviar licitación
@router.post("/{tender_id}/send")
def send_tender(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(
        require_role(["admin", "ejecutivo"])
    )
):

    return send_tender_service(
        tender_id,
        db,
        current_user
    )


# Subir propuesta PDF
@router.post("/{tender_id}/proposal")
def upload_proposal(
    tender_id: int,
    file: UploadFile = File(...),
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


    if not file.filename.endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PDF"
        )


    path = save_file(
        file,
        tender_id
    )


    tender.proposal_url = path


    db.commit()


    return {
        "mensaje": "Propuesta subida correctamente",
        "url": path
    }