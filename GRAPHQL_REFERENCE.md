# GraphQL Reference

Dokumen ini merangkum seluruh Query dan Mutation yang tersedia di Gateway GraphQL (port `4000`). Seluruh contoh siap dijalankan di GraphQL Playground/Postman dengan mengisi panel `Query Variables`.

> **Tips:** Jika playground memunculkan error seperti `Variable "$orderId" of required type "ID!" was not provided`, berarti JSON Variables belum diisi atau key-nya salah ketik.

---

## Skema Singkat

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
```

---

## Queries

### 1. `restaurants`

```graphql
query GetRestaurants {
  restaurants {
    id
    name
    image
  }
}
```

Tidak membutuhkan variables.

---

### 2. `restaurant(id: ID!)`

```graphql
query GetRestaurant($id: ID!) {
  restaurant(id: $id) {
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
```

**Variables**
```json
{ "id": "1" }
```

---

### 3. `orders`
### 4. `order(id: ID!)`

```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    restaurant_id
    user_id
    total_price
    status
    items { name quantity }
    delivery { driverName status estimatedTime }
  }
}
```

**Variables**
```json
{ "id": "1" }
```

---

### 5. `delivery(orderId: ID!)`

```graphql
query GetDelivery($orderId: ID!) {
  delivery(orderId: $orderId) {
    driverName
    status
    estimatedTime
  }
}
```

**Variables**
```json
{ "orderId": "1" }
```

---

```graphql
query GetOrders {
  orders {
    id
    restaurant_id
    user_id
    total_price
    status
    items {
      name
      quantity
    }
    delivery {
      driverName
      status
      estimatedTime
    }
  }
}
```

Tidak membutuhkan variables.

---

## Mutations

### 1. `createOrder`

```graphql
mutation CreateOrder($restaurantId: ID!, $userId: String!, $items: [OrderItemInput]!) {
  createOrder(restaurantId: $restaurantId, userId: $userId, items: $items) {
    id
    status
  }
}
```

**Variables**
```json
{
  "restaurantId": "1",
  "userId": "user_demo",
  "items": [
    { "name": "Nasi Goreng Gila", "price": 25000, "quantity": 2 },
    { "name": "Es Teh Manis", "price": 5000, "quantity": 1 }
  ]
}
```

---

### 2. `updateOrderStatus`

```graphql
mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id
    status
  }
}
```

**Variables**
```json
{ "orderId": "1", "status": "ACCEPTED" }
```

---

### 3. `assignDriver`

```graphql
mutation AssignDriver($orderId: ID!) {
  assignDriver(orderId: $orderId) {
    driverName
    status
    estimatedTime
  }
}
```

**Variables**
```json
{ "orderId": "1" }
```

---

## Contoh Respons

```json
{
  "data": {
    "createOrder": {
      "id": "3",
      "status": "PENDING"
    }
  }
}
```

```json
{
  "data": {
    "assignDriver": {
      "driverName": "Budi (Motor 2)",
      "status": "ON_THE_WAY",
      "estimatedTime": "15 mins"
    }
  }
}
```

Dokumen ini mencakup semua fitur GraphQL yang ada pada sistem: pemesanan, pembaruan status, penugasan driver, serta query data restoran/pesanan. Silakan gunakan sesuai kebutuhan testing.

