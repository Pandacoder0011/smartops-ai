# SmartOps AI - Backend REST API Specification

This document provides a detailed API specification for all the backend REST API endpoints available in the SmartOps AI Enterprise Platform.

## Table of Contents
1. [Base URL & Protocol](#base-url--protocol)
2. [Authentication & Security](#authentication--security)
3. [Global Rate Limiting](#global-rate-limiting)
4. [Endpoint Reference](#endpoint-reference)
   - [Health Check & System Status](#health-check--system-status)
   - [Authentication & Identity Management](#authentication--identity-management)
   - [Dashboard & Telemetry Metrics](#dashboard--telemetry-metrics)
   - [Analytics & Enterprise Insights](#analytics--enterprise-insights)
   - [AI Assistant & Co-Pilot](#ai-assistant--co-pilot)
   - [CRUD Operations (MERN/Fallback Stack)](#crud-operations-mernfallback-stack)
      - [Products Management](#products-management)
      - [Customers Management](#customers-management)
      - [Sales & Ledger Management](#sales--ledger-management)
      - [Employees & Operations Management](#employees--operations-management)

---

## Base URL & Protocol

All requests are served over HTTP/HTTPS.

* **Development Base URL**: `http://localhost:5005` (or fallback to `5000` depending on configuration)
* **API Prefix**: `/api`

Example full URL: `http://localhost:5005/api/auth/login`

---

## Authentication & Security

SmartOps AI uses **JSON Web Tokens (JWT)** for access authorization.

1. Authenticate via POST `/api/auth/login` or POST `/api/auth/register`.
2. The server responds with a JWT payload under the `token` key.
3. Supply this token in the headers of all protected endpoints:

```http
Authorization: Bearer <your_jwt_token>
```

Endpoints marked with 🔐 **Protected** require a valid JWT header. If missing or invalid, the API returns a `401 Unauthorized` response.

---

## Global Rate Limiting

To prevent API abuse, the following rate limit rules are enforced:
* **All API Routes (`/api/*`)**: Maximum of `10,000` requests per 15 minutes window per IP.
* **Authentication Route (`/api/auth/login`)**: Max `1,000` attempts per 15 minutes per IP.

Exceeding the limits will return a `429 Too Many Requests` status code.

---

## Endpoint Reference

### Health Check & System Status

#### GET `/api/health`
Verify the status and uptime of the backend server.
* **Authentication**: None
* **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-06-10T02:30:00.000Z"
  }
  ```

---

### Authentication & Identity Management

All requests in this section are prefixed with `/api/auth`.

#### POST `/api/auth/register`
Create a new user account.
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "role": "admin"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### POST `/api/auth/login`
Authenticate existing credentials and retrieve JWT.
* **Authentication**: None (Subject to login rate limiting)
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### GET `/api/auth/me`
🔐 **Protected** | Retrieve the current logged-in user profile.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin"
  }
  ```

#### POST `/api/auth/logout`
🔐 **Protected** | Terminate user session.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### PUT `/api/auth/profile`
🔐 **Protected** | Update current user details.
* **Request Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "janesmith@example.com"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Smith",
    "email": "janesmith@example.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### PUT `/api/auth/change-password`
🔐 **Protected** | Change the current user password.
* **Request Body**:
  ```json
  {
    "currentPassword": "securepassword123",
    "newPassword": "newsecurepassword456"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```

---

### Dashboard & Telemetry Metrics

All requests in this section are prefixed with `/api/dashboard`.

#### GET `/api/dashboard/metrics`
Retrieve realtime dashboard KPI metrics (e.g. Revenue, Total Sales, Low Stock, Employee Activity).
* **Authentication**: None
* **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109aa",
      "name": "Total Revenue",
      "value": 148500,
      "previousValue": 146200,
      "unit": "USD",
      "icon": "DollarSign",
      "trend": [140000, 142000, 145000, 148500]
    }
  ]
  ```

#### POST `/api/dashboard/metrics`
Update a specific dashboard KPI metric value.
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "name": "Total Revenue",
    "value": 152000
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "metric": {
      "_id": "60d0fe4f5311236168a109aa",
      "name": "Total Revenue",
      "value": 152000,
      "previousValue": 148500
    }
  }
  ```

#### POST `/api/dashboard/upload`
Upload a bulk CSV dataset to import or update telemetry records.
* **Authentication**: None
* **Request Payload**: Multipart FormData containing key `file` (must be a valid CSV file).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "CSV uploaded and processed successfully",
    "recordsProcessed": 45
  }
  ```

---

### Analytics & Enterprise Insights

All requests in this section are prefixed with `/api/analytics`.

#### GET `/api/analytics/overview`
🔐 **Protected** | Retrieve high-level summary KPIs for charts.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "revenue": 148500,
      "salesCount": 128,
      "profit": 68400,
      "activeCustomers": 222
    }
  }
  ```

#### GET `/api/analytics/sales-trend`
🔐 **Protected** | Get chronological sales trend metrics.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "date": "2026-06-01", "sales": 12000, "profit": 5500 },
      { "date": "2026-06-02", "sales": 15000, "profit": 7200 }
    ]
  }
  ```

#### GET `/api/analytics/top-products`
🔐 **Protected** | Retrieve highest-performing products based on sales volume and margin.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "productId": "60d0fe4f5311236168a109a1", "name": "Secure Gateway Module", "revenue": 48000, "unitsSold": 96 }
    ]
  }
  ```

#### GET `/api/analytics/customer-segments`
🔐 **Protected** | Get user breakdown across Loyalty segments.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "segment": "VIP", "count": 42, "revenue": 85000 },
      { "segment": "Regular", "count": 180, "revenue": 52000 }
    ]
  }
  ```

#### GET `/api/analytics/inventory-status`
🔐 **Protected** | Query stock allocations and critical thresholds.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalStockValue": 320000,
      "lowStockItemsCount": 4,
      "outOfStockItemsCount": 1
    }
  }
  ```

#### GET `/api/analytics/revenue-by-region`
🔐 **Protected** | Query geographic performance distribution.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "region": "North America", "revenue": 64000 },
      { "region": "Europe", "revenue": 45000 }
    ]
  }
  ```

#### GET `/api/analytics/employee-performance`
🔐 **Protected** | Get productivity statistics.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "employeeId": "EMP-902", "name": "Clark Kent", "salesClosed": 35, "rating": 4.9 }
    ]
  }
  ```

#### GET `/api/analytics/financial-summary`
🔐 **Protected** | Get profit and loss data points.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalRevenue": 148500,
      "totalCostOfGoods": 80100,
      "netProfit": 68400,
      "profitMarginPercentage": 46.06
    }
  }
  ```

---

### AI Assistant & Co-Pilot

All requests in this section are prefixed with `/api/ai`.

#### POST `/api/ai/chat`
🔐 **Protected** | Stream chat prompt query answers. Supports tools calling to database collections.
* **Request Body**:
  ```json
  {
    "message": "What is our current monthly profit?",
    "history": [
      { "role": "user", "content": "Hello Co-Pilot" },
      { "role": "model", "content": "Hello! How can I assist you today?" }
    ]
  }
  ```
* **Success Response (200 OK - Stream or JSON)**:
  * Note: Server handles text-streaming chunk returns dynamically. Returns final text payload if full JSON is resolved.
  ```json
  {
    "success": true,
    "response": "The current monthly profit is $68,400 across all regions."
  }
  ```

#### GET `/api/ai/insights`
🔐 **Protected** | Get auto-generated AI recommendations based on current DB metrics.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "insights": [
      "Detected low stock for Analytics Sensor Node (SKU: ASN-202). Order restock.",
      "Sales in Latin America are 15% below threshold. Run a promo campaign."
    ]
  }
  ```

