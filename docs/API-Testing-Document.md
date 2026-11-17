# Eshop API Testing Document

## Base URL
`https://localhost:7001` (development)

## Authentication
- **JWT Bearer Token** in `Authorization: Bearer {token}` header
- Register/Login to obtain token
- Admin endpoints require `Admin` role

## Endpoints

### 1. Auth

#### POST /api/auth/register
**No Auth**
```json
// Request
{
  \"name\": \"John Doe\",
  \"email\": \"john@example.com\",
  \"password\": \"password123\"
}

// Response 200
{\"message\": \"User registered successfully\"}
```
**Errors:** 400 (email exists)

#### POST /api/auth/login
**No Auth**
```json
// Request
{
  \"email\": \"john@example.com\",
  \"password\": \"password123\"
}

// Response 200
{
  \"token\": \"eyJhbGciOiJIUzI1Ni...",
  \"user\": {
    \"id\": 1,
    \"name\": \"John Doe\",
    \"email\": \"john@example.com\",
    \"role\": \"User\",
    \"address\": null
  }
}
```
**Errors:** 401 (invalid credentials)

### 2. Products (Public)

#### GET /api/products
**No Auth**
Query: `?categoryId=1&search=laptop&page=1&pageSize=8`
```json
// Response 200
{
  \"total\": 12,
  \"page\": 1,
  \"pageSize\": 8,
  \"products\": [
    {
      \"id\": 1,
      \"name\": \"Laptop\",
      \"price\": 999.99,
      \"description\": \"...",
      \"imageUrl\": \"/images/...jpg\",
      \"stock\": 10,
      \"category\": { \"id\": 1, \"name\": \"Electronics\" }
    }
  ]
}
```

#### GET /api/products/{id}
**No Auth**
**Response:** Single product or 404

### 3. Categories (Public)

#### GET /api/categories
**No Auth**
```json
// Response
[
  {
    \"id\": 1,
    \"name\": \"Electronics\",
    \"productCount\": 15
  }
]
```

### 4. Cart (Authenticated User)

#### GET /api/cart
**JWT User**
**Response:** Cart with items incl. product details

#### POST /api/cart
**JWT User**
```json
// Request
{
  \"productId\": 1,
  \"quantity\": 2
}
```

#### PUT /api/cart/items/{id}
**JWT User**
```json
{\"quantity\": 3}
```

#### DELETE /api/cart/items/{id}
**JWT User**

### 5. Orders (Authenticated User)

#### POST /api/orders
**JWT User** (Checkout)
```json
// Request
{
  \"shippingAddress\": \"123 Main St\",
  \"paymentMethod\": \"COD\"
}
```

#### POST /api/orders/razorpay/create-order
**JWT User**

#### POST /api/orders/razorpay/verify
**JWT User**
```json
{
  \"shippingAddress\": \"123 Main St\",
  \"razorpayOrderId\": \"order_...`,
  \"razorpayPaymentId\": \"pay_...\",
  \"razorpaySignature\": \"...\"
}
```

#### GET /api/orders
**JWT User** (history)

#### PUT /api/orders/{id}/cancel
**JWT User**

### 6. Admin Endpoints (Admin JWT)

#### Categories (Admin)
- POST /api/categories
- PUT /api/categories/{id}
- DELETE /api/categories/{id}
- DELETE /api/categories/all-unused

#### Products (Admin)
- POST /api/products
- PUT /api/products/{id}
- POST /api/products/upload (multipart file)
- DELETE /api/products/{id}
- DELETE /api/products/all

#### Users (Admin)
- GET /api/users
- PUT /api/users/{id}/role `{\"role\": \"Admin\"}`
- DELETE /api/users/{id}

#### Orders (Admin)
- GET /api/orders/all
- PUT /api/orders/{id}/status `{\"status\": \"Shipped\"}`
- DELETE /api/orders/{id}

## End-to-End Test Flow
1. POST register → get user ID
2. POST login → get JWT
3. GET categories → pick category ID
4. GET products → pick product ID
5. POST cart → add item
6. GET cart → verify
7. POST orders → checkout
8. GET orders → verify order created

## Testing Tools
- **Postman**: Import collection (see sister file)
- **dotnet test**: Run `dotnet test EshopAPI.Tests`
- **Swagger**: Available at /swagger (if enabled)
- **cURL** examples in each section

