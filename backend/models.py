from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Table
)

from sqlalchemy.orm import relationship

from database import Base

from datetime import datetime, timezone


def utc_now():
    return datetime.now(
        timezone.utc
    ).replace(tzinfo=None)


# Tabla intermedia N:M entre licitaciones y productos
tender_products = Table(
    "tender_products",
    Base.metadata,

    Column(
        "tender_id",
        Integer,
        ForeignKey("tenders.id"),
        primary_key=True
    ),

    Column(
        "product_id",
        Integer,
        ForeignKey("products.id"),
        primary_key=True
    ),

    Column(
        "quantity",
        Integer,
        nullable=False
    ),

    Column(
        "price",
        Float,
        nullable=False
    )
)


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String,
        unique=True,
        index=True
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="user"
    )

    # Auditoría
    created_at = Column(
        DateTime,
        default=utc_now
    )

    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    updated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )


class Client(Base):

    __tablename__ = "clients"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(String)

    company = Column(String)

    email = Column(String)

    phone = Column(String)

    # Auditoría
    created_at = Column(
        DateTime,
        default=utc_now
    )

    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    updated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    tenders = relationship(
        "Tender",
        back_populates="client"
    )


class Product(Base):

    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(
        String
    )

    price = Column(
        Float,
        nullable=False
    )

    # Auditoría
    created_at = Column(
        DateTime,
        default=utc_now
    )

    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    updated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    tenders = relationship(
        "Tender",
        secondary=tender_products,
        back_populates="products"
    )


class Tender(Base):

    __tablename__ = "tenders"

    id = Column(
        Integer,
        primary_key=True
    )

    client_id = Column(
        Integer,
        ForeignKey("clients.id")
    )

    title = Column(String)

    description = Column(String)

    budget = Column(Float)

    deadline = Column(DateTime)

    status = Column(
        String,
        default="borrador"
    )

    proposal_url = Column(
        String,
        nullable=True
    )

    # Auditoría
    created_at = Column(
        DateTime,
        default=utc_now
    )

    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    updated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    client = relationship(
        "Client",
        back_populates="tenders"
    )

    products = relationship(
        "Product",
        secondary=tender_products,
        back_populates="tenders"
    )

    payments = relationship(
        "Payment",
        back_populates="tender"
    )

    history = relationship(
        "StatusHistory",
        back_populates="tender"
    )


class Payment(Base):

    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tender_id = Column(
        Integer,
        ForeignKey("tenders.id")
    )

    amount = Column(
        Float,
        nullable=False
    )

    # Auditoría
    created_at = Column(
        DateTime,
        default=utc_now
    )

    updated_at = Column(
        DateTime,
        default=utc_now,
        onupdate=utc_now
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    updated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    tender = relationship(
        "Tender",
        back_populates="payments"
    )


class StatusHistory(Base):

    __tablename__ = "status_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tender_id = Column(
        Integer,
        ForeignKey("tenders.id")
    )

    old_status = Column(String)

    new_status = Column(String)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=utc_now
    )

    tender = relationship(
        "Tender",
        back_populates="history"
    )


class TenderReminder(Base):

    __tablename__ = "tender_reminders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tender_id = Column(
        Integer,
        ForeignKey("tenders.id"),
        unique=True,
        nullable=False
    )

    sent_at = Column(
        DateTime,
        default=utc_now
    )