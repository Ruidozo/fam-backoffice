from datetime import timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import auth, crud, db, models, schemas
from .db import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title='FAM Orders API')

# CORS middleware for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()


@app.get('/health')
def health():
    return JSONResponse({'status': 'ok'})


# --- Authentication ---
@app.post('/auth/login', response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    crud.update_last_login(db, user.id)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.get('/auth/me', response_model=schemas.UserRead)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user


# --- Users (Admin only) ---
@app.get('/users', response_model=List[schemas.UserRead])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.require_role([models.UserRole.admin])),
    db: Session = Depends(get_db)
):
    return crud.get_users(db, skip=skip, limit=limit)


@app.get('/users/{user_id}', response_model=schemas.UserRead)
async def read_user(
    user_id: int,
    current_user: models.User = Depends(auth.require_role([models.UserRole.admin])),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


@app.post('/users', response_model=schemas.UserRead)
async def create_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(auth.require_role([models.UserRole.admin])),
    db: Session = Depends(get_db)
):
    # Check if username exists
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    return crud.create_user(db, user, hashed_password)


@app.put('/users/{user_id}', response_model=schemas.UserRead)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.require_role([models.UserRole.admin])),
    db: Session = Depends(get_db)
):
    # Check if user exists
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # If email is being updated, check it's not taken
    if user_update.email and user_update.email != db_user.email:
        existing_user = crud.get_user_by_email(db, user_update.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password if provided
    hashed_password = None
    if user_update.password:
        hashed_password = auth.get_password_hash(user_update.password)
    
    return crud.update_user(db, user_id, user_update, hashed_password)


@app.delete('/users/{user_id}')
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(auth.require_role([models.UserRole.admin])),
    db: Session = Depends(get_db)
):
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail='User not found')
    return {'message': 'User deleted successfully'}


# --- Customers ---
@app.get('/customers', response_model=List[schemas.CustomerRead])
def list_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db)


@app.get('/customers/{customer_id}', response_model=schemas.CustomerRead)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    return customer


@app.post('/customers', response_model=schemas.CustomerRead)
def create_customer(c: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, c)


@app.put('/customers/{customer_id}', response_model=schemas.CustomerRead)
def update_customer(customer_id: int, c: schemas.CustomerCreate, db: Session = Depends(get_db)):
    customer = crud.update_customer(db, customer_id, c)
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    return customer


@app.delete('/customers/{customer_id}')
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    success = crud.delete_customer(db, customer_id)
    if not success:
        raise HTTPException(status_code=404, detail='Customer not found')
    return {'message': 'Customer deleted successfully'}


# --- Products ---
@app.get('/products', response_model=List[schemas.ProductRead])
def list_products(active: Optional[bool] = None, db: Session = Depends(get_db)):
    return crud.get_products(db, active)


@app.get('/products/{product_id}', response_model=schemas.ProductRead)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    return product


@app.post('/products', response_model=schemas.ProductRead)
def create_product(p: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, p)


@app.put('/products/{product_id}', response_model=schemas.ProductRead)
def update_product(product_id: int, p: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = crud.update_product(db, product_id, p)
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    return product


@app.delete('/products/{product_id}')
def delete_product(product_id: int, db: Session = Depends(get_db)):
    success = crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail='Product not found')
    return {'message': 'Product deleted successfully'}


