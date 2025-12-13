# API Documentation

## Overview
Sistem ini terdiri dari 4 service utama yang berkomunikasi melalui **Gateway (GraphQL)**.

1. **Gateway** (GraphQL) - Port 4000
2. **Restaurant Service** (REST) - Port 5001
3. **Order Service** (REST) - Port 5002
4. **Delivery Service** (REST) - Port 5003

---

## 🧩 GraphQL Schema Definition
Definisi tipe data yang digunakan dalam API.

```graphql
type Menu {
  id: ID
  name: String
  price: Int
}

type Restaurant {
  id: ID
  name: String
  image: String
  menus: [Menu]
}

type OrderItem {
  name: String
  price: Int
  quantity: Int
}

type Delivery {
  driverName: String
  status: String
  estimatedTime: String
}

type Order {
  id: ID
  restaurant_id: ID
  user_id: String
  total_price: Int
  status: String
  items: [OrderItem]
  delivery: Delivery
}

input OrderItemInput {
  name: String!
  price: Int!
  quantity: Int!
}
```

---

## 🚀 GraphQL Gateway API
**Endpoint:** `http://localhost:4000`

### Queries

#### 1. Get All Restaurants
Mendapatkan daftar restoran.
```graphql
query {
  restaurants {
    id
    name
    image
  }
}
```

#### 2. Get Restaurant Details & Menu
Mendapatkan detail restoran spesifik beserta menunya.
```graphql
query {
  restaurant(id: "1") {
    id
    name
    menus {
      id
      name
      price
    }
  }
}
```

#### 3. Get All Orders (For Dashboard)
Mendapatkan semua order beserta status dan info delivery.
```graphql
query {
  orders {
    id
    status
    total_price
    items {
      name
      quantity
    }
    delivery {
      driverName
      status
    }
  }
}
```

### Mutations

#### 1. Create Order
Membuat pesanan baru (Status awal: `PENDING`).
```graphql
mutation {
  createOrder(
    restaurantId: "1",
    userId: "user_1",
    items: [{name: "Burger", price: 50000, quantity: 1}]
  ) {
    id
    status
  }
}
```

#### 2. Update Order Status (Restaurant Action)
Mengubah status pesanan (misal `PENDING` -> `ACCEPTED`).
```graphql
mutation {
  updateOrderStatus(orderId: "1", status: "ACCEPTED") {
    id
    status
  }
}
```

#### 3. Assign Driver (Restaurant Action)
Mencari driver untuk pesanan (Status order berubah jadi `ON_THE_WAY`).
```graphql
mutation {
  assignDriver(orderId: "1") {
    driverName
    estimatedTime
  }
}
```

---

## 🔌 Microservices REST API (Internal)

### Restaurant Service (Port 5001)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/restaurants` | Get all restaurants |
| `GET` | `/restaurants/:id` | Get restaurant details & menu |

### Order Service (Port 5002)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/orders` | Create new order |
| `GET` | `/orders` | Get all orders |
| `GET` | `/orders/:id` | Get order details |
| `PUT` | `/orders/:id/status` | Update order status |

### Delivery Service (Port 5003)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/delivery/assign` | Assign driver to order |
| `GET` | `/delivery/:orderId` | Get delivery info by order ID |

---

## 🛠️ Arsitektur
Client hanya berkomunikasi dengan **Gateway (GraphQL)**. Gateway kemudian melakukan request HTTP ke service terkait (Restaurant, Order, Delivery) dan menggabungkan datanya sebelum dikembalikan ke Client.
