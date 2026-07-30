# E-Commerce Frontend

React + Vite web client for the e-commerce microservices project.

This first slice covers **authentication (login/register)** and the **product listing**. Cart and checkout screens are planned next.

---

## Tech Stack

- React 18
- Vite 5
- React Router 6
- Axios (with JWT request interceptor)
- Plain CSS (no UI library)

---

## Prerequisites

The frontend talks to the backend services through Vite's dev proxy. For the current
screens you need at least these two services running:

| Service         | Port | Used for            |
|-----------------|------|---------------------|
| user-service    | 8081 | login / register    |
| product-service | 8082 | product listing     |

(The proxy is also pre-wired for cart `8083`, inventory `8084`, and order `8085` for later screens.)

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
    ├── components/
    │   ├── Navbar.jsx
    │   └── ProtectedRoute.jsx
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        └── Products.jsx
```

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

---

## Next Steps (not built yet)

- Cart page (cart-service, `/api/cart`)
- Checkout → create order (order-service, `/api/orders`)
- Show stock from inventory-service on product cards
- "Add to cart" button (currently disabled as a placeholder)
