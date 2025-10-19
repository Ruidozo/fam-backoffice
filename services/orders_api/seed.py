from decimal import Decimal

from app import auth, crud, models, schemas
from app.db import Base, SessionLocal, engine


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create default admin user
    print('Creating default users...')
    admin_user = crud.get_user_by_username(db, 'admin')
    if not admin_user:
        admin_user = crud.create_user(
            db,
            schemas.UserCreate(
                username='admin',
                email='admin@fampadaria.com',
                full_name='Administrator',
                role='admin',
                password='admin123'
            ),
            auth.get_password_hash('admin123')
        )
        print(f'Created admin user: {admin_user.username}')
    else:
        print('Admin user already exists')

    # Create operator user
    operator_user = crud.get_user_by_username(db, 'operator')
    if not operator_user:
        operator_user = crud.create_user(
            db,
            schemas.UserCreate(
                username='operator',
                email='operator@fampadaria.com',
                full_name='Operator User',
                role='operator',
                password='operator123'
            ),
            auth.get_password_hash('operator123')
        )
        print(f'Created operator user: {operator_user.username}')
    else:
        print('Operator user already exists')

    # create customers
    c1 = crud.create_customer(db, schemas.CustomerCreate(name='Alice', email='alice@example.com', phone='123', address='Street 1'))
    c2 = crud.create_customer(db, schemas.CustomerCreate(name='Bob', email='bob@example.com', phone='456', address='Street 2'))

    # create products
    p1 = crud.create_product(db, schemas.ProductCreate(name='Sourdough Loaf', unit_price=Decimal('4.50'), cost_price=Decimal('2.00'), sku='SD-LF'))
    p2 = crud.create_product(db, schemas.ProductCreate(name='Croissant', unit_price=Decimal('1.50'), cost_price=Decimal('0.60'), sku='CR-01'))

    # create an order
    o = crud.create_order(db, schemas.OrderCreate(customer_id=c1.id, delivery_date=None, items=[
        schemas.OrderItemCreate(product_id=p1.id, quantity=2, unit_price=Decimal('4.50')),
        schemas.OrderItemCreate(product_id=p2.id, quantity=6, unit_price=Decimal('1.50'))
    ]))

    print('Seed finished. Order id:', o.id)

if __name__ == '__main__':
    run()
