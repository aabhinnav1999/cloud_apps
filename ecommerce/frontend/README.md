# E-Commerce Frontend

React + Vite web client for the e-commerce microservices project.

Covers the full shopping flow: **authentication (login/register)**, **product listing**
with search + category filter and live stock, **cart**, **checkout**, **order history**,
**in-app notifications**, and an **admin** area (create categories/products, set inventory).

---

## Tech Stack

- React 18
- Vite 5
- React Router 6
- Axios (with JWT request interceptor)
- Plain CSS (no UI library)

---

## Prerequisites

The frontend talks to the backend through the **API gateway** (`:8080`) via Vite's dev
proxy. You need the gateway plus these services running for the full flow:

| Service         | Port | Used for                    |
|-----------------|------|-----------------------------|
| api-gateway     | 8080 | single entry point / routing|
| user-service    | 8081 | login / register            |
| product-service | 8082 | product listing             |
| cart-service    | 8083 | cart (add / update / remove)|
| inventory-service | 8084 | live stock, admin set-stock |
| order-service   | 8085 | checkout, order history     |
| notification-service | 8086 | in-app notifications     |

cart-service needs **Redis**, inventory/order-service each need **PostgreSQL**, and
notification-service needs **MongoDB** (all handled by their respective `docker compose up`).

Note: order-service also calls inventory-service to reserve stock at checkout, so an
inventory record must exist for each product (create one from the **Admin** page, or
`POST /api/inventory/`) or the order fails.

### Admin access

The Admin area is gated on `user.role === "ADMIN"`. Registration creates `CUSTOMER`
users, so to see it, promote a user in the user-service database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Then log out and back in (the role travels in the stored user object).

---

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The app runs on:

```text
http://localhost:5173
```

---

## How it works

### API calls & CORS

The browser only ever calls **same-origin** `/api/...` paths. Vite's dev server
(`vite.config.js`) proxies **all** of them to the **API gateway** (`:8080`), which routes
each prefix to the owning service. So the frontend depends on a single URL:

```text
/api/**  → http://localhost:8080  (api-gateway → user/product/cart/inventory/order/notification)
```

Override the target with `VITE_API_TARGET` (e.g. a deployed gateway). If you'd rather run
without the gateway, point `VITE_API_TARGET` at a single service or restore the
per-service proxy rules from this file's git history.

### Authentication

- On login/register, the JWT and user object are stored in `localStorage`.
- `src/api/client.js` attaches `Authorization: Bearer <token>` to every request.
- A `401` response clears the session and redirects to `/login`.
- `/products` is wrapped in a `ProtectedRoute` — you must be logged in to view it.

---

## Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js          # dev proxy to backend services
└── src/
    ├── main.jsx            # app entry (Router + Auth/Cart/Notification providers)
    ├── App.jsx             # routes
    ├── index.css           # global styles
    ├── api/
    │   ├── client.js       # axios instance, JWT interceptor, error helper
    │   ├── cart.js         # cart-service calls (unwraps { data })
    │   ├── orders.js       # order-service calls + cart→order item mapping
    │   ├── inventory.js    # stock read + admin create/update/set
    │   ├── catalog.js      # categories + product create (product-service)
    │   └── notifications.js# notification-service calls
    ├── context/
    │   ├── AuthContext.jsx        # login / register / logout + session state
    │   ├── CartContext.jsx        # cart state, add/update/remove, badge count
    │   └── NotificationContext.jsx# notifications + unread badge
    ├── components/
    │   ├── Navbar.jsx      # cart + bell badges, admin link
    │   ├── ProtectedRoute.jsx     # requires login
    │   └── AdminRoute.jsx         # requires ADMIN role
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        ├── Products.jsx    # search, category filter, live stock, add to cart
        ├── Cart.jsx        # qty +/-, remove, clear, totals
        ├── Checkout.jsx    # shipping form → create order (+ notification)
        ├── Orders.jsx      # order history + cancel
        ├── Notifications.jsx      # list, mark-read, delete
        └── Admin.jsx       # create category / product / set inventory
```

## Shopping flow

```text
Products → Add to cart (cart-service)
        → Cart: adjust quantities / remove
        → Checkout: shipping form → POST /api/orders
              (order-service reserves stock AND emits a notification server-side)
        → Cart cleared → Orders: confirmation + history (cancel if PENDING/CONFIRMED)
```

Notes:
- Cart items store `name`/`imageUrl`, but order items expect `productName` —
  `src/api/orders.js#cartItemToOrderItem` handles that mapping at checkout.
- Order notifications are emitted **server-side** by the order-service (keyed by the
  user's email); the frontend just refreshes the bell after checkout and lists them.

---

## Backend Contracts Used

**Login** — `POST /api/auth/login`
```json
{ "email": "user@example.com", "password": "password123" }
```
Response: `{ "token": "...", "user": { "id", "fullName", "email", "phoneNumber", "role", "createdAt" } }`

**Register** — `POST /api/auth/register`
```json
{ "fullName": "John Doe", "email": "user@example.com", "password": "password123", "phoneNumber": "9876543210" }
```

**List products** — `GET /api/products?search=<term>&category_id=<id>&is_active=true`
Response: array of `{ id, name, description, brand, price, image_url, is_active, created_at, category_id, category_name }`

**Categories / product create** (admin)
- `GET /api/categories` → `[{ id, name }]` · `POST /api/categories` → `{ name }`
- `POST /api/products` → `{ name, description, brand, price, image_url, category_id, is_active }`

**Inventory**
- `GET /api/inventory/:productId` → `{ product_id, total_quantity, reserved_quantity, available_quantity }`
- `POST /api/inventory/` → `{ product_id, total_quantity }` · `PUT /api/inventory/:productId` → `{ total_quantity }`

**Notifications** (wrapped as `{ success, data }`)
- `GET /api/notifications/user/:userId` → `data` = `[{ _id, title, message, type, status, orderId, createdAt }]`
- `POST /api/notifications/` → `{ userId, orderId, type, channel, title, message }`
- `PATCH /api/notifications/:id/read` · `DELETE /api/notifications/:id`

**Cart** (all JWT; responses wrapped as `{ success, message, data }`)
- `GET /api/cart` → `data` = `{ items[], totalItems, totalQuantity, totalAmount }`
- `POST /api/cart/items` → `{ productId, name, brand, price, imageUrl, quantity }`
- `PUT /api/cart/items/:productId` → `{ quantity }`
- `DELETE /api/cart/items/:productId` · `DELETE /api/cart`

**Orders** (all JWT; raw JSON, no wrapper)
- `POST /api/orders` → `{ fullName, phoneNumber, addressLine1, addressLine2?, city, state, country, postalCode, items[{ productId, productName, brand, price, quantity }] }`
- `GET /api/orders` → `OrderResponse[]` · `PUT /api/orders/:id/cancel`

---

## Next Steps (not built yet)

- Admin: edit/deactivate existing products, list all orders, update order status
- Order detail page (`GET /api/orders/:id`)
- Centralized JWT auth / rate limiting at the gateway
