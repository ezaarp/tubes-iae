# Laporan Teknis: Sistem Integrasi Aplikasi Food Delivery (GraphQL & Docker)

---

## 📋 1. Pendahuluan

### 1.1 Latar Belakang
Dalam ekosistem aplikasi enterprise modern, integrasi antar layanan yang efisien dan skalabilitas adalah kunci utama. Proyek ini dirancang untuk mensimulasikan arsitektur **Microservices** untuk aplikasi pemesanan makanan (*Food Delivery*). Sistem ini memisahkan fungsi bisnis menjadi layanan-layanan independen yang berkomunikasi melalui **API Gateway** berbasis **GraphQL**, dan dibungkus dalam container **Docker** untuk memastikan konsistensi deployment.

### 1.2 Tujuan Proyek
*   **Implementasi GraphQL**: Menyediakan satu pintu masuk (*Single Source of Truth*) bagi client untuk mengakses data dari berbagai layanan.
*   **Arsitektur Microservices**: Memecah aplikasi monolith menjadi layanan terpisah (Restaurant, Order, Delivery).
*   **Containerization**: Menggunakan Docker untuk membungkus setiap layanan beserta dependensinya.
*   **Orkestrasi**: Menggunakan Docker Compose untuk menjalankan seluruh ekosistem dengan satu perintah.

---

## 🏗️ 2. Arsitektur Sistem

Sistem ini terdiri dari 5 komponen utama yang berjalan dalam container terpisah:

### Diagram Arsitektur Tingkat Tinggi
```mermaid
graph TD
    User[Client Browser] -->|HTTP Request| Frontend[Frontend (Port 3000)]
    User -->|GraphQL Query/Mutation| Gateway[Gateway (Port 4000)]
    
    subgraph Docker Ecosystem
        Frontend
        Gateway
        
        Gateway -->|REST API| RestaurantService[Restaurant Service (Port 5001)]
        Gateway -->|REST API| OrderService[Order Service (Port 5002)]
        Gateway -->|REST API| DeliveryService[Delivery Service (Port 5003)]
        
        RestaurantService <--> DB1[(Mock / Supabase)]
        OrderService <--> DB2[(Mock / Supabase)]
        DeliveryService <--> DB3[(Mock / Supabase)]
    end
```

### Komponen Layanan

| Service | Port | Teknologi | Fungsi Utama |
| :--- | :--- | :--- | :--- |
| **Client** | `3000` | HTML, Tailwind, JS | Antarmuka pengguna (Buyer & Restaurant Owner). |
| **Gateway** | `4000` | Apollo Server | API Gateway GraphQL yang menggabungkan data dari semua service. |
| **Restaurant** | `5001` | Express (REST) | Mengelola data restoran dan menu. |
| **Order** | `5002` | Express (REST) | Mengelola pembuatan dan status pesanan. |
| **Delivery** | `5003` | Express (REST) | Mengelola penugasan driver. |

---

## 💻 3. Implementasi GraphQL

GraphQL digunakan di layer Gateway untuk menyederhanakan komunikasi data.

### 3.1 Schema Definition (Type System)
Schema didefinisikan secara modular di `gateway/src/schema.js`.

```graphql
type Order {
  id: ID
  total_price: Int
  status: String
  items: [OrderItem]
  delivery: Delivery # Relation field
}

type Mutation {
  createOrder(restaurantId: ID!, userId: String!, items: [OrderItemInput]!): Order
  assignDriver(orderId: ID!): Delivery
}
```

### 3.2 Resolvers & Data Fetching
Resolvers (`gateway/src/resolvers.js`) bertugas mengambil data dari microservices REST API menggunakan `axios`.

**Contoh Resolver untuk `assignDriver`:**
```javascript
assignDriver: async (_, { orderId }) => {
  // 1. Panggil Delivery Service
  const res = await axios.post(`${DELIVERY_SERVICE}/delivery/assign`, { orderId });
  
  // 2. Update Status di Order Service (Inter-service communication simulation)
  await axios.put(`${ORDER_SERVICE}/orders/${orderId}/status`, { status: 'ON_THE_WAY' });
  
  return res.data;
}
```

