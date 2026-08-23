from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# =========================================================
# USUARIOS
# =========================================================

class UserCreate(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    email: str
    password: str
    role: str = "user"


# =========================================================
# CLIENTES
# =========================================================

class ClientCreate(BaseModel):
    name: str
    company: str
    email: str
    phone: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    company: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# PRODUCTOS
# =========================================================

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float

    class Config:
        from_attributes = True


# =========================================================
# LICITACIONES
# =========================================================

class TenderCreate(BaseModel):
    client_id: int
    title: str
    description: Optional[str] = None
    budget: float
    deadline: datetime


class TenderResponse(BaseModel):
    id: int
    client_id: int
    title: str
    description: Optional[str] = None
    budget: float
    deadline: datetime
    status: str
    proposal_url: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# PRODUCTOS DENTRO DE UNA LICITACIÓN
# =========================================================

class TenderProductCreate(BaseModel):
    product_id: int
    quantity: int
    price: float


# Este schema se usa cuando mostramos el detalle de la licitación.
# A diferencia de ProductResponse, aquí mostramos también
# quantity y el price específico usado en esa licitación.
class TenderProductDetail(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    quantity: int
    price: float

    class Config:
        from_attributes = True


# =========================================================
# CAMBIOS DE ESTADO
# =========================================================

class StatusChange(BaseModel):
    new_status: str


class StatusHistoryDetail(BaseModel):
    id: int
    old_status: str
    new_status: str

    # Puede ser null cuando el cambio lo hizo automáticamente
    # el scheduler.
    user_id: Optional[int] = None

    # Aquí devolveremos el correo del usuario.
    # Para cambios automáticos devolveremos "Sistema".
    user_email: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# DETALLE DE CLIENTE DENTRO DE UNA LICITACIÓN
# =========================================================

class ClientDetail(BaseModel):
    id: int
    name: str
    company: str
    email: str

    class Config:
        from_attributes = True


# =========================================================
# DETALLE COMPLETO DE UNA LICITACIÓN
# =========================================================

class TenderDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    budget: float
    deadline: datetime
    status: str
    proposal_url: Optional[str] = None

    client: ClientDetail

    # Ahora usamos TenderProductDetail
    # para incluir cantidad y precio de la relación N:M.
    products: list[TenderProductDetail]

    history: list[StatusHistoryDetail]

    class Config:
        from_attributes = True


# =========================================================
# PAGOS
# =========================================================

class PaymentCreate(BaseModel):
    amount: float