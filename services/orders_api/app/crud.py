from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import extract
from sqlalchemy.orm import Session

from . import models, schemas


# --- Customers ---
def get_customers(db: Session):
    return db.query(models.Customer).all()


def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_c = models.Customer(**customer.dict())
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    return db_c


def update_customer(db: Session, customer_id: int, customer: schemas.CustomerCreate):
    db_c = get_customer(db, customer_id)
    if not db_c:
        return None
    for key, value in customer.dict().items():
        setattr(db_c, key, value)
    db.commit()
    db.refresh(db_c)
    return db_c


def delete_customer(db: Session, customer_id: int):
    db_c = get_customer(db, customer_id)
    if not db_c:
        return False
    db.delete(db_c)
    db.commit()
    return True


# --- Products ---
def get_products(db: Session, active: Optional[bool] = None):
    query = db.query(models.Product)
    if active is not None:
        query = query.filter(models.Product.active == active)
    return query.all()


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def create_product(db: Session, product: schemas.ProductCreate):
    db_p = models.Product(**product.dict())
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    return db_p


def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    db_p = get_product(db, product_id)
    if not db_p:
        return None
    for key, value in product.dict().items():
        setattr(db_p, key, value)
    db.commit()
    db.refresh(db_p)
    return db_p


def delete_product(db: Session, product_id: int):
    db_p = get_product(db, product_id)
    if not db_p:
        return False
    db.delete(db_p)
    db.commit()
    return True


# --- Orders ---
def get_orders(db: Session, status: Optional[str] = None, customer_id: Optional[int] = None):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    return query.all()


def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def create_order(db: Session, order_in: schemas.OrderCreate):
    order_data = order_in.dict(exclude={'items'})
    order = models.Order(**order_data)
    db.add(order)
    db.flush()  # get id

    total = Decimal('0')
    for item in order_in.items:
        product = get_product(db, item.product_id)
        if not product:
            raise ValueError(f"Product {item.product_id} not found")
        unit_price = Decimal(str(item.unit_price))
        oi = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=unit_price
        )
        db.add(oi)
        total += unit_price * item.quantity

    order.total = total  # type: ignore[assignment]
    db.commit()
    db.refresh(order)

    # Record initial status history
    hist = models.OrderStatusHistory(order_id=order.id, status=order.status)
    db.add(hist)
    db.commit()
    return order


def update_order(db: Session, order_id: int, order_in: schemas.OrderCreate):
    order = get_order(db, order_id)
    if not order:
        return None
    
    # Update order fields
    order_data = order_in.dict(exclude={'items'})
    for key, value in order_data.items():
        setattr(order, key, value)
    
    # Delete existing items
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete()
    
    # Add new items
    total = Decimal('0')
    for item in order_in.items:
        product = get_product(db, item.product_id)
        if not product:
            raise ValueError(f"Product {item.product_id} not found")
        unit_price = Decimal(str(item.unit_price))
        oi = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=unit_price
        )
        db.add(oi)
        total += unit_price * item.quantity
    
    order.total = total  # type: ignore[assignment]
    db.commit()
    db.refresh(order)
    return order


def update_order_status(db: Session, order_id: int, status: str):
    order = get_order(db, order_id)
    if not order:
        return None
    order.status = models.OrderStatus(status) if isinstance(status, str) else status  # type: ignore[assignment]
    # append history
    hist = models.OrderStatusHistory(order_id=order_id, status=status)
    db.add(hist)
    db.commit()
    db.refresh(order)
    return order


def get_order_history(db: Session, order_id: int):
    entries = db.query(models.OrderStatusHistory).filter(models.OrderStatusHistory.order_id == order_id).order_by(models.OrderStatusHistory.changed_at.asc()).all()
    if not entries:
        # Backfill with current status as initial record
        order = get_order(db, order_id)
        if order:
            hist = models.OrderStatusHistory(order_id=order_id, status=order.status)
            db.add(hist)
            db.commit()
            entries = [hist]
    return entries


def delete_order(db: Session, order_id: int):
    order = get_order(db, order_id)
    if not order:
        return False
    # Delete status history first to satisfy FK constraints
    db.query(models.OrderStatusHistory).filter(models.OrderStatusHistory.order_id == order_id).delete()
    # Delete order items to satisfy FK constraints
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete()
    db.delete(order)
    db.commit()
    return True


def get_production_needs_by_date(db: Session, target_date) -> List[Dict[str, Any]]:
    """Aggregate order items for a given delivery_date across all non-delivered orders."""
    from sqlalchemy import func
    q = (
        db.query(
            models.Product.id.label('product_id'),
            models.Product.sku,
            models.Product.name,
            func.sum(models.OrderItem.quantity).label('quantity'),
            models.Product.batch_size
        )
        .join(models.OrderItem, models.Product.id == models.OrderItem.product_id)
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(models.Order.delivery_date == target_date)
        .filter(models.Order.status != models.OrderStatus.delivered)
        .group_by(models.Product.id)
        .order_by(models.Product.name.asc())
    )
    rows = q.all()
    results = []
    for r in rows:
        rounded = r.quantity
        if r.batch_size and r.batch_size > 1:
            # round up to batch multiple
            batches = (r.quantity + r.batch_size - 1) // r.batch_size
            rounded = batches * r.batch_size
        results.append({
            'product_id': r.product_id,
            'sku': r.sku,
            'name': r.name,
            'quantity': int(r.quantity),
            'rounded_quantity': int(rounded),
            'batch_size': r.batch_size or 1,
        })
    return results