#### GET `/api/ai/predict`
🔐 **Protected** | Run predictive analytics models for future revenue trends.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "prediction": {
      "metric": "Revenue",
      "forecast": [152000, 155000, 159000],
      "confidence": "87%"
    }
  }
  ```

#### GET `/api/ai/history`
🔐 **Protected** | Fetch chat log histories.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "history": [
      { "role": "user", "content": "What is our current monthly profit?", "timestamp": "2026-06-10T02:20:00.000Z" }
    ]
  }
  ```

---

### CRUD Operations (MERN/Fallback Stack)

All CRUD endpoints are prefixed with `/api`. They support automatic fallback database routes.

#### Products Management

##### GET `/api/products`
🔐 **Protected** | List all inventory products.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109a1",
      "name": "Secure Gateway Module",
      "sku": "SGM-500",
      "category": "Networking",
      "price": 500,
      "cost": 250,
      "stock": 12,
      "minStock": 5,
      "supplier": "Cisco Systems",
      "status": "active"
    }
  ]
  ```

##### POST `/api/products`
🔐 **Protected** | Create a new product record.
* **Request Body**:
  ```json
  {
    "name": "Router X-200",
    "sku": "RTX-200",
    "category": "Networking",
    "price": 300,
    "cost": 150,
    "stock": 20,
    "minStock": 5,
    "supplier": "Netgear",
    "status": "active"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "_id": "60d0fe4f5311236168a109cf",
    "name": "Router X-200",
    "sku": "RTX-200",
    "category": "Networking",
    "price": 300,
    "cost": 150,
    "stock": 20,
    "minStock": 5,
    "supplier": "Netgear",
    "status": "active"
  }
  ```

##### PUT `/api/products/:id`
🔐 **Protected** | Update a product by ID.
* **Success Response (200 OK)**:
  ```json
  {
    "_id": "60d0fe4f5311236168a109cf",
    "name": "Router X-200",
    "sku": "RTX-200",
    "price": 350
  }
  ```

##### DELETE `/api/products/:id`
🔐 **Protected** | Remove a product by ID.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Product deleted successfully"
  }
  ```

