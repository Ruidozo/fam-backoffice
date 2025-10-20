# FAM Bakery - React Admin UI

Modern React-based admin interface for managing customers, products, and orders.

## Features

- **Customer Management**: Create, edit, view, and delete customers
- **Product Management**: Manage product catalog with SKU, pricing, cost, and status
- **Order Management**: 
  - Create orders with multiple items
  - View order details
  - Update order status (Pendente → Confirmado → Em Preparação → Expedido → Entregue)
  - Filter orders by status and customer
- **Responsive Design**: Clean, bakery-themed interface
- **Real-time Updates**: Instant feedback on all operations

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **date-fns**: Date formatting utilities
- **Nginx**: Production web server

## Architecture

The application uses a multi-stage Docker build:
1. **Build stage**: Compiles React app using Node.js 20
2. **Production stage**: Serves static files with Nginx

API calls are proxied through Nginx to the FastAPI backend, avoiding CORS issues.

## API Integration

The UI connects to the Orders API at `/api/*`, which is proxied to `http://orders_api:8000`.

All CRUD operations are handled through the centralized `api.js` module.

## Interface

### Navigation
- **Encomendas** (Orders): Main dashboard for order management
- **Clientes** (Customers): Customer directory
- **Produtos** (Products): Product catalog

### Order Workflow
1. Create order → Select customer
2. Add items → Choose products and quantities
3. Review total → Submit order
4. Track status → Update through pipeline

## Usage

Access the interface at **http://localhost:3000** after starting the Docker stack.

### Creating an Order
1. Click "+ Nova Encomenda"
2. Select a customer
3. Optionally set delivery date
4. Click "+ Adicionar Item" for each product
5. Select product, quantity, and price
6. Review calculated total
7. Click "Criar Encomenda"

### Managing Order Status
Click the status dropdown directly in the orders table to update:
- **Pendente**: New order received
- **Confirmado**: Order confirmed with customer
- **Em Preparação**: Currently being prepared
- **Expedido**: Out for delivery
- **Entregue**: Delivered to customer

## Development

To modify the UI:

1. Edit files in `/services/admin_ui/src/`
2. Rebuild the container:
   ```bash
   docker compose build admin_ui
   docker compose up -d admin_ui
   ```

### Project Structure
```
src/
├── main.jsx          # Entry point
├── App.jsx           # Main app with routing
├── api.js            # API service layer
├── index.css         # Global styles
└── pages/
    ├── OrdersPage.jsx
    ├── CustomersPage.jsx
    └── ProductsPage.jsx
```

- Real-time notifications
- Better reports and analytics

## Future Enhancements

Planned improvements:
