# 🥖 FAM Bakery - Local Stack Setup Complete!

## ✅ What's Been Deployed

Your FAM bakery management system is now running with:

1. **PostgreSQL Database** (port 5432)
   - Manages all data: customers, products, orders
   - Already includes seed data (Alice, Bob, Sourdough, Croissant)

2. **Redis Cache** (port 6379)
   - Ready for caching and session management

3. **FastAPI Orders API** (port 8000)
   - Complete REST API with all CRUD operations
   - Documentation at: http://localhost:8000/docs

4. **React Admin UI** (port 3000)
   - Modern, responsive web interface
   - Full customer, product, and order management
   - Access at: http://localhost:3000

5. **Adminer** (port 8080)
   - Database GUI for direct data access
   - Login: server=db, user=fam_user, password=changeme, database=fam_db

## 🚀 Quick Start

### First Time Setup

```bash
cd fam_local_stack

# Start all services
docker compose up -d

# Check all containers are running
docker compose ps

# View logs
docker compose logs -f
```

### Access Your Stack

- **Admin UI**: http://localhost:3000 ← Start here!
- **API Docs**: http://localhost:8000/docs
- **Database UI**: http://localhost:8080

## 📊 Using the Admin Interface

### 1. Manage Customers (Clientes)
- Add new customers with contact details
- Edit existing customer information
- View customer list with email, phone, address

### 2. Manage Products (Produtos)
- Add products with SKU, name, price, cost
- Set products as active/inactive
- View profit margins automatically calculated
- Products must be active to be ordered

### 3. Manage Orders (Encomendas)
- Create new orders:
  - Select customer
  - Add multiple products
  - Set quantities and prices
  - View calculated total
- View order details
- Update order status through workflow:
  - Pendente → Confirmado → Em Preparação → Expedido → Entregue
- Delete orders (with cascade to items)

## 🔧 Development Workflow

### Making Changes to the API

```bash
# Edit files in services/orders_api/
nano services/orders_api/app/main.py

# Rebuild and restart
docker compose build orders_api
docker compose up -d orders_api

# Check logs
docker compose logs -f orders_api
```

### Making Changes to the UI

```bash
# Edit files in services/admin_ui/src/
nano services/admin_ui/src/pages/OrdersPage.jsx

# Rebuild and restart
docker compose build admin_ui
docker compose up -d admin_ui

# Check logs
docker compose logs -f admin_ui
```

### Database Migrations

When you modify models:

```bash
# Access the API container
docker compose exec orders_api bash

# Inside container, run Python to create tables
python -c "from app.db import engine; from app import models; models.Base.metadata.create_all(bind=engine)"
```

## 📡 API Endpoints

### Customers
- `GET /customers` - List all customers
- `GET /customers/{id}` - Get customer details
- `POST /customers` - Create new customer
- `PUT /customers/{id}` - Update customer
- `DELETE /customers/{id}` - Delete customer

### Products
- `GET /products` - List all products (optional: ?active=true)
- `GET /products/{id}` - Get product details
- `POST /products` - Create new product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Orders
- `GET /orders` - List orders (filters: ?status=pending&customer_id=1)
- `GET /orders/{id}` - Get order with items
- `POST /orders` - Create order with items
- `PUT /orders/{id}` - Update entire order
- `PATCH /orders/{id}/status` - Update only status
- `DELETE /orders/{id}` - Delete order

## 🗄️ Database Access

### Using Adminer
1. Go to http://localhost:8080
2. Login:
   - System: PostgreSQL
   - Server: db
   - Username: fam_user
   - Password: changeme
   - Database: fam_db

### Using psql

```bash
docker compose exec db psql -U fam_user -d fam_db

# Inside psql:
\dt                          # List tables
SELECT * FROM customers;     # Query data
SELECT * FROM orders;
SELECT * FROM order_items;
```

## 🔄 Common Operations

### Restart Everything

```bash
docker compose restart
```

### Stop Everything

```bash
docker compose down
```

### Stop and Remove All Data

```bash
docker compose down -v  # ⚠️ This deletes the database!
```

### View Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f admin_ui
docker compose logs -f orders_api
docker compose logs -f db
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose build admin_ui
docker compose up -d admin_ui

# Rebuild all
docker compose build
docker compose up -d
```

## 📁 Project Structure

```
fam_local_stack/
├── docker-compose.yml          # Orchestrates all services
├── .env                        # Configuration (passwords, etc.)
├── services/
│   ├── orders_api/             # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py         # API endpoints
│   │   │   ├── models.py       # Database models
│   │   │   ├── schemas.py      # Pydantic schemas
│   │   │   ├── crud.py         # Database operations
│   │   │   └── db.py           # Database connection
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── admin_ui/               # React frontend
│       ├── src/
│       │   ├── main.jsx
│       │   ├── App.jsx
│       │   ├── api.js          # API client
│       │   └── pages/
│       │       ├── CustomersPage.jsx
│       │       ├── ProductsPage.jsx
│       │       └── OrdersPage.jsx
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
└── README.md
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000
# Kill the process or change the port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker compose logs admin_ui

# Rebuild from scratch
docker compose build --no-cache admin_ui
docker compose up -d admin_ui
```

### Database Connection Failed

```bash
# Verify database is running
docker compose ps db

# Check database logs
docker compose logs db

# Recreate database
docker compose down
docker compose up -d db
```

### API Not Responding

```bash
# Check if orders_api is healthy
docker compose ps orders_api

# View API logs
docker compose logs -f orders_api

# Restart API
docker compose restart orders_api
```

### UI Shows Connection Errors

1. Check API is running: http://localhost:8000/health
2. Check browser console for errors (F12)
3. Verify nginx proxy configuration in `services/admin_ui/nginx.conf`

## 🎯 Next Steps (Fase 1 Checklist)

Completed:
- ✅ Customer, product, order CRUD
- ✅ Order status workflow
- ✅ Web interface
- ✅ List/create/edit/delete operations

To Implement:
- [ ] Filters by date range
- [ ] Kanban view by order status
- [ ] Calendar view by delivery date
- [ ] Production needs aggregation
- [ ] Alerts for orders due within 3 days
- [ ] CSV export
- [ ] Cost/margin calculations in reports

## 📚 Additional Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev
- Docker Compose: https://docs.docker.com/compose
- PostgreSQL: https://www.postgresql.org/docs

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker compose logs -f [service-name]`
2. Verify all services are running: `docker compose ps`
3. Try rebuilding: `docker compose build && docker compose up -d`
4. Check .env file has correct values
5. Ensure ports 3000, 8000, 8080, 5432, 6379 are available

---

**🎉 Your FAM bakery management system is ready to use!**

Start managing your orders at: **http://localhost:3000**
