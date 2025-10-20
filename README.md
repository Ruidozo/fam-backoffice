# FAM Backoffice

A modern, full-stack backoffice management system for FAM Padaria, built with React, FastAPI, and PostgreSQL.

## Important Notice

**This is a development environment setup.** The repository contains hardcoded credentials and default secrets that are suitable for local development and testing only. 

**DO NOT use this configuration in production environments without:**
- Changing all default passwords
- Using strong, unique secret keys
- Implementing proper environment variable management
- Enabling HTTPS/SSL
- Configuring proper security measures

## Overview

FAM Backoffice is a comprehensive business management platform designed to streamline operations for bakery and food service businesses. The system provides tools for order management, production planning, customer relationship management, and business analytics.

## Features

### Order Management
- Complete order lifecycle tracking
- Kanban board for visual workflow management
- Order status updates and history
- Customer order association
- Real-time order notifications

### Production Planning
- Daily production needs calculation
- Product quantity forecasting
- Production schedule visualization
- Ingredient and resource planning

### Customer Management
- Customer database with contact information
- Order history per customer
- Customer preferences and notes
- Quick customer lookup and filtering

### Product Catalog
- Product listing and details
- Price management
- Product categories
- Stock tracking

### Analytics Dashboard
- Revenue analytics
- Order statistics
- Customer insights
- Production metrics
- Customizable date ranges

### Calendar View
- Visual order calendar
- Delivery date planning
- Production scheduling
- Event management

### User Management
- Role-based access control (Admin, Manager, Operator)
- User authentication and authorization
- User profile management
- Activity tracking

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Big Calendar** - Calendar component
- **Axios** - HTTP client
- **CSS3** - Styling with modern design system

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **Uvicorn** - ASGI server

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **Adminer** - Database management interface

## Architecture

The application follows a microservices architecture with the following components:

```
┌─────────────────┐
│   Admin UI      │  (React + Vite + Nginx)
│   Port: 3000    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Orders API    │  (FastAPI + Python)
│   Port: 8000    │
└────────┬────────┘
         │
         ├─────────┐
         │         │
┌────────▼─────┐ ┌▼──────────┐
│ PostgreSQL   │ │   Redis   │
│ Port: 5432   │ │ Port: 6379│
└──────────────┘ └───────────┘
```

## Getting Started

### Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ruidozo/fam-backoffice.git
cd fam-backoffice/fam_local_stack
```

2. Start the services:
```bash
docker-compose up -d
```

3. Wait for all services to initialize (approximately 30 seconds)

4. Access the application:
- **Admin UI**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080

### Default Credentials

```
Username: admin
Password: admin123
```

**Important**: Change default credentials in production environments.

## Development

### Project Structure

```
fam_local_stack/
├── services/
│   ├── admin_ui/          # React frontend application
│   │   ├── src/
│   │   │   ├── pages/     # Page components
│   │   │   ├── styles/    # CSS stylesheets
│   │   │   ├── api.js     # API client
│   │   │   └── App.jsx    # Main application
│   │   ├── public/        # Static assets
│   │   └── Dockerfile
│   │
│   └── orders_api/        # FastAPI backend
│       ├── app/
│       │   ├── models.py  # Database models
│       │   ├── schemas.py # Pydantic schemas
│       │   ├── crud.py    # Database operations
│       │   ├── auth.py    # Authentication
│       │   └── main.py    # API endpoints
│       ├── migrate.py     # Database migrations
│       ├── seed.py        # Sample data seeding
│       └── Dockerfile
│
├── docker-compose.yml     # Production compose file
├── docker-compose.dev.yml # Development compose file
└── README.md
```

### Running in Development Mode

For development with hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Database Management

#### Run Migrations
```bash
docker-compose exec orders_api python migrate.py
```

#### Seed Sample Data
```bash
docker-compose exec orders_api python seed.py
```

#### Access Database
```bash
docker-compose exec db psql -U famuser -d famdb
```

### Rebuilding Services

After making changes to code:

```bash
# Rebuild specific service
docker-compose build admin_ui
docker-compose up -d admin_ui

# Rebuild all services
docker-compose build --no-cache
docker-compose up -d
```

## API Documentation

The API documentation is automatically generated and available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

#### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer

#### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/production-needs` - Production planning data

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=famuser
POSTGRES_PASSWORD=fampass
POSTGRES_DB=famdb

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# API
API_SECRET_KEY=your-secret-key-here
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_URL=http://localhost:8000
```

### Nginx Configuration

The frontend uses Nginx as a reverse proxy. Configuration is located at:
```
services/admin_ui/nginx.conf
```

## Design System

The application uses a modern, minimalist design system:

### Color Palette
- **Primary**: #171717 (Deep Black)
- **Secondary**: #737373 (Medium Gray)
- **Background**: #fafafa (Off White)
- **Border**: #e5e5e5 (Light Gray)
- **Danger**: #dc2626 (Modern Red)

### Typography
- **Font Family**: Inter, system fonts
- **Weights**: 500 (medium), 600 (semibold), 700 (bold)
- **Letter Spacing**: -0.025em for headings

### Components
- Rounded corners (6-8px)
- Subtle shadows (0 1px 3px rgba(0,0,0,0.05))
- Smooth transitions (0.15s ease)
- Uppercase labels with letter spacing

## Testing

### Frontend Tests
```bash
cd services/admin_ui
npm test
```

### Backend Tests
```bash
cd services/orders_api
pytest
```

## Deployment

### Production Considerations

1. **Security**
   - Change all default passwords
   - Use strong JWT secret keys
   - Enable HTTPS/SSL
   - Configure CORS properly
   - Implement rate limiting

2. **Performance**
   - Enable Redis caching
   - Configure database connection pooling
   - Use CDN for static assets
   - Enable Nginx gzip compression

3. **Monitoring**
   - Set up application logging
   - Configure error tracking
   - Monitor database performance
   - Track API response times

### Docker Production Build

```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Check what's using the port
lsof -i :3000
# Stop the conflicting service or change ports in docker-compose.yml
```

**Database connection errors**
```bash
# Restart database service
docker-compose restart db
# Check database logs
docker-compose logs db
```

**Frontend not updating**
```bash
# Clear browser cache (Cmd+Shift+R or Ctrl+Shift+F5)
# Rebuild without cache
docker-compose build --no-cache admin_ui
docker-compose up -d admin_ui
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions:
- Open an issue on GitHub
- Contact: [ruimcar@gmail.com]

## Acknowledgments

- React team for the excellent frontend framework
- FastAPI team for the modern Python web framework
- PostgreSQL community for the robust database system
- All contributors who have helped shape this project

---

**Version**: 1.0.0  
**Last Updated**: October 2025
