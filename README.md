# 🍔 Food Delivery System - Microservices Architecture

Complete food delivery platform with authentication, role-based access control, and multi-database architecture.

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │ (HTML/JS - Port 3000)
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│     Apollo GraphQL Gateway (Port 4000)   │
│  - JWT Verification                      │
│  - Role-based Access Control             │
│  - Single Entry Point                    │
└──────┬──────────────────────────────────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │  Restaurant  │  │    Order     │  │   Delivery   │  │    Client    │
│   (5004)     │  │  Service     │  │   Service    │  │   Service    │  │   (3000)     │
│              │  │   (5001)     │  │   (5002)     │  │   (5003)     │  │              │
│  Express.js  │  │  Express.js  │  │  Express.js  │  │  Express.js  │  │  Static HTML │
│  + Supabase  │  │  + MongoDB   │  │  + Supabase  │  │  + MongoDB   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## 🗄️ Database Strategy

### Supabase PostgreSQL
- **Auth Service**: Users, roles, restaurant requests
- **Order Service**: Orders and order items

### MongoDB Atlas
- **Restaurant Service**: Restaurants and menus
- **Delivery Service**: Delivery tracking

## 👥 User Roles & Permissions

### 🛒 CUSTOMER
- ✅ Register & login
- ✅ Browse all restaurants & menus (public)
- ✅ Create orders (authenticated)
- ✅ View own order history
- ✅ Track own delivery status

### 👨‍🍳 RESTAURANT OWNER
- ✅ Register as owner
- ✅ Request restaurant creation (requires admin approval)
- ✅ After approval:
  - Manage own restaurant only
  - CRUD menu items
  - View & update orders for own restaurant
  - Assign drivers to deliveries

### 👑 SUPER ADMIN
- ✅ Approve/reject restaurant requests
- ✅ View all restaurants, orders, deliveries
- ✅ Full system access

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Supabase account (free tier)
- MongoDB Atlas account (free tier)

### 1. Clone & Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - SUPABASE_URL and SUPABASE_KEY
# - MONGODB_URI
# - JWT_SECRET (already generated)
```

### 2. Setup Databases

#### Supabase Setup
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Open SQL Editor
3. Run `migrations/001_auth_schema.sql`
4. Verify tables created: `users`, `restaurant_owners`, `restaurant_requests`

#### MongoDB Setup
```bash
# Seed MongoDB with sample data
node migrations/002_mongodb_seed.js
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Access the Application

- **Client**: http://localhost:3000
- **GraphQL Gateway**: http://localhost:4000
- **Auth Service**: http://localhost:5004
- **Restaurant Service**: http://localhost:5001
- **Order Service**: http://localhost:5002
- **Delivery Service**: http://localhost:5003

## 🔐 Authentication Flow

### JWT Token Structure
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "CUSTOMER | OWNER | ADMIN",
  "exp": 1234567890
}
```

- **Access Token**: 1 hour expiry
- **Refresh Token**: 7 days expiry
- **Password Hashing**: bcrypt (10 salt rounds)

### Default Admin Account
```
Email: admin@fooddelivery.com
Password: admin123
```

## 📡 API Endpoints

### Auth Service (Port 5004)

```bash
# Register customer
POST /auth/register
{
  "email": "customer@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "CUSTOMER"
}

# Register owner
POST /auth/register-owner
{
  "email": "owner@example.com",
  "password": "password123",
  "name": "Jane Owner",
  "restaurantName": "My Restaurant",
  "restaurantDescription": "Best food in town"
}

# Login
POST /auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}

# Refresh token
POST /auth/refresh
{
  "refreshToken": "your_refresh_token"
}

# Get current user (requires auth)
GET /auth/me
Headers: Authorization: Bearer <token>

# Get restaurant requests (ADMIN only)
GET /auth/restaurant-requests?status=PENDING
Headers: Authorization: Bearer <admin_token>

# Approve/reject request (ADMIN only)
PUT /auth/restaurant-requests/:id
Headers: Authorization: Bearer <admin_token>
{
  "status": "APPROVED",
  "restaurantId": "mongodb_restaurant_id"
}
```

### Restaurant Service (Port 5001)

```bash
# Get all restaurants (PUBLIC)
GET /restaurants

# Get restaurant by ID (PUBLIC)
GET /restaurants/:id

# Create restaurant (ADMIN only)
POST /restaurants
Headers: Authorization: Bearer <admin_token>
{
  "name": "New Restaurant",
  "image": "https://...",
  "ownerId": "user_uuid"
}

# Update restaurant (OWNER - own only)
PUT /restaurants/:id
Headers: Authorization: Bearer <owner_token>
{
  "name": "Updated Name",
  "image": "https://..."
}

# Get menus (PUBLIC)
GET /restaurants/:id/menus

# Create menu (OWNER - own restaurant)
POST /restaurants/:id/menus
Headers: Authorization: Bearer <owner_token>
{
  "name": "Nasi Goreng",
  "price": 25000,
  "available": true
}

