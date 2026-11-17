# 3. System Design

This section describes the system design for the E-Shop project. The application is a React frontend connected to an ASP.NET Core Web API, SQL Server database, JWT authentication, role-based authorization, and Razorpay payment flow.

## 3.1. Use Case Diagram

```mermaid
flowchart LR
    Customer([Customer / Registered User])
    Admin([Admin])
    Razorpay([Razorpay Payment Gateway])

    subgraph System["E-Shop System"]
        UC_Register((Register Account))
        UC_Login((Login / Logout))
        UC_Browse((Browse Products))
        UC_Search((Search Products))
        UC_Filter((Filter by Category))
        UC_ViewProduct((View Product Details))
        UC_Cart((Manage Cart))
        UC_Checkout((Checkout))
        UC_Payment((Make Online Payment))
        UC_Orders((View Orders))
        UC_Cancel((Cancel Order))
        UC_Invoice((View Invoice))

        UC_AdminLogin((Admin Login))
        UC_Products((Manage Products))
        UC_Categories((Manage Categories))
        UC_Users((Manage Users and Roles))
        UC_AllOrders((Manage All Orders))
        UC_Upload((Upload Product Image))
    end

    Customer --> UC_Register
    Customer --> UC_Login
    Customer --> UC_Browse
    Customer --> UC_Search
    Customer --> UC_Filter
    Customer --> UC_ViewProduct
    Customer --> UC_Cart
    Customer --> UC_Checkout
    Customer --> UC_Orders
    Customer --> UC_Cancel
    Customer --> UC_Invoice

    UC_Checkout --> UC_Payment
    UC_Payment --> Razorpay

    Admin --> UC_AdminLogin
    Admin --> UC_Products
    Admin --> UC_Categories
    Admin --> UC_Users
    Admin --> UC_AllOrders
    Admin --> UC_Upload

    UC_Products --> UC_Upload
```

## 3.2. Class Diagram

```mermaid
classDiagram
    class User {
        +int Id
        +string Name
        +string Email
        +string PasswordHash
        +string Address
        +string Role
    }

    class Category {
        +int Id
        +string Name
    }

    class Product {
        +int Id
        +string Name
        +decimal Price
        +string Description
        +string ImageUrl
        +int Stock
        +int CategoryId
        +double Rating
        +int NumReviews
    }

    class Cart {
        +int Id
        +int UserId
        +List~CartItem~ Items
    }

    class CartItem {
        +int Id
        +int CartId
        +int ProductId
        +int Quantity
    }

    class Order {
        +int Id
        +int UserId
        +decimal Total
        +string Status
        +string PaymentMethod
        +string ShippingAddress
        +DateTime CreatedAt
        +List~OrderItem~ Items
    }

    class OrderItem {
        +int Id
        +int OrderId
        +int ProductId
        +int Quantity
        +decimal Price
    }

    User "1" --> "0..1" Cart : owns
    User "1" --> "0..*" Order : places
    Category "1" --> "0..*" Product : contains
    Cart "1" *-- "0..*" CartItem : has
    Product "1" --> "0..*" CartItem : added as
    Order "1" *-- "1..*" OrderItem : has
    Product "1" --> "0..*" OrderItem : purchased as
```

## 3.3. Interaction Diagram

The main interaction flow is the customer checkout and payment process.

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend as React Frontend
    participant API as ASP.NET Core API
    participant DB as SQL Server Database
    participant Razorpay as Razorpay

    Customer->>Frontend: Login with email and password
    Frontend->>API: POST /api/auth/login
    API->>DB: Validate user credentials
    DB-->>API: User record
    API-->>Frontend: JWT token and user profile

    Customer->>Frontend: Browse/search/filter products
    Frontend->>API: GET /api/products and GET /api/categories
    API->>DB: Fetch product and category data
    DB-->>API: Products and categories
    API-->>Frontend: Product listing

    Customer->>Frontend: Add product to cart
    Frontend->>API: POST /api/cart
    API->>DB: Create/update cart item
    DB-->>API: Updated cart
    API-->>Frontend: Cart response

    Customer->>Frontend: Open checkout and enter address
    Frontend->>API: GET /api/cart
    API->>DB: Fetch cart with products
    DB-->>API: Cart items and totals
    API-->>Frontend: Cart details

    Customer->>Frontend: Click Pay with Razorpay
    Frontend->>API: POST /api/orders/razorpay/create-order
    API->>DB: Validate cart and stock
    DB-->>API: Cart total
    API->>Razorpay: Create Razorpay order
    Razorpay-->>API: Razorpay order id
    API-->>Frontend: Key, order id, amount, currency

    Frontend->>Razorpay: Open Razorpay checkout
    Customer->>Razorpay: Complete payment
    Razorpay-->>Frontend: Payment id and signature

    Frontend->>API: POST /api/orders/razorpay/verify
    API->>API: Verify payment signature
    API->>DB: Create order, add order items, reduce stock, clear cart, update address
    DB-->>API: Saved order
    API-->>Frontend: Order placed
    Frontend-->>Customer: Redirect to dashboard
