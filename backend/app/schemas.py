from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleEnum(str, Enum):
    admin = "admin"
    borrower = "borrower"


class EquipmentStatusEnum(str, Enum):
    disponivel = "disponivel"
    emprestado = "emprestado"
    manutencao = "manutencao"


class LoanStatusEnum(str, Enum):
    pendente = "pendente"
    ativo = "ativo"
    finalizado = "finalizado"
    recusado = "recusado"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: RoleEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class EquipmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    inventory_code: str = Field(min_length=1, max_length=64)
    description: str | None = None
    status: EquipmentStatusEnum = EquipmentStatusEnum.disponivel


class EquipmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    inventory_code: str | None = Field(default=None, min_length=1, max_length=64)
    description: str | None = None
    status: EquipmentStatusEnum | None = None


class EquipmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    inventory_code: str
    description: str | None
    status: EquipmentStatusEnum


class LoanCreate(BaseModel):
    equipment_id: int
    pickup_at: datetime
    due_at: datetime
    terms_accepted: bool = False
    terms_version: str = Field(min_length=1, max_length=32)


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str


class LoanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: int
    borrower_id: int
    created_at: datetime
    pickup_at: datetime
    due_at: datetime
    approved_at: datetime | None
    returned_at: datetime | None
    status: LoanStatusEnum
    terms_accepted_at: datetime | None
    terms_version: str | None
    equipment: EquipmentRead | None = None
    borrower: UserBrief | None = None
    days_overdue: int = 0
    fine_amount: float = 0.0
    equipment_blocked: bool = False
    borrower_blocked: bool = False


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_id: int
    recipient_id: int
    sent_by_id: int | None
    message: str
    days_overdue: int
    fine_amount: float
    equipment_blocked: bool
    created_at: datetime
    read_at: datetime | None