# Update menu (OWNER - own restaurant)
PUT /menus/:id
Headers: Authorization: Bearer <owner_token>
{
  "name": "Nasi Goreng Special",
  "price": 30000
}

# Delete menu (OWNER - own restaurant)
DELETE /menus/:id
Headers: Authorization: Bearer <owner_token>
```

### Order Service (Port 5002)

```bash
# Create order (CUSTOMER only)
POST /orders
Headers: Authorization: Bearer <customer_token>
{
  "restaurantId": "1",
  "items": [
    { "name": "Nasi Goreng", "price": 25000, "quantity": 2 }
  ]
}

# Get orders (role-based filtering)
GET /orders
Headers: Authorization: Bearer <token>
# CUSTOMER: sees own orders
# OWNER: add ?restaurantIds=1,2,3
# ADMIN: sees all orders

# Get order by ID
GET /orders/:id

# Update order status (OWNER/ADMIN)
PUT /orders/:id/status
Headers: Authorization: Bearer <owner_token>
{
  "status": "ACCEPTED"
}
```

### Delivery Service (Port 5003)

```bash
# Assign driver
POST /delivery/assign
{
  "orderId": "123"
}

# Get delivery info
GET /delivery/:orderId
```

## 🎯 GraphQL Operations

### Mutations

```graphql
# Register Customer
mutation {
  register(input: {
    email: "customer@example.com"
    password: "password123"
    name: "John Doe"
    role: CUSTOMER
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
    }
  }
}

# Register Owner
mutation {
  registerOwner(input: {
    email: "owner@example.com"
    password: "password123"
    name: "Jane Owner"
    restaurantName: "My Restaurant"
    restaurantDescription: "Best food"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
    }
  }
}

# Login
mutation {
  login(input: {
    email: "customer@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
      restaurantIds
    }
  }
}

# Create Order (requires auth header)
mutation {
  createOrder(
    restaurantId: "1"
    items: [
      { name: "Nasi Goreng", price: 25000, quantity: 2 }
    ]
  ) {
    id
    status
    total_price
  }
}
```

### Queries

```graphql
# Get current user (requires auth)
query {
  me {
    id
    email
    name
    role
    restaurantIds
  }
}

# Get restaurants (public)
query {
  restaurants {
    id
    name
    image
    menus {
      id
      name
      price
    }
  }
}

# Get orders (role-based)
query {
  orders {
    id
    restaurant_id
    user_id
    total_price
    status
    items {
      name
      quantity
      price
    }
    delivery {
      driverName
      status
    }
  }
}
```

## 🔧 Development

### Run Individual Services

```bash
# Auth Service
cd auth-service
npm install
npm start

# Restaurant Service
cd restaurant-service
npm install
npm start

# Order Service
cd order-service
npm install
npm start

# Delivery Service
cd delivery-service
npm install
npm start

# Gateway
cd gateway
npm install
npm start
```

### Environment Variables

See `.env.example` for all required variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/public key
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `JWT_EXPIRES_IN` - Access token expiry (default: 1h)
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiry (default: 7d)

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f gateway

# Rebuild specific service
docker-compose up -d --build auth-service
```

## 🧪 Testing

### Test Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:5004/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","role":"CUSTOMER"}'

# 2. Login
curl -X POST http://localhost:5004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Use token
curl http://localhost:5004/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Project Structure

```
tubes-iae/
├── auth-service/
│   ├── src/
│   │   ├── index.js        # Main server
│   │   ├── db.js           # Supabase connection
│   │   ├── auth.js         # JWT utilities
│   │   ├── middleware.js   # Auth middleware
│   │   └── validators.js   # Input validation
│   ├── Dockerfile
│   └── package.json
├── restaurant-service/
│   ├── src/
│   │   ├── index.js        # Main server
│   │   ├── db.js           # MongoDB connection
│   │   └── middleware.js   # Auth middleware
│   ├── Dockerfile
│   └── package.json
├── order-service/
│   ├── src/
│   │   ├── index.js        # Main server
│   │   ├── db.js           # Supabase connection
│   │   └── middleware.js   # Auth middleware
│   ├── Dockerfile
│   └── package.json
├── delivery-service/
│   ├── src/
│   │   ├── index.js        # Main server
│   │   ├── db.js           # MongoDB connection
│   │   └── middleware.js   # Auth middleware
│   ├── Dockerfile
│   └── package.json
├── gateway/
│   ├── src/
│   │   ├── index.js        # Apollo Server
│   │   ├── schema.js       # GraphQL schema
│   │   ├── resolvers.js    # GraphQL resolvers
│   │   └── auth.js         # JWT utilities
│   ├── Dockerfile
│   └── package.json
├── client/
│   ├── index.html          # Frontend
│   └── Dockerfile
├── migrations/
│   ├── 001_auth_schema.sql      # Supabase migration
│   └── 002_mongodb_seed.js      # MongoDB seed data
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛡️ Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Ownership validation
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is for educational purposes.

## 👨‍💻 Authors

- Your Team Name

## 🙏 Acknowledgments

- Supabase for database hosting
- MongoDB Atlas for document database
- Apollo GraphQL for API gateway