```

## 3.4. Activity Diagram

```mermaid
flowchart TD
    Start([Start])
    Browse[Browse, search, or filter products]
    Select[Open product details]
    LoggedIn{User logged in?}
    Login[Login or register]
    AddCart[Add product to cart]
    ManageCart[Update quantity or remove items]
    Checkout[Go to checkout]
    CartEmpty{Cart empty?}
    Address[Enter shipping address]
    AddressValid{Address valid?}
    CreatePayment[Create Razorpay order]
    Pay[Complete Razorpay payment]
    PaymentSuccess{Payment successful?}
    Verify[Verify payment signature]
    StockAvailable{Stock available?}
    CreateOrder[Create order and order items]
    UpdateStock[Reduce product stock]
    ClearCart[Clear cart]
    Dashboard[Show order in user dashboard]
    Invoice[View invoice]
    Fail[Show error message]
    End([End])

    Start --> Browse
    Browse --> Select
    Select --> LoggedIn
    LoggedIn -- No --> Login
    Login --> AddCart
    LoggedIn -- Yes --> AddCart
    AddCart --> ManageCart
    ManageCart --> Checkout
    Checkout --> CartEmpty
    CartEmpty -- Yes --> Fail --> Browse
    CartEmpty -- No --> Address
    Address --> AddressValid
    AddressValid -- No --> Fail
    AddressValid -- Yes --> CreatePayment
    CreatePayment --> Pay
    Pay --> PaymentSuccess
    PaymentSuccess -- No --> Fail
    PaymentSuccess -- Yes --> Verify
    Verify --> StockAvailable
    StockAvailable -- No --> Fail
    StockAvailable -- Yes --> CreateOrder
    CreateOrder --> UpdateStock
    UpdateStock --> ClearCart
    ClearCart --> Dashboard
    Dashboard --> Invoice
    Invoice --> End
```

## 3.5. Data Dictionary

### Users

Stores customer and admin account information. The first registered user becomes an admin, and all other users are created with the user role by default.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique user identifier. |
| Name | nvarchar(max) | Required | Full name of the user. |
| Email | nvarchar(450) | Required, Unique Index | User login email address. |
| PasswordHash | nvarchar(max) | Required | BCrypt hashed password. |
| Address | nvarchar(max) | Required | Saved shipping address, updated during checkout. |
| Role | nvarchar(max) | Required | User role: `Admin` or `User`. |

### Categories

Stores product category records used for filtering and organizing the catalog.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique category identifier. |
| Name | nvarchar(max) | Required | Category name, such as Mobile, Laptop, Audio, Gaming, or Accessories. |

### Products

Stores product catalog details displayed in the storefront and managed by admins.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique product identifier. |
| Name | nvarchar(max) | Required | Product name. |
| Price | decimal(18,2) | Required | Product selling price. |
| Description | nvarchar(max) | Required | Product description. |
| ImageUrl | nvarchar(max) | Required | Relative or external image URL. Uploaded images are stored under `/images/products`. |
| Stock | int | Required | Available inventory count. Reduced after successful order placement. |
| CategoryId | int | Foreign Key to Categories.Id | Category assigned to the product. Delete behavior is restricted at the database relationship level. |
| Rating | float | Required, Default 0 | Average product rating value. |
| NumReviews | int | Required, Default 0 | Number of reviews used for rating. |

### Carts

Stores one shopping cart per user when the user views or adds cart items.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique cart identifier. |
| UserId | int | Foreign Key to Users.Id | User who owns the cart. Cascade delete is configured from user to cart. |

### CartItems

Stores individual product lines inside a user's cart.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique cart item identifier. |
| CartId | int | Foreign Key to Carts.Id | Cart that contains this item. Cascade delete removes cart items when the cart is removed. |
| ProductId | int | Foreign Key to Products.Id | Product added to the cart. |
| Quantity | int | Required | Quantity selected by the user. API validation allows 1 to 100. |

### Orders

Stores customer order headers after checkout or successful Razorpay payment verification.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique order identifier. |
| UserId | int | Foreign Key to Users.Id | User who placed the order. Cascade delete is configured from user to order. |
| Total | decimal(18,2) | Required | Total order amount calculated from cart item quantities and product prices. |
| Status | nvarchar(max) | Required, Default `Pending` | Current order status: `Pending`, `Shipped`, `Delivered`, or `Cancelled`. |
| PaymentMethod | nvarchar(max) | Required | Payment method or Razorpay payment reference. |
| ShippingAddress | nvarchar(max) | Required | Delivery address used for the order. |
| CreatedAt | datetime2 | Required, Default current UTC time | Date and time when the order was created. |

### OrderItems

Stores product line items for each order. The price is copied at order time so the invoice can keep the original purchase price.

| Field | Type | Key / Constraint | Description |
| --- | --- | --- | --- |
| Id | int | Primary Key, Identity | Unique order item identifier. |
| OrderId | int | Foreign Key to Orders.Id | Order that contains this line item. Cascade delete removes order items when the order is removed. |
| ProductId | int | Foreign Key to Products.Id | Product purchased in the order. |
| Quantity | int | Required | Purchased quantity. |
| Price | decimal(18,2) | Required | Unit price captured at the time of order creation. |

### Relationship Summary

| Relationship | Cardinality | Description |
| --- | --- | --- |
| Users to Carts | 1 to 0..1 | A user can have one active cart created on demand. |
| Users to Orders | 1 to many | A user can place multiple orders. |
| Categories to Products | 1 to many | A category can contain multiple products. |
| Carts to CartItems | 1 to many | A cart can contain multiple product lines. |
| Products to CartItems | 1 to many | A product can appear in many cart items. |
| Orders to OrderItems | 1 to many | An order contains one or more order line items. |
| Products to OrderItems | 1 to many | A product can appear in many order line items. |
