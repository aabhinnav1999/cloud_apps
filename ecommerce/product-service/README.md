# Product Service

The **Product Service** is a Python FastAPI microservice for managing product categories and products in the e-commerce application.

It provides APIs to:

- Create and list categories
- Create, list, search, update, and delete products
- Filter products by category and active status
- Expose product data to Cart, Order, and Inventory services

---

## Tech Stack

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL 16
- Docker and Docker Compose
- Pydantic

---


## Run with Docker Compose

From inside the `product-service` directory:

```bash
docker compose up --build
```

This starts:

- `product-db` on host port `5433`
- `product-service` on host port `8082`

Stop the service:

```bash
docker compose down
```

Stop and remove database volume:

```bash
docker compose down -v
```

---

## Run Locally Without Docker

Start PostgreSQL and create a database named `productdb`, then install dependencies:

```bash
pip install -r requirements.txt
```

Run the FastAPI application:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8082 --reload
```

---

## Health Check

```bash
curl http://localhost:8082/health
```

Expected response:

```json
{
  "service": "product-service",
  "status": "up",
  "port": 8082
}
```

---

# Category APIs

## 1. Create Category

```bash
curl -X POST http://localhost:8082/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics"
  }'
```

Example response:

```json
{
  "id": 1,
  "name": "Electronics"
}
```

---

## 2. Get All Categories

```bash
curl http://localhost:8082/api/categories
```

Example response:

```json
[
  {
    "id": 1,
    "name": "Electronics"
  }
]
```

---

# Product APIs

## 1. Create Product

```bash
curl -X POST http://localhost:8082/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "description": "Latest Apple smartphone with advanced camera",
    "brand": "Apple",
    "price": 999.99,
    "image_url": "https://example.com/images/iphone15.jpg",
    "category_id": 1,
    "is_active": true
  }'
```

Example response:

```json
{
  "id": 1,
  "name": "iPhone 15",
  "description": "Latest Apple smartphone with advanced camera",
  "brand": "Apple",
  "price": 999.99,
  "image_url": "https://example.com/images/iphone15.jpg",
  "is_active": true,
  "created_at": "2026-05-05T16:30:00",
  "category_id": 1,
  "category_name": "Electronics"
}
```

---

## 2. Get All Products

```bash
curl http://localhost:8082/api/products
```

---

## 3. Get Product by ID

```bash
curl http://localhost:8082/api/products/1
```

---

## 4. Search Products

Search by product name, description, or matching service logic:

```bash
curl "http://localhost:8082/api/products?search=iphone"
```

---

## 5. Filter Products by Category

```bash
curl "http://localhost:8082/api/products?category_id=1"
```

---

## 6. Filter Products by Active Status

Get only active products:

```bash
curl "http://localhost:8082/api/products?is_active=true"
```

Get inactive products:

```bash
curl "http://localhost:8082/api/products?is_active=false"
```

---

## 7. Combine Filters

```bash
curl "http://localhost:8082/api/products?category_id=1&search=iphone&is_active=true"
```

---

## 8. Update Product

```bash
curl -X PUT http://localhost:8082/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Updated Apple smartphone with Pro camera features",
    "brand": "Apple",
    "price": 1199.99,
    "image_url": "https://example.com/images/iphone15-pro.jpg",
    "category_id": 1,
    "is_active": true
  }'
```

You can also update only selected fields:

```bash
curl -X PUT http://localhost:8082/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 899.99,
    "is_active": true
  }'
```

---

## 9. Delete Product

```bash
curl -X DELETE http://localhost:8082/api/products/1
```

Expected result:

```text
204 No Content
```

---

## Validation Rules

### Category

| Field | Rule |
|---|---|
| `name` | Required, 2 to 100 characters |

### Product

| Field | Rule |
|---|---|
| `name` | Required, 2 to 150 characters |
| `description` | Required, minimum 5 characters |
| `brand` | Required, 2 to 100 characters |
| `price` | Required, must be greater than 0 |
| `image_url` | Required, must be a valid URL |
| `category_id` | Required, must reference an existing category |
| `is_active` | Optional, default is `true` |

---

## Common Errors

### Product Not Found

```json
{
  "detail": "Product not found"
}
```

### Invalid Category or Validation Error

```json
{
  "detail": "Category not found"
}
```

or FastAPI validation errors if required fields are missing or invalid.

---

## Useful Docker Commands

View running containers:

```bash
docker ps
```

View service logs:

```bash
docker logs product-service
```

View database logs:

```bash
docker logs product-db
```

Open PostgreSQL shell inside the container:

```bash
docker exec -it product-db psql -U postgres -d productdb
```

---

## Notes

- The application automatically creates database tables at startup using SQLAlchemy `Base.metadata.create_all(bind=engine)`.
- Create a category before creating a product because `category_id` is required.
- Product Service runs on port `8082`.
- PostgreSQL container maps internal port `5432` to host port `5433`.
