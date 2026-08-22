from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# -------- Usuarios --------

class UserCreate(BaseModel):
    email: str
    password: str



class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True



# -------- Clientes --------

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
    phone: Optional[str]

    class Config:
        from_attributes = True



# -------- Productos --------

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float



class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float

    class Config:
        from_attributes = True

# -------- Tenders --------

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

    description: Optional[str]

    budget: float

    deadline: datetime

    status: str

    proposal_url: Optional[str]

    class Config:
        from_attributes = True

class TenderProductCreate(BaseModel):

    product_id: int

    quantity: int

    price: float

class StatusChange(BaseModel):

    new_status: str

class AdminUserCreate(BaseModel):

    email: str

    password: str

    role: str = "user"


# -------- Detalle de Tender --------

class ClientDetail(BaseModel):

    id: int

    name: str

    company: str

    email: str


    class Config:
        from_attributes = True



class ProductDetail(BaseModel):

    id: int

    name: str

    description: Optional[str]

    price: float


    class Config:
        from_attributes = True



class StatusHistoryDetail(BaseModel):

    id: int

    old_status: str

    new_status: str

    created_at: datetime


    class Config:
        from_attributes = True



class TenderDetailResponse(BaseModel):

    id: int

    title: str

    description: Optional[str]

    budget: float

    deadline: datetime

    status: str

    proposal_url: Optional[str]


    client: ClientDetail

    products: list[ProductDetail]

    history: list[StatusHistoryDetail]


    class Config:
        from_attributes = True

# -------- Payments --------


class PaymentCreate(BaseModel):

    amount: float