##### POST `/api/products/bulk-delete`
🔐 **Protected** | Delete multiple products in bulk.
* **Request Body**:
  ```json
  {
    "ids": ["60d0fe4f5311236168a109cf", "60d0fe4f5311236168a109d0"]
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Products deleted successfully"
  }
  ```

##### POST `/api/products/bulk-status`
🔐 **Protected** | Update status of multiple products.
* **Request Body**:
  ```json
  {
    "ids": ["60d0fe4f5311236168a109cf"],
    "status": "archived"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Status updated successfully"
  }
  ```

---

#### Customers Management

##### GET `/api/customers`
🔐 **Protected** | List customer accounts.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109b1",
      "name": "Bruce Wayne",
      "email": "bruce@wayne.corp",
      "phone": "+1-555-0199",
      "address": "Gotham City",
      "totalPurchases": 12000,
      "loyaltyPoints": 600,
      "segment": "VIP"
    }
  ]
  ```

##### POST `/api/customers`
🔐 **Protected** | Create customer record.
* **Request Body**:
  ```json
  {
    "name": "Clark Kent",
    "email": "clark@dailyplanet.com",
    "phone": "+1-555-0144",
    "address": "Metropolis",
    "segment": "Regular"
  }
  ```
* **Success Response (210 Created)**:
  ```json
  {
    "_id": "60d0fe4f5311236168a109df",
    "name": "Clark Kent",
    "email": "clark@dailyplanet.com",
    "segment": "Regular"
  }
  ```

##### PUT `/api/customers/:id`
🔐 **Protected** | Edit customer profile.

##### DELETE `/api/customers/:id`
🔐 **Protected** | Remove customer record.

##### POST `/api/customers/bulk-delete`
🔐 **Protected** | Delete multiple customers.

---

#### Sales & Ledger Management

##### GET `/api/sales`
🔐 **Protected** | List sales transactions.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109c1",
      "products": [
        { "product": "60d0fe4f5311236168a109a1", "quantity": 2, "priceAtSale": 500 }
      ],
      "totalAmount": 1000,
      "paymentMethod": "Wire Transfer",
      "status": "completed",
      "region": "North America",
      "profit": 500
    }
  ]
  ```

##### POST `/api/sales`
🔐 **Protected** | Post new sales record.
* **Request Body**:
  ```json
  {
    "products": [
      { "product": "60d0fe4f5311236168a109a1", "quantity": 1 }
    ],
    "customer": "60d0fe4f5311236168a109b1",
    "paymentMethod": "Credit Card",
    "region": "North America",
    "status": "completed"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "_id": "60d0fe4f5311236168a109f1",
    "totalAmount": 500,
    "profit": 250,
    "status": "completed"
  }
  ```

##### PUT `/api/sales/:id`
🔐 **Protected** | Modify transaction.

##### DELETE `/api/sales/:id`
🔐 **Protected** | Void sales transaction.

---

#### Employees & Operations Management

##### GET `/api/employees`
🔐 **Protected** | Get staff and operational users.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109d1",
      "userId": "60d0fe4f5311236168a109ca",
      "name": "Clark Kent",
      "department": "Reporting",
      "position": "Senior Journalist",
      "salary": 75000,
      "performance": 4.9,
      "attendance": 98
    }
  ]
  ```

##### POST `/api/employees`
🔐 **Protected** | Add new employee.
* **Request Body**:
  ```json
  {
    "name": "Barry Allen",
    "department": "Logistics",
    "position": "Courier",
    "salary": 45000,
    "performance": 5.0,
    "attendance": 100
  }
  ```

##### PUT `/api/employees/:id`
🔐 **Protected** | Edit staff record.

##### DELETE `/api/employees/:id`
🔐 **Protected** | Remove staff member.

##### POST `/api/employees/bulk-delete`
🔐 **Protected** | Bulk remove staff members.
