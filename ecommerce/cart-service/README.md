# Cart Service

The **Cart Service** is a Node.js/Express microservice for managing a user's shopping cart in the e-commerce microservices project.

It stores cart data in **Redis** and protects all cart APIs using **JWT authentication**.

---

## Tech Stack

- Node.js
- Express.js
- Redis
- JSON Web Token (JWT)
- Docker
- Docker Compose
---

## Environment Variables

Create a `.env` file using `.env.example`:

```env
PORT=8083
NODE_ENV=development

JWT_SECRET=mySuperSecretKeyForJwtTokenGeneration1234567890

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

> Important: The `JWT_SECRET` must match the secret used by your `user-service`, otherwise the Cart Service will reject the token.

---

## Running the Service Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start Redis locally

If Redis is installed locally:

```bash
redis-server
```

Or run Redis using Docker:

```bash
docker run --name cart-db -p 6379:6379 -d redis:7
```

### 3. Start the Cart Service

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

The service will run on:

```text
http://localhost:8083
```

---

## Running with Docker Compose

From inside the `cart-service` directory:

```bash
docker compose up -d
```

This starts:

- `cart-db` on port `6379`
- `cart-service` on port `8083`

To stop the containers:

```bash
docker compose down
```

To stop and remove Redis volume data:

```bash
docker compose down -v
```

---

## Health Check

### Check service health

```bash
curl http://localhost:8083/health
```

Expected response:

```json
{
  "service": "cart-service",
  "status": "up",
  "port": 8083
}
```

---

## Authentication

All cart endpoints require a JWT token.

Add this header to every cart API request:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

You can get the token by logging in through the `user-service`.

Example:

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com",
    "password": "password123"
  }'
```

Copy the JWT token from the login response and use it in the cart requests below.

---

## API Base URL

```text
http://localhost:8083/api/cart
```

---

## API Usage Commands

### 1. Get My Cart

```bash
curl http://localhost:8083/api/cart -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Add Item to Cart

```bash
curl -X POST http://localhost:8083/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": 1,
    "name": "Wireless Mouse",
    "brand": "LogiTech",
    "price": 29.99,
    "imageUrl": "https://example.com/images/mouse.jpg",
    "quantity": 2
  }'
```

Required fields:

```json
{
  "productId": 1,
  "name": "Wireless Mouse",
  "brand": "LogiTech",
  "price": 29.99,
  "imageUrl": "https://example.com/images/mouse.jpg",
  "quantity": 2
}
```

Validation rules:

- `productId`, `name`, `brand`, `price`, `imageUrl`, and `quantity` are required
- `price` must be greater than `0`
- `quantity` must be a positive integer

---

### 3. Update Cart Item Quantity

```bash
curl -X PUT http://localhost:8083/api/cart/items/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "quantity": 5
  }'
```

Here, `1` is the `productId`.

Validation rules:

- `quantity` is required
- `quantity` must be a positive integer

---

### 4. Remove Item from Cart

```bash
curl -X DELETE http://localhost:8083/api/cart/items/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Here, `1` is the `productId`.

---

### 5. Clear My Cart

```bash
curl -X DELETE http://localhost:8083/api/cart -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Redis Data Model

Cart data is stored in Redis using the user's email as part of the key.

Key format:

```text
cart:user@example.com
```

Example:

```text
cart:testuser1@example.com
```

The cart value is stored as a JSON string.

---

## Service Flow

```text
User logs in through user-service
        ↓
User receives JWT token
        ↓
User sends cart request with Authorization header
        ↓
Cart Service validates JWT
        ↓
Cart Service reads/writes cart data in Redis
```

---

## Useful NPM Scripts

```bash
npm run dev
```

Runs the service with `nodemon` for development.

```bash
npm start
```

Runs the service normally using Node.js.

---

## Common Issues

### 1. Redis connection error

Make sure Redis is running and the host/port are correct.

For local development:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

For Docker Compose:

```env
REDIS_HOST=cart-db
REDIS_PORT=6379
```

---

### 2. Invalid or missing token

Make sure the request includes:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Also confirm that `JWT_SECRET` is the same in both `user-service` and `cart-service`.

---

### 3. Cart item not found

This happens when updating or deleting a product ID that does not exist in the user's cart.
