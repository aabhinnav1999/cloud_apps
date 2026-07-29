# Order Service

The **Order Service** is a Java/Spring Boot microservice for placing and managing customer orders in the e-commerce microservices project.

It stores order data in **PostgreSQL** and protects all order APIs using **JWT authentication**. Each order belongs to the authenticated user (identified by the email inside the JWT).

---

## Tech Stack

- Java 17
- Spring Boot 3.3.5
- Spring Web (REST APIs)
- Spring Security + JWT (jjwt 0.11.5)
- Spring Data JPA / Hibernate
- Bean Validation (Jakarta Validation)
- Lombok
- PostgreSQL
- Maven
- Docker
- Docker Compose

---

## Environment Variables

The service reads the following environment variables (defaults shown):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orderdb
DB_USERNAME=postgres
DB_PASSWORD=postgres

JWT_SECRET=mySuperSecretKeyForJwtTokenGeneration1234567890
JWT_EXPIRATION=86400000
```

> Important: The `JWT_SECRET` must match the secret used by your `user-service`, otherwise the Order Service will reject the token.

---

## Running the Service Locally

### 1. Start PostgreSQL

Make sure PostgreSQL is running and a database named `orderdb` exists.

Or run PostgreSQL using Docker:

```bash
docker run --name order-db \
  -e POSTGRES_DB=orderdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5435:5432 \
  -d postgres:16
```

### 2. Build the project

```bash
mvn clean package -DskipTests
```

### 3. Run the service

```bash
mvn spring-boot:run
```

Or run the built jar directly:

```bash
java -jar target/order-service-0.0.1-SNAPSHOT.jar
```

The service will run on:

```text
http://localhost:8085
```

> Note: Tables are auto-created/updated by Hibernate (`ddl-auto: update`), so no manual schema setup is required.

---

## Running with Docker Compose

From inside the `order-service` directory:

```bash
docker compose up -d
```

This starts:

- `order-db` (PostgreSQL) on host port `5435`
- `order-service` on port `8085`

To stop the containers:

```bash
docker compose down
```

To stop and remove PostgreSQL volume data:

```bash
docker compose down -v
```

---

## Authentication

All order endpoints require a JWT token.

Add this header to every order API request:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

You can get the token by logging in through the `user-service`:

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com",
    "password": "password123"
  }'
```

Copy the JWT token from the login response and use it in the order requests below.

The service identifies the current user from the email inside the token — orders are always scoped to that user.

---

## API Base URL

```text
http://localhost:8085/api/orders
```

---

## API Usage Commands

### 1. Create an Order

```bash
curl -X POST http://localhost:8085/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fullName": "John Doe",
    "phoneNumber": "9876543210",
    "addressLine1": "221B Baker Street",
    "addressLine2": "Near City Center",
    "city": "London",
    "state": "London",
    "country": "UK",
    "postalCode": "NW16XE",
    "items": [
      {
        "productId": 1,
        "productName": "Wireless Mouse",
        "brand": "LogiTech",
        "price": 29.99,
        "quantity": 2
      }
    ]
  }'
```

Validation rules:

- `fullName`, `phoneNumber`, `addressLine1`, `postalCode` are required (`addressLine2` is optional)
- `items` must contain at least one item
- For each item: `productId`, `productName`, `brand`, `price`, `quantity` are required
- `price` must be at least `0.01`
- `quantity` must be at least `1`

The `totalAmount` is calculated automatically as the sum of `price × quantity` for all items. New orders are created with status `PENDING`. Returns `201 Created`.

---

### 2. Get My Orders

Returns all orders for the current user, newest first.

```bash
curl http://localhost:8085/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get a Single Order

```bash
curl http://localhost:8085/api/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Here, `1` is the `orderId`. Returns `404` if the order does not exist or does not belong to the current user.

---

### 4. Update Order Status

```bash
curl -X PUT http://localhost:8085/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "CONFIRMED"
  }'
```

Allowed status transitions:

```text
PENDING    → CONFIRMED, CANCELLED
CONFIRMED  → SHIPPED, CANCELLED
SHIPPED    → DELIVERED
DELIVERED  → (terminal, no further changes)
CANCELLED  → (terminal, no further changes)
```

Invalid transitions return `400 Bad Request`.

---

### 5. Cancel My Order

```bash
curl -X PUT http://localhost:8085/api/orders/1/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Here, `1` is the `orderId`. An order cannot be cancelled once it is `SHIPPED` or `DELIVERED`.

---

### 6. Health Check

```bash
curl http://localhost:8085/api/orders/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:

```text
order-service is up
```

---

## Order Status Lifecycle

```text
PENDING ──► CONFIRMED ──► SHIPPED ──► DELIVERED
   │            │
   └──► CANCELLED ◄──┘
```

| Status      | Description                                  |
|-------------|----------------------------------------------|
| `PENDING`   | Order created, awaiting confirmation         |
| `CONFIRMED` | Order confirmed and being prepared           |
| `SHIPPED`   | Order dispatched to the customer             |
| `DELIVERED` | Order delivered (terminal)                   |
| `CANCELLED` | Order cancelled (terminal)                   |

---

## Data Model

### `orders` table

| Field          | Type            | Description                          |
|----------------|-----------------|--------------------------------------|
| `id`           | Long (identity) | Primary key                          |
| `userEmail`    | String          | Owner of the order (from JWT)        |
| `fullName`     | String          | Recipient name                       |
| `phoneNumber`  | String          | Contact number                       |
| `addressLine1` | String          | Address line 1                       |
| `addressLine2` | String          | Address line 2 (optional)            |
| `city`         | String          | City                                 |
| `state`        | String          | State                                |
| `country`      | String          | Country                              |
| `postalCode`   | String          | Postal / ZIP code                    |
| `status`       | Enum (String)   | Order status                         |
| `totalAmount`  | BigDecimal      | Total order amount (auto-calculated) |
| `createdAt`    | LocalDateTime   | Creation timestamp                   |
| `items`        | List<OrderItem> | Line items (one-to-many)             |

### `order_items` (line items)

| Field         | Type       | Description                     |
|---------------|------------|---------------------------------|
| `id`          | Long       | Primary key                     |
| `productId`   | Long       | Product identifier              |
| `productName` | String     | Product name                    |
| `brand`       | String     | Product brand                   |
| `price`       | BigDecimal | Unit price                      |
| `quantity`    | Integer    | Quantity ordered                |
| `subTotal`    | BigDecimal | `price × quantity`              |

---

## Service Flow

```text
User logs in through user-service
        ↓
User receives JWT token
        ↓
User sends order request with Authorization header
        ↓
Order Service validates JWT (identity from token email)
        ↓
Order Service reads/writes orders in PostgreSQL
```

---

## Common Issues

### 1. Database connection error

Make sure PostgreSQL is running and the credentials are correct.

For local development:

```env
DB_HOST=localhost
DB_PORT=5432
```

For Docker Compose:

```env
DB_HOST=order-db
DB_PORT=5432
```

---

### 2. Invalid or missing token

Make sure the request includes:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Also confirm that `JWT_SECRET` is the same in both `user-service` and `order-service`. A bad or expired token returns `401 Unauthorized`.

---

### 3. Order not found

This happens when fetching, updating, or cancelling an order ID that does not exist or does not belong to the current user (returns `404`).

---

### 4. Invalid status transition

Returns `400 Bad Request` when the requested status change is not allowed by the lifecycle (e.g. cancelling a `SHIPPED` order, or changing a `DELIVERED`/`CANCELLED` order).
