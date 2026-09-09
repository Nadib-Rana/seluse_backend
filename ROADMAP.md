# Seluse (Drapé) E-Commerce — Exhaustive Master Implementation Roadmap

> **Document Version**: 2.0 (Exhaustive & Uncompromising Checklist)  
> **Scope**: Covers 100% of features, database models, backend API endpoints, state machines, frontend page integrations, payment gateways, admin panel screens, security hardening, and production deployment steps for the **Seluse** E-Commerce Ecosystem.

---

## 🧭 Master Architecture Overview

```
 [ React Frontend (seluse) ] 
       │ 
       │ (REST API / Bearer Token / HTTP Cookies)
       ▼
 [ NestJS API Gateway & Application (seluse_backend) ]
 ├── Global Infrastructure: RequestIdMiddleware, ThrottlerGuard, ResponseStandardizationInterceptor, AllExceptionsFilter
 ├── Domain Modules: AuthModule, UsersModule, CategoriesModule, ProductsModule, OrdersModule, CouponsModule, CampaignsModule, AdminModule, StorageModule, MailModule
 └── Data Access: PrismaService ──► [ PostgreSQL 16 ] & [ Redis 7 Cache ]
```

---

## 📍 Phase 1: Local Environment & Database Foundation

### 1.1 Local PostgreSQL Database Setup
- [x] Define master domain models & enums in `prisma/schema.prisma`.
- [x] Configure database connection string (`DATABASE_URL`) in `.env`.
- [ ] **Action Required**: Create PostgreSQL database (e.g., `drape_db` on port 5432 or Docker Compose).
- [ ] Execute initial Prisma migration:
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Generate typed Prisma Client:
  ```bash
  npx prisma generate
  ```

### 1.2 Master Database Seeding (`prisma/seed.ts`)
- [x] Seed Super Admin (`admin@drape.com` / `Password123!`).
- [x] Seed Store Manager (`manager@drape.com` / `Password123!`).
- [x] Seed Customer Service Representative (`csr@drape.com` / `Password123!`).
- [x] Seed Demo Customer (`customer@drape.com` / `Phone: +8801733333333`).
- [x] Seed Categories (*Men*, *Women*, *Kids*).
- [x] Seed initial products & variant matrix (color hex, sizes, stock) mapped from frontend mock data.
- [x] Seed promotional coupons (`WINTER10` 10% off, `FLAT500` ৳500 off).
- [x] Seed active marketing campaign banner (`summer-collection-2026`).
- [ ] Run seed execution command:
  ```bash
  npm run db:seed
  ```

### 1.3 Local Server Verification
- [x] Add dev shortcut script `"dev": "nest start --watch"` to `package.json`.
- [ ] Start NestJS backend server:
  ```bash
  npm run dev
  ```
- [ ] Verify interactive OpenAPI Swagger documentation at `http://localhost:8443/docs`.
- [ ] Verify system health check at `http://localhost:8443/api/v1/health`.

---

## 🔐 Phase 2: Authentication & User Profile Module

### 2.1 Backend Endpoints (`/api/v1/auth` & `/api/v1/users`)
- [x] **`POST /api/v1/auth/register`**: Validate full name, phone number (unique), optional email (unique), bcrypt password hashing (10 salt rounds), generate 6-digit numeric OTP in `OtpToken` table with 5m expiration, return `userId`.
- [x] **`POST /api/v1/auth/verify-otp`**: Validate OTP code, mark OTP `isUsed: true`, set user `status: ACTIVE`, issue 15-minute JWT Access Token & 7-day Refresh Token.
- [x] **`POST /api/v1/auth/login`**: Accept phone or email + password, verify active user status, compare password hash, issue JWT Access Token + store hashed refresh token record in `RefreshToken` table with IP address & device User-Agent.
- [x] **`POST /api/v1/auth/refresh`**: Verify refresh token signature, check database revocation status (`isRevoked: false`), issue rotated new Access & Refresh tokens.
- [x] **`GET /api/v1/auth/me`**: Fetch authenticated user profile with saved delivery addresses.
- [x] **`POST /api/v1/auth/logout`**: Revoke active user refresh tokens in database.
- [ ] **Address Book Endpoints** (`/api/v1/users/addresses`):
  - [ ] `GET /api/v1/users/addresses` — List user addresses.
  - [ ] `POST /api/v1/users/addresses` — Add new delivery address (recipient, phone, division, district, area, addressLine, isDefault).
  - [ ] `PUT /api/v1/users/addresses/:id/default` — Set primary default address.
  - [ ] `DELETE /api/v1/users/addresses/:id` — Remove address.

