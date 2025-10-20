import enum

from sqlalchemy import (Boolean, Column, Date, DateTime, Enum, ForeignKey,
                        Integer, Numeric, String, Text, func)
from sqlalchemy.orm import relationship

from .db import Base


class UserRole(str, enum.Enum):
    admin = 'admin'
    manager = 'manager'
    operator = 'operator'


class OrderStatus(str, enum.Enum):
    encomendado = 'encomendado'  # Ordered
    pago = 'pago'  # Paid
    preparing = 'preparing'  # Preparing
    delivered = 'delivered'  # Delivered


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.operator, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    pickup_location = Column(String, nullable=True)  # local de recolha preferido
    is_subscription = Column(Boolean, default=False, nullable=False)  # mensal subscription
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship('Order', back_populates='customer')


class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    batch_size = Column(Integer, nullable=True)  # mínimo de produção; se None, assume 1
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship('OrderItem', back_populates='product')


class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    delivery_date = Column(Date, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.encomendado, nullable=False)
    total = Column(Numeric(12, 2), default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship('Customer', back_populates='orders')
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')


class OrderItem(Base):
    __tablename__ = 'order_items'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship('Order', back_populates='items')
    product = relationship('Product', back_populates='items')


class RecurringPlan(Base):
    __tablename__ = 'recurring_plans'
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Segunda ... 6=Domingo
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    prepaid_month = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RecurringPlanItem(Base):
    __tablename__ = 'recurring_plan_items'
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey('recurring_plans.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)


class OrderStatusHistory(Base):
    __tablename__ = 'order_status_history'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    status = Column(Enum(OrderStatus), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship('Order')

