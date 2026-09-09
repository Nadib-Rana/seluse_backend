# Seluse (Drapé) E-Commerce - Full Implementation Roadmap

> **Document Purpose**: Complete step-by-step roadmap for developing, integrating, testing, and deploying the **Seluse** E-Commerce Ecosystem (NestJS Backend + React Frontend).

---

## 🚩 Overview of Project Milestones

```
 [ Phase 1: DB & Environment Setup ] ──► [ Phase 2: Frontend API Integration ]
                                                      │
                                                      ▼
 [ Phase 5: Security & Deployment ]  ◄── [ Phase 4: Admin Dashboard ] ◄── [ Phase 3: Payment & SMS ]
```

---

## 📌 Phase 1: Local Environment & Database Verification (Current Step)

### Goals
Set up local PostgreSQL database, apply Prisma schema migrations, run seeds, and verify local NestJS API server.

- [x] Create domain schema in `prisma/schema.prisma`
- [x] Create initial seed script in `prisma/seed.ts`
- [ ] **Action Required**: Create PostgreSQL database (e.g. `drape_db`)
- [ ] Run Prisma migration:
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Seed database with initial catalog & admin users:
  ```bash
  npm run db:seed
  ```
- [ ] Start backend development server:
  ```bash
  npm run dev
  ```
- [ ] Verify API endpoints at `http://localhost:8443/docs` (Swagger UI)

---

## 🔌 Phase 2: Frontend & Backend Integration (Seluse Web Client)

### Goals
Connect the React/Vite frontend (`seluse`) to the live NestJS REST API (`seluse_backend`).

### 2.1 API Client & Auth Provider (`seluse/src/api`)
- [ ] Create API Service Axios/Fetch instance with `baseURL: "http://localhost:8443/api/v1"`.
- [ ] Add JWT interceptor to inject `Authorization: Bearer <accessToken>` and handle 401 token refresh automatically.
- [ ] Connect Registration Form (`POST /api/v1/auth/register`) with OTP Modal verification (`POST /api/v1/auth/verify-otp`).
- [ ] Connect Login Form (`POST /api/v1/auth/login`) and sync auth state into `AuthContext`.

### 2.2 Dynamic Catalog & Filtering (`seluse/src/pages/Shop.tsx`)
- [ ] Replace mock products data in `Shop.tsx` with dynamic API call (`GET /api/v1/products`).
- [ ] Pass URL search parameters (`category`, `subcategory`, `priceMin`, `priceMax`, `colors`, `sizes`, `sort`, `q`, `page`) directly to backend API.
- [ ] Connect dynamic Category sidebar from `GET /api/v1/categories`.

### 2.3 Product Details & Variant Selector (`seluse/src/pages/ProductDetail.tsx`)
- [ ] Fetch single product by slug or ID (`GET /api/v1/products/:idOrSlug`).
- [ ] Dynamically update available sizes/colors and live stock count based on selected `ProductVariant`.

### 2.4 Cart, Coupon & Checkout Flow (`seluse/src/pages/Checkout.tsx`)
- [ ] Implement coupon code validation box (`POST /api/v1/coupons/validate`).
- [ ] Submit final guest or member order payload (`POST /api/v1/orders`).
- [ ] Display order confirmation modal with Order Number (e.g., `DRP-84920`) and estimated delivery date.

### 2.5 Order Tracking Page (`seluse/src/pages/TrackOrder.tsx`)
- [ ] Connect search input to `GET /api/v1/orders/track/:orderNumberOrPhone`.
- [ ] Display real-time timeline status (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED`).

---

## 💳 Phase 3: Payments, SMS Gateway & Notifications

### Goals
Integrate Bangladeshi payment gateways and automated SMS/email alerts.

### 3.1 Payment Gateway Integration
- [ ] Integrate **SSLCommerz** / **bKash** / **Nagad** checkout redirect or sandbox API.
- [ ] Create payment IPN/Webhook handler endpoint (`POST /api/v1/payments/webhook`) to automatically mark order `paymentStatus` as `PAID`.

### 3.2 SMS Gateway & Email Alerts
- [ ] Integrate SMS Gateway (e.g. MIM SMS / Twilio / Greenweb) for customer phone OTPs and order status updates.
- [ ] Configure Nodemailer / Handlebars email templates for instant invoice PDF/Email delivery.

---

## 🛠️ Phase 4: Administrative Dashboard Panel

### Goals
Provide store managers and support staff with full operational control.

### 4.1 Order Processing & Fulfillment UI
- [ ] Admin order list with status tabs (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- [ ] Modal to transition order status (`PATCH /api/v1/admin/orders/:id/status`) and attach courier tracking number (e.g., Steadfast / Pathao).

### 4.2 Catalog & Inventory Control UI
- [ ] Add/Edit Product Modal (upload product images, set prices, define size/color stock matrix).
- [ ] Manual stock adjustment interface (`POST /api/v1/admin/inventory/adjust`) with audit log history.

### 4.3 Marketing & Reporting Dashboard
- [ ] Coupon creation interface (`POST /api/v1/admin/coupons`).
- [ ] Promotional Campaign banner manager (`POST /api/v1/admin/campaigns`).
- [ ] Executive sales metrics dashboard (`GET /api/v1/admin/reports/summary`).

---

## 🚀 Phase 5: Security, Performance & Production Deployment

### Goals
Harden backend security, optimize response times, and deploy to production cloud servers.

### 5.1 Optimization & Caching
- [ ] Enable Redis caching for public product catalog queries.
- [ ] Setup BullMQ task queue for asynchronous SMS & Email dispatches.

### 5.2 Security Hardening
- [ ] Strict CORS origin configuration for domain `https://seluse.com`.
- [ ] Rate limiting enforcement per IP on authentication & public checkout endpoints.

### 5.3 Production Deployment & CI/CD
- [ ] Dockerize backend with multi-stage `Dockerfile` and `docker-compose.prod.yml`.
- [ ] Configure Nginx reverse proxy with SSL certificate (Let's Encrypt / Certbot).
- [ ] Setup GitHub Actions workflow for automated build, test, and deployment on server push.

---

## 📋 Quick Action Checklist (Next Immediate Tasks)

1. **Step 1**: Start PostgreSQL database locally or run via Docker Compose (`docker compose up -d`).
2. **Step 2**: Run `npx prisma migrate dev --name init` in `seluse_backend`.
3. **Step 3**: Run `npm run db:seed` to populate sample data.
4. **Step 4**: Start backend server with `npm run dev` and open Swagger docs at `http://localhost:8443/docs`.
5. **Step 5**: Begin Phase 2 (Frontend API integration in `seluse`).