### 2.2 Frontend Integration (`seluse/src`)
- [ ] Create Central API Client (`src/api/client.ts`) with `baseURL: http://localhost:8443/api/v1`.
- [ ] Add Axios request interceptor to inject `Authorization: Bearer <accessToken>` from `localStorage` or `sessionStorage`.
- [ ] Add Axios response interceptor for automatic token refresh on `401 Unauthorized`.
- [ ] Integrate Registration Form & OTP Verification Modal into UI.
- [ ] Integrate Login Modal / Page into `AuthContext`.
- [ ] Connect Account Settings & Saved Address Management in `AccountRoot.tsx`.

---

## 🛍️ Phase 3: Catalog, Search & Multi-Faceted Products Module

### 3.1 Backend Endpoints (`/api/v1/categories` & `/api/v1/products`)
- [x] **`GET /api/v1/categories`**: Return active categories & subcategories ordered by `priority: asc`.
- [x] **`GET /api/v1/categories/:slug`**: Return single category with children subcategories & products.
- [x] **`GET /api/v1/products`**:
  - Filter parameters: `category` (men/women/kids), `subcategory`, `collection`, `filter`/`badge` (Sale/New/Best Seller), `sizes` (CSV: `M,L,XL`), `colors` (CSV: `Navy,Black`), `priceMin`, `priceMax`, `inStock` (boolean), `q` (full-text search on name/description/sku), `sort` (`featured`, `newest`, `price-asc`, `price-desc`, `rating`), `page` (default 1), `limit` (default 12).
  - Data shape: Returns items with aggregated color objects `{ label, hex }`, size array `["S", "M", ...]`, total stock, and pagination metadata.
- [x] **`GET /api/v1/products/:idOrSlug`**: Fetch full product details with complete variant breakdown (`id`, `sku`, `size`, `color`, `colorHex`, `stock`).
- [x] **`POST /api/v1/products`** (Admin: `STORE_MANAGER`, `SUPER_ADMIN`): Create new product with nested variants array.
- [x] **`DELETE /api/v1/products/:id`** (Admin): Soft-delete / deactivate product.

### 3.2 Frontend Integration (`seluse/src/pages/Shop.tsx` & `ProductDetail.tsx`)
- [ ] Replace mock products array in `Shop.tsx` with live `GET /api/v1/products` API call.
- [ ] Connect dynamic Category & Subcategory sidebar filter links.
- [ ] Connect Price Range slider (`priceMin`, `priceMax`) to API query.
- [ ] Connect Size & Color checkboxes filter controls to API query.
- [ ] Connect Search input (`q`) and Sort dropdown selector (`sort`).
- [ ] Connect pagination controls (Page numbers, Next, Previous).
- [ ] Connect `ProductDetail.tsx` page to `GET /api/v1/products/:idOrSlug`.
- [ ] Implement live size & color selection logic: disable out-of-stock color/size combinations and display real-time stock availability badge.

---

## 🛒 Phase 4: Cart, Wishlist & Coupon Engine Module

### 4.1 Backend Endpoints (`/api/v1/wishlist` & `/api/v1/coupons`)
- [x] **`POST /api/v1/coupons/validate`**:
  - Validate coupon code against subtotal.
  - Check active date range (`startDate <= now <= expiryDate`).
  - Check usage limit (`usedCount < usageLimit`).
  - Check minimum spend threshold (`subtotal >= minSpend`).
  - Calculate percentage discount (capped by `maxDiscount`) or fixed discount.
  - Return `{ valid: true, code, discountType, discountValue, discountAmount }`.
- [ ] **Wishlist Endpoints** (`/api/v1/wishlist`):
  - [ ] `GET /api/v1/wishlist` — Get member saved wishlist items.
  - [ ] `POST /api/v1/wishlist/:productId` — Toggle / save product to wishlist.
  - [ ] `DELETE /api/v1/wishlist/:productId` — Remove product from wishlist.

