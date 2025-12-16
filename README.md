# Pembangunan Aplikasi Terintegrasi Menggunakan GraphQL API dan Docker

## Deskripsi
Aplikasi Food Delivery sederhana yang mengintegrasikan Client (Frontend), Gateway (GraphQL), dan beberapa Microservices (Restaurant, Order, Delivery) menggunakan Docker. Project ini disusun untuk memenuhi Tugas Besar Mata Kuliah Integrasi Aplikasi Enterprise.

## 👥 Anggota Kelompok
* [Andrarieza Rizqi Pradana] - [102022330319]
* [Deazard Muhammad Arrayyan] - [102022300118]
* [Muhamad Habibi Budiman] - [102022300226]
* [Muhammad Alvin Zufar Saputra] - [102022300193]

## 🏗️ Arsitektur Sistem
Sistem ini menggunakan pola **Microservices** dengan **API Gateway**.

*   **Client**: HTML/JS Frontend (Port 3000)
*   **Gateway**: Apollo Server GraphQL (Port 4000) - Pintu masuk utama semua request.
*   **Restaurant Service**: Mengelola data restoran & menu (Port 5001).
*   **Order Service**: Mengelola pemesanan (Port 5002).
*   **Delivery Service**: Mengelola penugasan driver (Port 5003).

Client hanya berkomunikasi dengan Gateway melalui Query/Mutation GraphQL. Gateway kemudian meneruskan request ke service terkait melalui REST API internal.

## ⚙️ Instalasi & Cara Menjalankan

### Prasyarat
*   Docker Desktop (Running)
*   Git

### Langkah-langkah
1.  Clone repository ini.
2.  Buat file `.env` di root folder dengan Supabase credentials:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
    ```
    **⚠️ PENTING**: File `.env` dengan credentials Supabase yang valid **WAJIB** ada. Aplikasi tidak akan berjalan tanpa koneksi ke Supabase database.

3.  Jalankan aplikasi dengan Docker Compose:
    ```bash
    docker-compose up --build
    ```

4.  Tunggu hingga semua container berjalan (Client, Gateway, Services).

## 🚀 Akses Aplikasi

*   **Frontend (User & Restaurant Interface)**: [http://localhost:3000](http://localhost:3000)
*   **GraphQL Playground**: [http://localhost:4000](http://localhost:4000)

## 🛠️ Fitur

1.  **GraphQL API Modular**: Menggunakan Schema dan Resolvers yang terpisah.
2.  **Dual Role POV**:
    *   **Client**: Melihat restoran, melihat menu, membuat pesanan, tracking status order.
    *   **Restaurant**: Menerima pesanan (Accept), memanggil driver (Assign Driver).
3.  **Dockerized**: Seluruh environment dibungkus dalam container.

## 📝 Schema Type (ERD Representation)

```graphql
type Restaurant {
  id: ID
  name: String
  image: String
  menus: [Menu]
}

type Order {
  id: ID
  total_price: Int
  status: String
  items: [OrderItem]
  delivery: Delivery
}
```

*Selengkapnya lihat di `gateway/src/schema.js`*