# --- Orders ---
@app.get('/orders', response_model=List[schemas.OrderRead])
def list_orders(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return crud.get_orders(db, status, customer_id)


@app.get('/orders/{order_id}', response_model=schemas.OrderRead)
def read_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    return order


@app.post('/orders', response_model=schemas.OrderRead)
def create_order(o: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        order = crud.create_order(db, o)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order


@app.put('/orders/{order_id}', response_model=schemas.OrderRead)
def update_order(order_id: int, o: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        order = crud.update_order(db, order_id, o)
        if not order:
            raise HTTPException(status_code=404, detail='Order not found')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order


@app.patch('/orders/{order_id}/status', response_model=schemas.OrderRead)
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    status = payload.status
    # Validate against enum values
    allowed = [s.value for s in models.OrderStatus]
    if status not in allowed:
        raise HTTPException(status_code=400, detail='Invalid status')
    order = crud.update_order_status(db, order_id, status)
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    return order


@app.delete('/orders/{order_id}')
def delete_order(order_id: int, db: Session = Depends(get_db)):
    success = crud.delete_order(db, order_id)
    if not success:
        raise HTTPException(status_code=404, detail='Order not found')
    return {'message': 'Order deleted successfully'}


@app.get('/orders/{order_id}/history', response_model=List[schemas.OrderStatusHistoryRead])
def get_order_history(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    return crud.get_order_history(db, order_id)


@app.get('/analytics/production-needs')
def production_needs(date: str, db: Session = Depends(get_db)):
    try:
        needs = crud.get_production_needs_by_date(db, date)
        return needs
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get('/analytics/inactive-customers', response_model=List[schemas.InactiveCustomerRead])
def inactive_customers(days: int = 30, db: Session = Depends(get_db)):
    customers = crud.get_inactive_customers(db, days)
    return customers


@app.get('/analytics/dashboard')
def dashboard_stats(days: int = 30, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import func

    # Calculate date filter
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Total orders (filtered by date)
    total_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.created_at >= cutoff
    ).scalar()
    
    # Total revenue (filtered)
    total_revenue = db.query(func.sum(models.Order.total)).filter(
        models.Order.created_at >= cutoff
    ).scalar() or 0
    
    # Orders by status (filtered)
    orders_by_status = db.query(
        models.Order.status,
        func.count(models.Order.id).label('count')
    ).filter(models.Order.created_at >= cutoff
    ).group_by(models.Order.status).all()
    
    # Top products by units sold (filtered by order date)
    top_products = db.query(
        models.Product.id,
        models.Product.name,
        func.sum(models.OrderItem.quantity).label('total_units')
    ).join(models.OrderItem, models.Product.id == models.OrderItem.product_id
    ).join(models.Order, models.Order.id == models.OrderItem.order_id
    ).filter(models.Order.created_at >= cutoff
    ).group_by(models.Product.id, models.Product.name
    ).order_by(func.sum(models.OrderItem.quantity).desc()
    ).limit(10).all()
    
    # Top customers by revenue (filtered)
    top_customers = db.query(
        models.Customer.id,
        models.Customer.name,
        func.sum(models.Order.total).label('total_revenue')
    ).join(models.Order, models.Customer.id == models.Order.customer_id
    ).filter(models.Order.created_at >= cutoff
    ).group_by(models.Customer.id, models.Customer.name
    ).order_by(func.sum(models.Order.total).desc()
    ).limit(10).all()
    
    # Orders by day (for the selected period)
    orders_by_day = db.query(
        func.date(models.Order.created_at).label('date'),
        func.count(models.Order.id).label('count'),
        func.sum(models.Order.total).label('revenue')
    ).filter(models.Order.created_at >= cutoff
    ).group_by(func.date(models.Order.created_at)
    ).order_by(func.date(models.Order.created_at).asc()
    ).all()
    
    # Total units sold (filtered)
    total_units = db.query(func.sum(models.OrderItem.quantity)
    ).join(models.Order, models.Order.id == models.OrderItem.order_id
    ).filter(models.Order.created_at >= cutoff
    ).scalar() or 0
    
    return {
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'total_units': int(total_units),
        'orders_by_status': [{'status': s.value, 'count': c} for s, c in orders_by_status],
        'top_products': [{'id': p.id, 'name': p.name, 'total_units': int(p.total_units)} for p in top_products],
        'top_customers': [{'id': c.id, 'name': c.name, 'total_revenue': float(c.total_revenue)} for c in top_customers],
        'orders_by_day': [{'date': str(d), 'count': c, 'revenue': float(r)} for d, c, r in orders_by_day]
    }


# --- Recurring Plans ---
@app.get('/recurring/plans', response_model=List[schemas.RecurringPlanRead])
def list_plans(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.list_recurring_plans(db, customer_id)


@app.get('/recurring/plans/{plan_id}', response_model=schemas.RecurringPlanRead)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = crud.get_recurring_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail='Plan not found')
    return plan


@app.post('/recurring/plans', response_model=schemas.RecurringPlanRead)
def create_plan(payload: schemas.RecurringPlanCreate, db: Session = Depends(get_db)):
    return crud.create_recurring_plan(db, payload)


@app.put('/recurring/plans/{plan_id}', response_model=schemas.RecurringPlanRead)
def update_plan(plan_id: int, payload: schemas.RecurringPlanCreate, db: Session = Depends(get_db)):
    plan = crud.update_recurring_plan(db, plan_id, payload)
    if not plan:
        raise HTTPException(status_code=404, detail='Plan not found')
    return plan


@app.delete('/recurring/plans/{plan_id}')
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_recurring_plan(db, plan_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Plan not found')
    return {'message': 'Plan deleted successfully'}