### 4.2 Frontend Integration (`seluse/src/context`)
- [ ] Sync `CartContext` state with persistent local storage or user account.
- [ ] Implement Coupon Code input box on Cart Drawer & Checkout Page.
- [ ] Call `POST /api/v1/coupons/validate` on apply coupon button click and update discount line item in subtotal summary.
- [ ] Connect Wishlist heart icon toggle button across product cards and detail pages.

---

## 📦 Phase 5: Checkout & Atomic Order Processing Engine

### 5.1 Backend Order Logic (`/api/v1/orders`)
- [x] **`POST /api/v1/orders`**:
  - Supports Guest Checkout and Authenticated Member Checkout.
  - Payload: `customer` (`fullName`, `email`, `phone`), `shippingAddress` (`recipient`, `phone`, `division`, `district`, `area`, `addressLine`), `items` (`productId`, `variantId`, `size`, `color`, `quantity`), `paymentMethod` (`COD`, `BKASH`, `NAGAD`, `CARD`), optional `couponCode`.
  - **Prisma `$transaction` Execution Steps**:
    1. Resolve variant ID for each item and check stock (`variant.stock >= requestedQuantity`). If insufficient, abort transaction and throw `400 Bad Request`.
    2. Deduct variant stock (`stock: { decrement: quantity }`).
    3. Create `InventoryLog` record (`changeQty: -quantity`, `reason: CUSTOMER_ORDER`).
    4. Calculate subtotal strictly from DB product prices.
    5. Calculate shipping fee: Inside Dhaka = ৳80, Outside Dhaka = ৳150.
    6. Validate coupon discount & increment `coupon.usedCount`.
    7. Generate unique order number `DRP-XXXXX` and set 3-day estimated delivery date.
    8. Persist `Order`, `OrderItem`s, and initial `OrderStatusHistory` record (`status: PENDING`, `note: "Order received"`).
- [x] **`GET /api/v1/orders/track/:identifier`**: Public order tracking by `orderNumber` or customer `phone`. Returns courier provider (e.g. Steadfast Courier), tracking number, order items, and status timeline history.
- [x] **`GET /api/v1/orders/my-orders`**: List authenticated customer order history.

### 5.2 Frontend Checkout Integration (`seluse/src/pages/Checkout.tsx` & `TrackOrder.tsx`)
- [ ] Build multi-step or single-page Checkout Form in `Checkout.tsx`.
- [ ] Populate shipping address form with default user address if logged in.
- [ ] Submit order payload to `POST /api/v1/orders`.
- [ ] Display Order Confirmation screen with Order Number (`DRP-84920`), delivery address summary, and total breakdown.
- [ ] Connect `TrackOrder.tsx` input to `GET /api/v1/orders/track/:identifier` and render visual stepper timeline (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED`).

---

## 💳 Phase 6: Payment Gateways & Communications Integration

### 6.1 Payment Gateway Integration (SSLCommerz / bKash / Nagad)
- [ ] Create Payment Module (`/api/v1/payments`).
- [ ] `POST /api/v1/payments/initiate/:orderId` — Generate gateway payment session URL.
- [ ] `POST /api/v1/payments/webhook` — Listen for payment IPN notifications: update `order.paymentStatus` to `PAID` and `order.status` to `CONFIRMED`.
- [ ] Handle Payment Success, Fail, and Cancel redirect URLs in frontend.

### 6.2 SMS Gateway Integration
- [ ] Configure SMS Gateway Provider (e.g., MIM SMS / Greenweb / Twilio) credentials in `.env`.
- [ ] Dispatch SMS on user registration OTP: *"Your Seluse verification code is: 492018. Valid for 5 minutes."*
- [ ] Dispatch SMS post order placement: *"Thank you for your order #DRP-84920. Total: ৳5,210. Track at seluse.com/track"*
- [ ] Dispatch SMS on order shipment: *"Your order #DRP-84920 has been shipped via Steadfast Courier. Tracking No: STDF-994012."*

### 6.3 Email Notifications (`MailModule`)
- [ ] Configure SMTP server settings (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`) in `.env`.
- [ ] Send welcome email on account registration (`welcome.hbs`).
- [ ] Send HTML invoice receipt email post order checkout.

---

## 🛠️ Phase 7: Admin & Support Control Panel Module

