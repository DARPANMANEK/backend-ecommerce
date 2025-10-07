## Frontend Integration Guide

This document explains how to integrate with the backend API from a frontend app.

### Base URL

- Local: `http://localhost:<PORT>/api`
  - The server mounts all routes at `/api`.
- Health check: `GET /api/health` → `{ ok: true }`

### Authentication

- JWT is returned from register/sign-in.
- Send it via header: `Authorization: Bearer <token>`.
- Protected endpoints require this header; admin endpoints also require `isAdmin: true` in the token.

### Auth Endpoints

- Register: `POST /api/auth/register`
- Sign in: `POST /api/auth/signin`
- Change password: `POST /api/auth/change-password` (auth)
- Reset password: `POST /api/auth/reset-password`

Register body:

```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "location": "NYC",
  "number": "1234567890",
  "password": "secret123",
  "age": 30
}
```

Register 201 response:

```json
{
  "token": "<jwt>",
  "user": { "id": "<id>", "email": "user@example.com", "name": "Jane Doe" }
}
```

Sign-in body:

```json
{ "email": "user@example.com", "password": "secret123" }
```

Sign-in 200 response (existing user):

```json
{
  "token": "<jwt>",
  "user": { "id": "<id>", "email": "user@example.com", "name": "Jane Doe" }
}
```

Sign-in 200 response (user not found):

```json
{ "userRegistered": false }
```

Change password body (auth):

```json
{ "currentPassword": "old", "newPassword": "newSecret123" }
```

Reset password body:

```json
{ "email": "user@example.com", "newPassword": "newSecret123" }
```

### Catalog Endpoints (`/api/shop`)

Categories:

- Create: `POST /api/shop/categories`
- Update: `PUT /api/shop/categories/:id`
- Delete: `DELETE /api/shop/categories/:id`
- List: `GET /api/shop/categories`

Category body:

```json
{ "name": "Beverages", "type": "drink", "visible": true, "sortID": 1 }
```

Products:

- Create: `POST /api/shop/products`
- Update: `PUT /api/shop/products/:id`
- Delete: `DELETE /api/shop/products/:id`
- List all: `GET /api/shop/products`
- By category: `GET /api/shop/products/category/:categoryId`
- Search: `GET /api/shop/products/search?q=<term>`

Product body:

```json
{
  "name": "Cola",
  "price": 10.5,
  "discountedPrice": 9.99,
  "description": "Tasty",
  "categoryid": "<categoryId>",
  "sortID": 10,
  "visible": true,
  "isinstock": true
}
```

Example list/search response (200):

```json
[
  {
    "id": "<id>",
    "name": "Cola",
    "price": "10.50",
    "discountedPrice": "9.99",
    "description": "Tasty",
    "visible": true,
    "isInStock": true,
    "sortId": 10,
    "category": { "id": "<categoryId>" }
  }
]
```

### Cart and Orders (`/api/shop`)

Cart:

- Create: `POST /api/shop/cart`
- Update: `PUT /api/shop/cart/:id`

Cart body:

```json
{
  "items": [
    { "productId": "<productId>", "quantity": 2 },
    { "productId": "<productId2>", "quantity": 1 }
  ]
}
```

Create 201 / Update 200 response:

```json
{
  "id": "<cartId>",
  "items": [
    { "id": "<cartItemId>", "product": { "id": "<productId>" }, "quantity": 2 }
  ],
  "totalAmount": "29.97"
}
```

Orders:

- Create: `POST /api/shop/orders` (auth)
  - Body: `{ "cartId": "<cartId>" }`
  - Response 201:
    ```json
    {
      "id": "<orderId>",
      "status": "pending",
      "totalAmount": "29.97",
      "items": [
        {
          "id": "<orderItemId>",
          "product": { "id": "<productId>" },
          "quantity": 2,
          "unitPrice": "9.99"
        }
      ]
    }
    ```
- List all: `GET /api/shop/orders` (admin)
- Update status: `PATCH /api/shop/orders/:id/status` (admin)
  - Body: `{ "status": "pending" | "completed" }`

### Error Format

- Validation errors: Zod `.flatten()` result (per-field issues).
- Other errors: `{ "message": "..." }` with status codes (401, 403, 404, 500).

### Frontend Usage Examples

Axios instance and auth header:

```ts
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export const api = axios.create({ baseURL: API_BASE_URL });

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
```

Auth flows:

```ts
// Register
const reg = await api.post("/auth/register", {
  email: "user@example.com",
  name: "Jane Doe",
  password: "secret123",
});
localStorage.setItem("token", reg.data.token);
setAuthToken(reg.data.token);

// Sign in
const res = await api.post("/auth/signin", { email, password });
if (res.data.userRegistered === false) {
  // Show registration flow
} else {
  localStorage.setItem("token", res.data.token);
  setAuthToken(res.data.token);
}
```

Fetch catalog:

```ts
const categories = (await api.get("/shop/categories")).data;
const products = (await api.get("/shop/products")).data;
const byCategory = (await api.get(`/shop/products/category/${categoryId}`))
  .data;
const search = (
  await api.get("/shop/products/search", { params: { q: "cola" } })
).data;
```

Cart and order:

```ts
// Create cart
const cart = (
  await api.post("/shop/cart", { items: [{ productId, quantity: 2 }] })
).data;

// Update cart
const updated = (
  await api.put(`/shop/cart/${cart.id}`, {
    items: [{ productId, quantity: 3 }],
  })
).data;

// Create order (requires auth)
const order = (await api.post("/shop/orders", { cartId: updated.id })).data;
```

Admin-only:

```ts
// Requires token with isAdmin = true
const orders = (await api.get("/shop/orders")).data;
await api.patch(`/shop/orders/${orderId}/status`, { status: "completed" });
```

### CORS and JSON

- CORS is enabled; send `Content-Type: application/json` for JSON bodies.
- All endpoints accept and return JSON.

### Frontend Environment

- Set `NEXT_PUBLIC_API_URL` (or similar) to `http://localhost:<PORT>/api` in your frontend `.env`.
- Persist the token (localStorage or cookies) and set the `Authorization` header for protected/admin endpoints.
