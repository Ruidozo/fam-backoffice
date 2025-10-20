# User Authentication System

## Overview

The FAM Padaria system now includes a complete user authentication and authorization system with:

- **Login/Logout functionality**
- **JWT token-based authentication**
- **Role-based access control (RBAC)**
- **User management interface (Admin only)**

## User Roles

The system supports three user roles:

1. **Admin** - Full system access including user management
2. **Manager** - Can manage orders, products, and customers (future implementation)
3. **Operator** - Basic access to view and manage orders

## Default Users

After running the seed script, these default users are created:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin | admin123 | Admin | admin@fampadaria.com |
| operator | operator123 | Operator | operator@fampadaria.com |

**⚠️ Important:** Change these default passwords in production!

## Features

### Backend (FastAPI)

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Tokens**: 8-hour token expiration
- **Protected Endpoints**: Most API endpoints require authentication
- **User CRUD**: Complete user management API (admin only)

### Frontend (React)

- **Login Page**: Clean, modern login interface
- **Authentication Context**: Global authentication state management
- **Protected Routes**: Automatic redirection to login if not authenticated
- **User Management Page**: Full CRUD interface for managing users (admin only)
- **User Menu**: Shows current user and logout button

## API Endpoints

### Authentication

```
POST /auth/login
  - Body: username, password (form data)
  - Returns: JWT token and user info

GET /auth/me
  - Headers: Authorization: Bearer <token>
  - Returns: Current user info
```

### Users (Admin Only)

```
GET /users
  - List all users

GET /users/{id}
  - Get specific user

POST /users
  - Create new user
  - Body: {username, email, full_name, password, role}

PUT /users/{id}
  - Update user
  - Body: {email, full_name, password, role, is_active}

DELETE /users/{id}
  - Delete user
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd services/orders_api
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python migrate.py
```

### 3. Seed Default Users

```bash
python seed.py
```

### 4. Start the Services

```bash
docker-compose up -d
```

## Usage

### Login

1. Navigate to `http://localhost/login`
2. Enter username and password
3. Click "Entrar" (Login)

### User Management (Admin Only)

1. Login as admin user
2. Click "Utilizadores" in the navigation menu
3. Create, edit, or delete users as needed

### Logout

Click the "Sair" button in the top-right corner

## Security Considerations

### Production Deployment

Before deploying to production:

1. **Change SECRET_KEY** in `services/orders_api/app/auth.py`
   ```python
   SECRET_KEY = os.getenv("SECRET_KEY", "your-production-secret-key")
   ```

2. **Change default passwords** for all users

3. **Use environment variables** for sensitive configuration:
   ```bash
   export SECRET_KEY="your-secure-random-key"
   export ACCESS_TOKEN_EXPIRE_MINUTES="480"
   ```

4. **Enable HTTPS** for secure token transmission

5. **Implement password complexity requirements**

6. **Add rate limiting** to prevent brute force attacks

7. **Enable CORS properly** - restrict to specific origins:
   ```python
   allow_origins=["https://yourdomain.com"]
   ```

## Development

### Adding New Protected Routes

```python
from app.auth import get_current_user, require_role
from app.models import UserRole

# Require any authenticated user
@app.get('/protected')
def protected_endpoint(current_user = Depends(get_current_user)):
    return {"user": current_user.username}

# Require specific role
@app.get('/admin-only')
def admin_endpoint(
    current_user = Depends(require_role([UserRole.admin]))
):
    return {"message": "Admin access"}
```

### Frontend Protected Routes

```jsx
import { useAuth } from './AuthContext'

function MyComponent() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return <div>Protected content</div>
}
```

## Troubleshooting

### "Could not validate credentials" Error

- Token may have expired (8 hours)
- Token may be invalid
- Solution: Logout and login again

### "Insufficient permissions" Error

- User doesn't have required role
- Solution: Contact admin to update user role

### Users page not showing

- Only visible to admin users
- Check user role in database or API

### Can't login with default credentials

- Ensure seed script was run: `python seed.py`
- Check database for users table
- Verify password is correct

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Session management
- [ ] Audit logging
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts
- [ ] Role-based UI elements (show/hide based on permissions)
- [ ] User activity tracking
- [ ] OAuth/SSO integration