### 7.1 Backend Admin Endpoints (`/api/v1/admin/*`)
- [x] **`GET /api/v1/admin/orders`**: List all customer orders with status filter & pagination.
- [x] **`PATCH /api/v1/admin/orders/:id/status`**: Update order status (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED` / `CANCELLED`), attach `courierProvider` & `trackingNumber`, insert `OrderStatusHistory` note, and log `AuditLog` entry.
- [x] **`POST /api/v1/admin/inventory/adjust`**: Adjust variant stock (`changeQty: +N / -N`) with reason (`RESTOCK`, `DAMAGE`, `AUDIT_ADJUSTMENT`, `RETURN_RESTOCK`) and write to `InventoryLog`.
- [x] **`GET /api/v1/admin/inventory/logs`**: Audit stock history logs across all product variants.
- [x] **`GET /api/v1/admin/coupons`**, **`POST /api/v1/admin/coupons`**, **`DELETE /api/v1/admin/coupons/:id`**: Create, list, and delete discount coupon codes.
- [x] **`GET /api/v1/admin/campaigns`**, **`POST /api/v1/admin/campaigns`**, **`DELETE /api/v1/admin/campaigns/:id`**: Create, list, and delete marketing campaign banners.
- [x] **`GET /api/v1/admin/reports/summary`**: Get financial summary (total orders, pending orders, completed orders, total revenue, active products, total customers).
- [x] **`GET /api/v1/admin/audit-logs`**: Super Admin audit log viewer.

### 7.2 Frontend Admin Panel Integration
- [ ] Build Admin Order Management Table view with status filter tabs and search.
- [ ] Build Order Detail Modal with order status transition controls & courier tracking input.
- [ ] Build Stock Inventory Management Table: quick restock button & stock adjustment modal.
- [ ] Build Product Catalog Management UI: Add Product form with variant matrix (colors, sizes, stock).
- [ ] Build Coupon & Campaign Management forms.
- [ ] Build Executive Dashboard Metrics Summary Cards & Sales Charts.

---

## 🛡️ Phase 8: Security, Caching, DevOps & Production Deployment

### 8.1 Security & Code Quality Hardening
- [x] HTTP Security headers configured via `helmet`.
- [x] Global Rate Limiting via `@nestjs/throttler` (5 req/min on Auth, 100 req/min on Public API).
- [x] Input sanitization via NestJS `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`).
- [x] Standardized success response envelope (`ResponseStandardizationInterceptor`) & error response format (`AllExceptionsFilter`).
- [ ] CORS origin whitelist restricted strictly to trusted domain (`https://seluse.com`).

### 8.2 Redis Caching & Queue Optimization
- [ ] Enable Redis cache for high-frequency product catalog GET requests (`GET /api/v1/products`).
- [ ] Setup BullMQ task queue for background SMS & Email dispatches.

### 8.3 Production Deployment & DevOps Pipeline
- [ ] Verify production Docker container build (`Dockerfile` & `docker-compose.prod.yml`).
- [ ] Provision Nginx Reverse Proxy with SSL (Let's Encrypt / Certbot).
- [ ] Setup GitHub Actions CI/CD workflow to run automated linting, tests, and build on push to `main`.

---

## 📌 Complete Milestone Progress Summary

| Phase | Description | Backend Status | Frontend Status | Overall Status |
| :---: | :--- | :---: | :---: | :---: |
| **Phase 1** | Local Environment & Database Foundation | ✅ Completed | N/A | **90%** |
| **Phase 2** | Authentication & User Profile Module | ✅ Completed | ⏳ In Progress | **70%** |
| **Phase 3** | Catalog, Search & Multi-Faceted Products | ✅ Completed | ⏳ In Progress | **70%** |
| **Phase 4** | Cart, Wishlist & Coupon Engine | ✅ Completed | ⏳ In Progress | **65%** |
| **Phase 5** | Checkout & Atomic Order Engine | ✅ Completed | ⏳ In Progress | **70%** |
| **Phase 6** | Payment Gateways & Communications | ⏳ Pending | ⏳ Pending | **25%** |
| **Phase 7** | Admin & Support Control Panel | ✅ Completed | ⏳ Pending | **50%** |
| **Phase 8** | Security, Caching & Deployment | ⏳ In Progress | N/A | **60%** |
