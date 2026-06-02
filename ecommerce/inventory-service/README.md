# Inventory Service

The **Inventory Service** is a Python/FastAPI microservice for managing product stock levels in the e-commerce microservices project.

It stores inventory data in **PostgreSQL** and tracks total, reserved, and available quantities per product.

---

## Tech Stack

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Docker
- Docker Compose

---

## Environment Variables

Create a `.env` file using `.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventorydb
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

---

## Running the Service Locally

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Start PostgreSQL locally

If PostgreSQL is installed locally, make sure it is running and a database named `inventorydb` exists.

Or run PostgreSQL using Docker:

```bash
docker run --name inventory-db \
  -e POSTGRES_DB=inventorydb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5434:5432 \
  -d postgres:16
```

### 3. Start the Inventory Service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8084 --reload
```

The service will run on:

```text
http://localhost:8084
```

---

## Running with Docker Compose

From inside the `inventory-service` directory:

```bash
docker compose up -d
```

This starts:

- `inventory-db` on port `5434`
- `inventory-service` on port `8084`

To stop the containers:

```bash
docker compose down
```

To stop and remove PostgreSQL volume data:

```bash
docker compose down -v
```

---

## Health Check

### Check service health

```bash
curl http://localhost:8084/
```

Expected response:

```json
{
  "message": "Inventory Service is running"
}
```

---

## API Base URL

```text
http://localhost:8084/api/inventory
```

Interactive API docs (Swagger UI) are available at:

```text
http://localhost:8084/docs
```

---

## API Usage Commands

### 1. Create Inventory for a Product

```bash
curl -X POST http://localhost:8084/api/inventory/ \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "total_quantity": 100
  }'
```

Required fields:

```json
{
  "product_id": 1,
  "total_quantity": 100
}
```

Validation rules:

- `product_id` is required and must be unique
- `total_quantity` must be `>= 0`

---

### 2. Get Inventory by Product ID

```bash
curl http://localhost:8084/api/inventory/1
```

Here, `1` is the `product_id`.

---

### 3. Update Total Quantity

```bash
curl -X PUT http://localhost:8084/api/inventory/1 \
  -H "Content-Type: application/json" \
  -d '{
    "total_quantity": 150
  }'
```

Here, `1` is the `product_id`.

Validation rules:

- `total_quantity` must be `>= 0`
- `total_quantity` cannot be less than the current `reserved_quantity`

---

### 4. Reserve Stock

Reserves stock when an order is placed. Increases `reserved_quantity`.

```bash
curl -X POST http://localhost:8084/api/inventory/1/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10
  }'
```

Validation rules:

- `quantity` must be `> 0`
- Cannot reserve more than what is currently available

---

### 5. Release Stock

Releases previously reserved stock (e.g., order cancelled). Decreases `reserved_quantity`.

```bash
curl -X POST http://localhost:8084/api/inventory/1/release \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

Validation rules:

- `quantity` must be `> 0`
- Cannot release more than what is currently reserved

---

### 6. Deduct Stock

Deducts stock after a completed order. Decreases both `reserved_quantity` and `total_quantity`.

```bash
curl -X POST http://localhost:8084/api/inventory/1/deduct \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

Validation rules:

- `quantity` must be `> 0`
- Cannot deduct more than what is currently reserved

---

## Inventory Response Model

All endpoints return an `InventoryResponse` object:

```json
{
  "id": 1,
  "product_id": 1,
  "total_quantity": 100,
  "reserved_quantity": 10,
  "available_quantity": 90
}
```

| Field                | Description                                          |
|----------------------|------------------------------------------------------|
| `id`                 | Internal inventory record ID                         |
| `product_id`         | The product this inventory record belongs to         |
| `total_quantity`     | Total stock in warehouse                             |
| `reserved_quantity`  | Stock held for pending orders                        |
| `available_quantity` | Stock available for new orders (`total - reserved`)  |

---

## Database Model

Inventory data is stored in a PostgreSQL table named `inventory`.

| Column              | Type    | Description                         |
|---------------------|---------|-------------------------------------|
| `id`                | Integer | Primary key                         |
| `product_id`        | Integer | Unique product identifier           |
| `total_quantity`    | Integer | Total stock quantity                |
| `reserved_quantity` | Integer | Reserved (held) stock quantity      |

---

## Service Flow

```text
Product is created in product-service
        ↓
Inventory record is created via POST /api/inventory/
        ↓
Order is placed → reserve stock via POST /api/inventory/{product_id}/reserve
        ↓
Order is confirmed → deduct stock via POST /api/inventory/{product_id}/deduct
        ↓
Order is cancelled → release stock via POST /api/inventory/{product_id}/release
```

---

## Common Issues

### 1. Database connection error

Make sure PostgreSQL is running and the credentials in `.env` are correct.

For local development:

```env
DB_HOST=localhost
DB_PORT=5432
```

For Docker Compose:

```env
DB_HOST=inventory-db
DB_PORT=5432
```

---

### 2. Inventory already exists

This happens when trying to create an inventory record for a `product_id` that already has one.

```json
{
  "detail": "Inventory already exists for this product"
}
```

Use the `PUT /{product_id}` endpoint to update an existing inventory record instead.

---

### 3. Not enough stock available

This happens when trying to reserve more stock than what is currently available.

```json
{
  "detail": "Not enough stock available"
}
```

Check the current `available_quantity` using `GET /api/inventory/{product_id}` before reserving.

---

### 4. Cannot deduct/release more than reserved

This happens when the requested quantity exceeds `reserved_quantity`.

```json
{
  "detail": "Cannot deduct more than reserved stock"
}
```

Ensure the quantity matches what was previously reserved.
