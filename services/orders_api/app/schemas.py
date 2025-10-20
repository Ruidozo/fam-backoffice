from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pickup_location: Optional[str] = None
    is_subscription: bool = False

class CustomerRead(CustomerCreate):
    id: int
    
    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    unit_price: Decimal
    cost_price: Optional[Decimal] = None
    active: bool = True
    batch_size: Optional[int] = None

class ProductRead(ProductCreate):
    id: int
    
    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal

class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: Optional[ProductRead] = None
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    customer_id: int
    delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderRead(BaseModel):
    id: int
    customer_id: int
    delivery_date: Optional[date]
    status: str
    total: Decimal
    notes: Optional[str] = None
    recurring_plan_id: Optional[int] = None
    is_auto_generated: Optional[bool] = False
    is_monthly_payment: Optional[bool] = False
    items: List[OrderItemRead] = []
    customer: Optional[CustomerRead] = None
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str


class OrderStatusHistoryRead(BaseModel):
    id: Optional[int] = None
    status: str
    changed_at: datetime
    
    class Config:
        from_attributes = True


class InactiveCustomerRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "operator"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class TokenData(BaseModel):
    username: Optional[str] = None


# --- Recurring Plan Schemas ---
class RecurringPlanItemCreate(BaseModel):
    product_id: int
    quantity: int


class RecurringPlanItemRead(RecurringPlanItemCreate):
    id: int

    class Config:
        from_attributes = True


class RecurringPlanCreate(BaseModel):
    customer_id: int
    day_of_week: int
    start_date: date
    end_date: Optional[date] = None
    active: bool = True
    prepaid_month: bool = False
    items: List[RecurringPlanItemCreate] = []


class RecurringPlanRead(BaseModel):
    id: int
    customer_id: int
    day_of_week: int
    start_date: date
    end_date: Optional[date] = None
    active: bool
    prepaid_month: bool
    created_at: datetime
    items: List[RecurringPlanItemRead] = []

    class Config:
        from_attributes = True


# Settings
class SettingsUpdate(BaseModel):
    production_day: Optional[int] = Field(None, ge=0, le=6)  # 0=Monday to 6=Sunday
    order_cutoff_day: Optional[int] = Field(None, ge=0, le=6)
    order_cutoff_hour: Optional[int] = Field(None, ge=0, le=23)
    order_cutoff_minute: Optional[int] = Field(None, ge=0, le=59)


class SettingsRead(BaseModel):
    id: int
    production_day: int
    order_cutoff_day: int
    order_cutoff_hour: int
    order_cutoff_minute: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