---

## 🐳 4. Implementasi Docker

Setiap layanan memiliki `Dockerfile` sendiri, dan diorkestrasi menggunakan `docker-compose.yml`.

### 4.1 Dockerfile (Contoh: Gateway)
Menggunakan image ringan `node:18-alpine` untuk efisiensi.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
CMD ["node", "src/index.js"]
```

### 4.2 Docker Compose
Mengatur jaringan (`network`), port mapping, dan dependency (`depends_on`).

```yaml
services:
  gateway:
    build: ./gateway
    ports: ["4000:4000"]
    environment:
      - RESTAURANT_SERVICE_URL=http://restaurant-service:5001
      # ... URL service lainnya
    depends_on:
      - restaurant-service
      - order-service
```

---

## 📱 5. Fitur Aplikasi (User Guide)

Aplikasi memiliki dua tampilan utama (*Point of View*):

### A. Client View (Pembeli)
1.  **Homepage**: Memilih role "I'm Hungry".
2.  **Restaurant List**: Melihat daftar restoran yang tersedia.
3.  **Menu & Cart**: Memilih menu dan memasukkan ke keranjang.
4.  **Order Tracking**: Setelah checkout, user dapat melihat status pesanan secara realtime:
    *   `PENDING` (Kuning): Menunggu restoran.
    *   `ACCEPTED` (Biru): Sedang dimasak.
    *   `ON_THE_WAY` (Hijau): Driver sedang menuju lokasi.

### B. Restaurant View (Mitra)
1.  **Dashboard**: Melihat ringkasan pendapatan dan order aktif.
2.  **Incoming Orders**:
    *   Tombol **"Accept"**: Mengubah status order dari `PENDING` ke `ACCEPTED`.
    *   Tombol **"Call Driver"**: Mengubah status ke `ON_THE_WAY` dan sistem akan memilih driver secara acak.

---

## 🚀 6. Panduan Instalasi & Menjalankan

### Prasyarat
*   Docker & Docker Compose terinstall.
*   Koneksi internet (untuk pull image Node.js & CDN Frontend).

### Langkah-langkah
1.  **Clone Repository**:
    ```bash
    git clone <repository_url>
    cd tubes-iae
    ```

2.  **Build & Run**:
    Jalankan perintah berikut di terminal:
    ```bash
    docker-compose up --build
    ```
    *(Tunggu hingga semua container berstatus `Running`)*.

3.  **Akses Aplikasi**:
    *   Buka Browser: [http://localhost:3000](http://localhost:3000)
    *   GraphQL Playground: [http://localhost:4000](http://localhost:4000)

### Troubleshooting
Jika tampilan tidak berubah setelah update kode, lakukan force rebuild:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## 🧪 7. Pengujian API

Anda dapat menguji API langsung melalui GraphQL Playground di `http://localhost:4000`.

**Contoh Query Data Restoran:**
```graphql
query {
  restaurants {
    id
    name
    image
  }
}
```

**Contoh Mutation Buat Order:**
```graphql
mutation {
  createOrder(
    restaurantId: "1", 
    userId: "User1", 
    items: [{name: "Nasi Goreng", price: 25000, quantity: 2}]
  ) {
    id
    status
  }
}
```

---

## 📝 Kesimpulan

Sistem ini berhasil mendemonstrasikan integrasi aplikasi modern dengan:
1.  **Modularitas**: Kode Backend terpisah (Schema & Resolver) dan Microservices terisolasi.
2.  **Skalabilitas**: Setiap service berjalan di container sendiri.
3.  **User Experience**: Frontend modern yang terhubung ke Gateway GraphQL secara *seamless*.
4.  **Reliabilitas**: Error handling diimplementasikan di level Gateway untuk menangani kegagalan microservice.

