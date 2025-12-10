# GraphQL Queries & Mutations

Berikut adalah contoh Query dan Mutation GraphQL untuk berinteraksi dengan sistem (Gateway).

## Mutations

> **Catatan penting:** Gunakan *variables* pada Playground/Postman supaya tidak perlu mengubah query setiap kali mencoba. Contoh variabel diletakkan setelah query.

### 1. Create Order
Membuat pesanan baru untuk restoran tertentu dengan daftar item.

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

### 2. Update Order Status
Dipakai restoran untuk mengubah status (misal `PENDING` → `ACCEPTED`).

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
{
  "orderId": "1",
  "status": "ACCEPTED"
}
```

### 3. Assign Driver
Men-trigger Delivery Service agar mencari driver manual. Setelah driver ditemukan, status order otomatis diubah menjadi `ON_THE_WAY`.

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
{
  "orderId": "1"
}
```

## Queries

### 1. Get All Restaurants
Mendapatkan daftar semua restoran beserta menu mereka.

```graphql
query GetRestaurants {
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
```

### 2. Get All Orders
Mendapatkan daftar semua pesanan beserta status pengirimannya.

```graphql
query GetOrders {
  orders {
    id
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

### 3. Get Order by ID
Digunakan untuk melihat detail satu pesanan (termasuk info delivery jika sudah ada).

```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
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

**Variables**
```json
{ "id": "1" }
```

### 4. Get Delivery by Order ID

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

### Cara Memasukkan Query & Variables di GraphQL Playground
1. Buka `http://localhost:4000`.
2. Tempel query di panel kiri.
3. Klik tombol `Query Variables` di kiri bawah dan masukkan JSON seperti contoh di atas.
4. Tekan tombol ▶️ (Run). Jika *variables* tidak diisi, akan muncul error seperti:
   ```
   "message": "Variable \"$orderId\" of required type \"ID!\" was not provided."
   ```
   Artinya GraphQL menunggu variabel wajib (`$orderId`, `$status`, dll) tetapi belum diberikan di panel Variables.

