# E-Commerce Frontend

React + Vite web client for the e-commerce microservices project.

Covers the full shopping flow: **authentication (login/register)**, **product listing**, **cart**, **checkout**, and **order history**.

---

## Tech Stack

- React 18
- Vite 5
- React Router 6
- Axios (with JWT request interceptor)
- Plain CSS (no UI library)

---

## Prerequisites

The frontend talks to the backend services through Vite's dev proxy. You need these services running for the full flow:

| Service         | Port | Used for                    |
|-----------------|------|-----------------------------|
| user-service    | 8081 | login / register            |
| product-service | 8082 | product listing             |
| cart-service    | 8083 | cart (add / update / remove)|
| order-service   | 8085 | checkout, order history     |

cart-service also needs **Redis** running, and order-service needs its **PostgreSQL** DB
(both are handled by their respective `docker compose up`). The proxy is also pre-wired
for inventory `8084` for a later screen.

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
(`vite.config.js`) proxies each prefix to the correct backend service, so you do
**not** need to configure CORS on the services during development:

```text
/api/auth      → http://localhost:8081   (user-service)
/api/products  → http://localhost:8082   (product-service)
/api/cart      → http://localhost:8083   (cart-service)
/api/inventory → http://localhost:8084   (inventory-service)
/api/orders    → http://localhost:8085   (order-service)
```

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
    ├── main.jsx            # app entry (Router + AuthProvider)
    ├── App.jsx             # routes
    ├── index.css           # global styles
    ├── api/
    │   └── client.js       # axios instance, JWT interceptor, error helper
    ├── context/
    │   └── AuthContext.jsx # login / register / logout + session state
    ├── api/
    │   ├── client.js       # axios instance, JWT interceptor, error helper
    │   ├── cart.js         # cart-service calls (unwraps { data })
    │   └── orders.js       # order-service calls + cart→order item mapping
    ├── context/
    │   ├── AuthContext.jsx # login / register / logout + session state
    │   └── CartContext.jsx # cart state, add/update/remove, badge count
    ├── components/
    │   ├── Navbar.jsx      # cart badge + links
    │   └── ProtectedRoute.jsx
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        ├── Products.jsx    # add to cart
        ├── Cart.jsx        # qty +/-, remove, clear, totals
        ├── Checkout.jsx    # shipping form -> create order
        └── Orders.jsx      # order history + cancel
```

## Shopping flow

```text
Products → Add to cart (cart-service)
        → Cart: adjust quantities / remove
        → Checkout: shipping form → POST /api/orders (order-service)
        → Cart cleared → Orders: confirmation + history (cancel if PENDING/CONFIRMED)
```

Note: cart items store `name`/`imageUrl`, but order items expect `productName`.
`src/api/orders.js#cartItemToOrderItem` handles that mapping at checkout.

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

**List products** — `GET /api/products?search=<term>&is_active=true`
Response: array of `{ id, name, description, brand, price, image_url, is_active, created_at, category_id, category_name }`

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

- Show live stock from inventory-service on product cards / block over-ordering
- Reserve/deduct inventory when an order is placed (needs backend wiring too)
- Order detail page (`GET /api/orders/:id`)
- Product category filter (`GET /api/categories`)