def get_inactive_customers(db: Session, days: int = 30):
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import exists

    # Compute cutoff in Python (timezone-aware) to avoid DB-specific interval funcs
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Return customers for whom there is NO order on/after the cutoff date
    # This includes customers with no orders at all
    recent_orders_exists = (
        db.query(models.Order.id)
        .filter(
            models.Order.customer_id == models.Customer.id,
            models.Order.created_at >= cutoff,
        )
        .exists()
    )

    q = db.query(models.Customer).filter(~recent_orders_exists)
    return q.all()


# --- Users ---
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    from datetime import datetime, timezone
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- Recurring Plans ---
def list_recurring_plans(db: Session, customer_id: Optional[int] = None):
    q = db.query(models.RecurringPlan)
    if customer_id is not None:
        q = q.filter(models.RecurringPlan.customer_id == customer_id)
    return q.all()


def get_recurring_plan(db: Session, plan_id: int):
    return db.query(models.RecurringPlan).filter(models.RecurringPlan.id == plan_id).first()


def create_recurring_plan(db: Session, payload: schemas.RecurringPlanCreate):
    plan = models.RecurringPlan(
        customer_id=payload.customer_id,
        day_of_week=payload.day_of_week,
        start_date=payload.start_date,
        end_date=payload.end_date,
        active=payload.active,
        prepaid_month=payload.prepaid_month,
    )
    db.add(plan)
    db.flush()
    for item in payload.items:
        db.add(models.RecurringPlanItem(plan_id=plan.id, product_id=item.product_id, quantity=item.quantity))
    db.commit()
    db.refresh(plan)
    return plan


def update_recurring_plan(db: Session, plan_id: int, payload: schemas.RecurringPlanCreate):
    plan = get_recurring_plan(db, plan_id)
    if not plan:
        return None
    plan.customer_id = payload.customer_id  # type: ignore[assignment]
    plan.day_of_week = payload.day_of_week  # type: ignore[assignment]
    plan.start_date = payload.start_date  # type: ignore[assignment]
    plan.end_date = payload.end_date  # type: ignore[assignment]
    plan.active = payload.active  # type: ignore[assignment]
    plan.prepaid_month = payload.prepaid_month  # type: ignore[assignment]
    # Replace items
    db.query(models.RecurringPlanItem).filter(models.RecurringPlanItem.plan_id == plan_id).delete()
    for item in payload.items:
        db.add(models.RecurringPlanItem(plan_id=plan.id, product_id=item.product_id, quantity=item.quantity))
    db.commit()
    db.refresh(plan)
    return plan


def delete_recurring_plan(db: Session, plan_id: int) -> bool:
    plan = get_recurring_plan(db, plan_id)
    if not plan:
        return False
    db.query(models.RecurringPlanItem).filter(models.RecurringPlanItem.plan_id == plan_id).delete()
    db.delete(plan)
    db.commit()
    return True


def generate_monthly_orders_from_plan(db: Session, plan_id: int, month: int, year: int):
    """
    Generate weekly orders for a subscription plan for the specified month.
    Returns list of created orders.
    """
    from calendar import monthrange
    from datetime import date, timedelta
    
    plan = get_recurring_plan(db, plan_id)
    if not plan or not plan.active:
        return []
    
    # Get the first and last day of the month
    first_day = date(year, month, 1)
    last_day_num = monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)
    
    # Check if plan is active for this month
    if plan.start_date > last_day:
        return []  # Plan hasn't started yet
    if plan.end_date and plan.end_date < first_day:
        return []  # Plan already ended
    
    # Find all occurrences of the plan's day_of_week in the month
    # day_of_week: 0=Monday, 6=Sunday
    delivery_dates = []
    current_date = first_day
    while current_date <= last_day:
        if current_date.weekday() == plan.day_of_week:
            # Check if date is within plan period
            if current_date >= plan.start_date:
                if not plan.end_date or current_date <= plan.end_date:
                    delivery_dates.append(current_date)
        current_date += timedelta(days=1)
    
    # Skip the first delivery date (it's the monthly payment order, not a weekly delivery)
    if delivery_dates:
        delivery_dates = delivery_dates[1:]  # Remove first occurrence
    
    # Get plan items
    plan_items = db.query(models.RecurringPlanItem).filter(
        models.RecurringPlanItem.plan_id == plan_id
    ).all()
    
    if not plan_items:
        return []  # No products in plan
    
    # Create orders for each delivery date
    created_orders = []
    for delivery_date in delivery_dates:
        # Check if order already exists for this date and plan
        existing = db.query(models.Order).filter(
            models.Order.recurring_plan_id == plan_id,
            models.Order.delivery_date == delivery_date
        ).first()
        
        if existing:
            continue  # Skip if already generated
        
        # Calculate total
        total = sum(
            (db.query(models.Product).get(item.product_id).unit_price or 0) * item.quantity
            for item in plan_items
        )
        
        # Create order
        order = models.Order(
            customer_id=plan.customer_id,
            delivery_date=delivery_date,
            status=models.OrderStatus.pago,  # Subscription orders are already paid
            total=total,
            recurring_plan_id=plan_id,
            is_auto_generated=True,
            notes=f"Gerado automaticamente da subscrição mensal"
        )
        db.add(order)
        db.flush()  # Get order ID
        
        # Add order items
        for plan_item in plan_items:
            product = db.query(models.Product).get(plan_item.product_id)
            order_item = models.OrderItem(
                order_id=order.id,
                product_id=plan_item.product_id,
                quantity=plan_item.quantity,
                unit_price=product.unit_price
            )
            db.add(order_item)
        
        # Add status history
        history = models.OrderStatusHistory(
            order_id=order.id,
            status=models.OrderStatus.pago  # Subscription orders start as paid
        )
        db.add(history)
        
        created_orders.append(order)
    
    db.commit()
    for order in created_orders:
        db.refresh(order)
    
    return created_orders


