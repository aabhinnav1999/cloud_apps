# 🔔 Notification Service

The **Notification Service** is a microservice in the e-commerce platform responsible for managing user notifications.

It supports:
- Order notifications
- Delivery updates
- In-app notification storage
- Notification status tracking

The service is built using:

- Node.js
- Express.js
- MongoDB
- Docker
- Docker Compose

---

# 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Docker
- Docker Compose

---



# ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=8086
MONGO_URI=mongodb://mongodb:27017/notificationdb
```

---

# 🐳 Docker Compose

## docker-compose.yml

```yaml
version: '3.9'

services:

  notification-service:
    build: .
    container_name: notification-service

    ports:
      - "8086:8086"

    env_file:
      - .env

    depends_on:
      - mongodb

    restart: unless-stopped

  mongodb:
    image: mongo:7

    container_name: notification-mongodb

    ports:
      - "27017:27017"

    volumes:
      - mongodb_data:/data/db

    restart: unless-stopped

volumes:
  mongodb_data:
```

---

# ▶️ Running the Application

## Build and Start

```bash
docker compose up --build
```

## Run in Background

```bash
docker compose up -d --build
```

---

# 📦 Verify Containers

```bash
docker ps
```

Expected containers:

```text
notification-service
notification-mongodb
```

---

# 📡 API Base URL

```text
http://localhost:8086/api/notifications
```

---

# 🧪 API Usage Examples

---

# 1️⃣ Create Notification

## Endpoint

```http
POST /api/notifications
```

## CURL

```bash
curl -X POST http://localhost:8086/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1",
    "orderId": "ORD-1001",
    "type": "ORDER_CREATED",
    "channel": "APP",
    "title": "Order Created",
    "message": "Your order ORD-1001 has been created successfully."
  }'
```

## Sample Response

```json
{
  "success": true,
  "message": "Notification created successfully"
}
```

---

# 2️⃣ Get All Notifications

## Endpoint

```http
GET /api/notifications
```

## CURL

```bash
curl http://localhost:8086/api/notifications
```

---

# 3️⃣ Get Notifications By User

## Endpoint

```http
GET /api/notifications/user/:userId
```

## CURL

```bash
curl http://localhost:8086/api/notifications/user/1
```

---

# 4️⃣ Mark Notification As Read

## Endpoint

```http
PATCH /api/notifications/:id/read
```

## CURL

```bash
curl -X PATCH http://localhost:8086/api/notifications/NOTIFICATION_ID/read
```

---

# 5️⃣ Delete Notification

## Endpoint

```http
DELETE /api/notifications/:id
```

## CURL

```bash
curl -X DELETE http://localhost:8086/api/notifications/NOTIFICATION_ID
```

---

# 🧪 MongoDB Verification

Enter MongoDB container:

```bash
docker exec -it notification-mongodb mongosh
```

Use database:

```javascript
use notificationdb
```

View notifications:

```javascript
db.notifications.find()
```

---



# 🛡 Health Check

## Endpoint

```http
GET /health
```

## CURL

```bash
curl http://localhost:8086/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "notification-service"
}
```
