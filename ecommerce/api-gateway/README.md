# API Gateway

The **API Gateway** is the single entry point for the e-commerce microservices project.
It is a Java/Spring Boot service built on **Spring Cloud Gateway** that routes each API
path prefix to the owning backend service and applies **CORS** centrally.

Instead of the frontend (or any client) knowing six different ports, it talks only to the
gateway on port **8080**.

---

## Tech Stack

- Java 17
- Spring Boot 3.3.5
- Spring Cloud Gateway (2023.0.x)
- Maven
- Docker / Docker Compose

---

## Routing

| Path prefix                                   | Routed to            | Default URL             |
|-----------------------------------------------|----------------------|-------------------------|
| `/api/auth/**`, `/api/users/**`, `/api/addresses/**` | user-service   | `http://localhost:8081` |
| `/api/products/**`, `/api/categories/**`      | product-service      | `http://localhost:8082` |
| `/api/cart/**`                                | cart-service         | `http://localhost:8083` |
| `/api/inventory/**`                           | inventory-service    | `http://localhost:8084` |
| `/api/orders/**`                              | order-service        | `http://localhost:8085` |
| `/api/notifications/**`                       | notification-service | `http://localhost:8086` |

Each downstream URL is overridable via an environment variable
(`USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `CART_SERVICE_URL`, `INVENTORY_SERVICE_URL`,
`ORDER_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`).

The gateway forwards the full path unchanged (it does **not** strip the prefix), so each
service keeps its existing `/api/...` mappings. JWT is still validated by each service —
the gateway does not currently authenticate (a natural place to add it later).

---

## Environment Variables

Defaults point at services on `localhost`. Override for Docker or remote hosts:

```env
USER_SERVICE_URL=http://localhost:8081
PRODUCT_SERVICE_URL=http://localhost:8082
CART_SERVICE_URL=http://localhost:8083
INVENTORY_SERVICE_URL=http://localhost:8084
ORDER_SERVICE_URL=http://localhost:8085
NOTIFICATION_SERVICE_URL=http://localhost:8086
```

---

## Running Locally

```bash
mvn spring-boot:run
```

Or build and run the jar:

```bash
mvn clean package
java -jar target/api-gateway-0.0.1-SNAPSHOT.jar
```

The gateway runs on:

```text
http://localhost:8080
```

Start the backend services (each in its own folder) before or after the gateway — the
gateway resolves downstream services per request, so start order doesn't matter.

---

## Running with Docker Compose

From inside the `api-gateway` directory:

```bash
docker compose up -d
```

The compose file reaches the other services (running in their own compose files) via
`host.docker.internal`. To run everything on one shared Docker network instead, point the
`*_SERVICE_URL` vars at the service container names.

---

## Example

With the gateway and services running, all calls go through port 8080:

```bash
# Login (→ user-service)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "testuser1@example.com", "password": "password123" }'

# List products (→ product-service)
curl http://localhost:8080/api/products

# Get cart (→ cart-service, needs JWT)
curl http://localhost:8080/api/cart -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## CORS

The gateway allows the frontend origin `http://localhost:5173` with credentials for all
routes (configured under `spring.cloud.gateway.globalcors`). Update `allowedOrigins` when
deploying the frontend to another origin.

> In local dev the frontend uses Vite's proxy, so requests are same-origin and the
> gateway's CORS config is exercised mainly in production (frontend served separately).

---

## Next Steps

- Centralize JWT validation at the gateway (a `GlobalFilter` / security filter)
- Rate limiting (`RequestRateLimiter` filter)
- Request/response logging and correlation IDs
- Service discovery (Eureka) instead of static URLs
