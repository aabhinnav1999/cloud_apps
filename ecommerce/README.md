# E-commerce Application — Microservices Architecture

A full-stack e-commerce app built as independent microservices with a React frontend and a
Spring Cloud Gateway entry point. Each service owns its own database and communicates over
REST; users authenticate once (JWT) and the token is honored across services.

---

## Architecture

```text
                          ┌─────────────────────────┐
                          │   Frontend (React+Vite)  │  :5173
                          └────────────┬─────────────┘
                                       │  /api/**
                          ┌────────────▼─────────────┐
                          │   API Gateway (Spring)   │  :8080
                          └──┬───┬───┬───┬───┬───┬────┘
        ┌────────────┬───────┘   │   │   │   │   └────────────┐
        ▼            ▼           ▼   ▼   ▼   ▼                ▼
   user-service  product-svc   cart  inventory  order    notification
     :8081         :8082       :8083   :8084     :8085       :8086
   (Postgres)    (Postgres)   (Redis) (Postgres)(Postgres)  (MongoDB)
                                                   │  │
                                    reserve/deduct │  │ order events
                                                   ▼  ▼
                                        inventory-svc / notification-svc
```

---

## Services

| Service                | Stack                     | Port | Datastore  | Notes                                   |
|------------------------|---------------------------|------|------------|-----------------------------------------|
| **api-gateway**        | Java · Spring Cloud Gateway | 8080 | —        | Single entry point, routing, CORS       |
| **user-service**       | Java · Spring Boot        | 8081 | PostgreSQL | Auth (JWT), users, addresses            |
| **product-service**    | Python · FastAPI          | 8082 | PostgreSQL | Products & categories                   |
| **cart-service**       | Node.js · Express         | 8083 | Redis      | Shopping cart (JWT)                      |
| **inventory-service**  | Python · FastAPI          | 8084 | PostgreSQL | Stock: reserve / release / deduct       |
| **order-service**      | Java · Spring Boot        | 8085 | PostgreSQL | Orders; calls inventory + notification  |
| **notification-service** | Node.js · Express       | 8086 | MongoDB    | In-app notifications                    |
| **frontend**           | React · Vite              | 5173 | —          | Web client                              |

Each folder has its own `README.md` with detailed setup and API docs.

---

## Service interactions

- **Auth:** `user-service` issues a JWT on login/register. `cart-service` and
  `order-service` validate it (shared `JWT_SECRET`). Identity across services is the
  user's **email** (the JWT subject).
- **Checkout:** `order-service` reserves stock in `inventory-service` when an order is
  created (rolls back on failure), deducts on ship, releases on cancel — and emits an
  in-app notification to `notification-service` on order events (best-effort).
- **Gateway:** the frontend only talks to `api-gateway`, which routes each `/api/**`
  prefix to the owning service.

---

## Running the whole stack

### Option A — one command (recommended)

The root `docker-compose.yml` builds and runs **everything**: all databases, the six
services, the gateway, and the frontend (served by nginx). From this folder:

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

- First run builds all images (Maven/npm/pip downloads) and can take several minutes.
- Stop with `Ctrl+C`; tear down with `docker compose down` (add `-v` to wipe data).
- The frontend's nginx proxies `/api/**` to the gateway, which routes to each service.

### Option B — run services individually

Each folder also has its own `docker compose` (or run natively). Typical order:

1. Start each backend service (see its README) — they listen on 8081–8086.
2. Start the gateway: `cd api-gateway && mvn spring-boot:run`
3. Start the frontend (Vite dev server): `cd frontend && npm install && npm run dev`
4. Open http://localhost:5173.

### First-run data

Products need a **category**, and orders need an **inventory record** per product. The
quickest path: log in as an **admin** user and use the frontend **Admin** page to create a
category, a product, and set its stock. (Promote a user with
`UPDATE users SET role = 'ADMIN' WHERE email = '…';` in the user-service DB, then re-login.)

---

## Ports at a glance

```text
3000  frontend (compose)  8082  product-service     8085  order-service
5173  frontend (dev)      8083  cart-service        8086  notification-service
8080  api-gateway         8084  inventory-service
8081  user-service
```