def create_monthly_payment_order(db: Session, plan_id: int, month: int, year: int):
    """
    Create a monthly payment order for a subscription plan.
    This is the "master" order that the customer pays to unlock weekly deliveries.
    Returns the created order or None if plan is invalid or payment already exists.
    """
    from calendar import monthrange
    from datetime import date, timedelta
    
    plan = get_recurring_plan(db, plan_id)
    if not plan or not plan.active:
        return None
    
    # Get the first delivery date of the month (first occurrence of day_of_week)
    first_day = date(year, month, 1)
    last_day_num = monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)
    
    # Check if plan is active for this month
    if plan.start_date > last_day:
        return None  # Plan hasn't started yet
    if plan.end_date and plan.end_date < first_day:
        return None  # Plan already ended
    
    # Find first occurrence of plan's day_of_week in the month
    first_delivery_date = None
    current_date = first_day
    while current_date <= last_day:
        if current_date.weekday() == plan.day_of_week:
            if current_date >= plan.start_date:
                if not plan.end_date or current_date <= plan.end_date:
                    first_delivery_date = current_date
                    break
        current_date += timedelta(days=1)
    
    if not first_delivery_date:
        return None  # No valid delivery date in this month
    
    # Check if monthly payment already exists for this month
    existing = db.query(models.Order).filter(
        models.Order.recurring_plan_id == plan_id,
        models.Order.is_monthly_payment == True
    ).filter(
        extract('month', models.Order.delivery_date) == month,
        extract('year', models.Order.delivery_date) == year
    ).first()
    
    if existing:
        return existing  # Already created
    
    # Get plan items
    plan_items = db.query(models.RecurringPlanItem).filter(
        models.RecurringPlanItem.plan_id == plan_id
    ).all()
    
    if not plan_items:
        return None  # No products in plan
    
    # Calculate monthly total (sum of all weekly deliveries)
    # Count occurrences of day_of_week in month
    week_count = 0
    current_date = first_day
    while current_date <= last_day:
        if current_date.weekday() == plan.day_of_week:
            if current_date >= plan.start_date:
                if not plan.end_date or current_date <= plan.end_date:
                    week_count += 1
        current_date += timedelta(days=1)
    
    # Calculate total for all weeks
    total = sum(
        (db.query(models.Product).get(item.product_id).unit_price or 0) * item.quantity * week_count
        for item in plan_items
    )
    
    # Get month name in Portuguese
    month_names = {
        1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
        5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
        9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    }
    month_name = month_names.get(month, str(month))
    
    # Create monthly payment order
    order = models.Order(
        customer_id=plan.customer_id,
        delivery_date=first_delivery_date,
        status=models.OrderStatus.encomendado,
        total=total,
        recurring_plan_id=plan_id,
        is_monthly_payment=True,
        is_auto_generated=False,
        notes=f"Pagamento Mensal - {month_name} {year} ({week_count} entregas)"
    )
    db.add(order)
    db.flush()
    
    # Add order items (total quantities for the month)
    for plan_item in plan_items:
        product = db.query(models.Product).get(plan_item.product_id)
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=plan_item.product_id,
            quantity=plan_item.quantity * week_count,  # Monthly total
            unit_price=product.unit_price
        )
        db.add(order_item)
    
    # Add status history
    history = models.OrderStatusHistory(
        order_id=order.id,
        status=models.OrderStatus.encomendado
    )
    db.add(history)
    
    db.commit()
    db.refresh(order)
    
    return order


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate, hashed_password: Optional[str] = None):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    if hashed_password:
        update_data['hashed_password'] = hashed_password
    
    for key, value in update_data.items():
        if key != 'password':  # Don't set password directly
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True


def update_last_login(db: Session, user_id: int):
    from datetime import datetime, timezone
    
    db_user = get_user(db, user_id)
    if db_user:
        db_user.last_login = datetime.now(timezone.utc)  # type: ignore[assignment]
        db.commit()
        db.refresh(db_user)
    return db_user

