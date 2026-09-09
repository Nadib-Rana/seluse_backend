# Seluse Backend Architecture & Agent Handover Guide

> **Target Audience**: AI Agents (Gemini/Antigravity, Claude, ChatGPT, etc.) & Software Engineers  
> **Repository**: `seluse_backend`  
> **Framework**: NestJS (v11) + Prisma ORM (v7) + PostgreSQL + TypeScript  

---

## 1. Executive Overview & System Topology

This repository powers the backend API for **Seluse (Drapé)**, an e-commerce platform for apparel and merchandise. 

```
 [ React Frontend (seluse) ]
              │
              │ (HTTPS / REST API - /api/v1)
              ▼
  [ NestJS Application (seluse_backend) ]
  ├── Presentation Layer: Controllers, JwtAuthGuard, RolesGuard, ValidationPipe
  ├── Core Layer: ResponseStandardizationInterceptor, AllExceptionsFilter
  ├── Logic Layer: AuthService, ProductsService, OrdersService, AdminService
  └── Persistence Layer: PrismaService (ORM Client)
              │
              ▼
      [ PostgreSQL 16 ]
```

- **Base API URL**: `http://localhost:8443/api/v1`
- **Interactive Swagger OpenAPI Docs**: `http://localhost:8443/docs`
- **Default Port**: `8443` (configurable via `PORT` in `.env`)

---

## 2. Repository File Structure & Module Map

```
seluse_backend/
├── prisma/
│   ├── schema.prisma       # Master database schema definition
│   └── seed.ts             # Automated database seeder (Admins, Products, Coupons)
├── src/
│   ├── app.module.ts       # Root module registering all feature modules & global pipes/filters
│   ├── main.ts             # Application entry point, Swagger config, ValidationPipe
│   ├── common/             # Cross-cutting concerns
│   │   ├── decorators/     # @Public(), @Roles(), @CurrentUser(), @ResponseMessage()
│   │   ├── dto/            # Standard ApiResponseDto & PaginatedResponseDto
│   │   ├── filters/        # AllExceptionsFilter & PrismaClientExceptionFilter
│   │   ├── guards/         # JwtAuthGuard, RolesGuard (RBAC)
│   │   └── interceptors/   # ResponseStandardizationInterceptor
│   └── modules/            # Domain feature modules
│       ├── admin/          # Order status updates, stock adjustments, audit logs & reports
│       ├── auth/           # Registration, OTP verification, JWT login & refresh token
│       ├── campaigns/      # Promotional campaigns API
│       ├── categories/     # Public catalog categories & subcategory hierarchy
│       ├── coupons/        # Coupon validation engine & admin management
│       ├── orders/         # Checkout, atomic stock reservation & order tracking
│       ├── products/       # Product catalog with search, multi-faceted filtering & variants
│       ├── storage/        # Object storage integration (MinIO / S3)
│       └── users/          # Profile management & user RBAC administration
└── ARCHITECTURE_HANDOVER.md # This tracking & handover guide
```

---

## 3. Database Schema Overview & Enums

Defined in [`prisma/schema.prisma`](file:///home/nadib-rana/Desktop/project/Gisan/seluse_backend/prisma/schema.prisma):

### Enums
- **`Role`**: `SUPER_ADMIN`, `STORE_MANAGER`, `CUSTOMER_SERVICE`, `CUSTOMER`
- **`UserStatus`**: `PENDING_VERIFICATION`, `ACTIVE`, `BLOCKED`, `SUSPENDED`
- **`OrderStatus`**: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`
- **`PaymentStatus`**: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
- **`PaymentMethod`**: `COD`, `BKASH`, `NAGAD`, `ROCKET`, `CARD`
- **`StockAdjustmentReason`**: `RESTOCK`, `DAMAGE`, `AUDIT_ADJUSTMENT`, `CUSTOMER_ORDER`, `RETURN_RESTOCK`

### Models & Key Fields
- **`User`**: `id` (UUID), `phone` (unique), `email`, `fullName`, `passwordHash`, `role`, `status`.
- **`Product`**: `id`, `name`, `slug`, `sku`, `categorySlug`, `price`, `originalPrice`, `badge`, `rating`, `images` (Json), `features` (Json).
- **`ProductVariant`**: `id`, `productId`, `sku`, `size`, `color`, `colorHex`, `stock`.
- **`Order`**: `id`, `orderNumber` (e.g. `DRP-84920`), `customerName`, `customerPhone`, `shippingAddress` (Json), `status`, `paymentStatus`, `paymentMethod`, `subtotal`, `shippingFee`, `discountAmount`, `totalAmount`.
- **`OrderItem`**: `id`, `orderId`, `productId`, `variantId`, `productName`, `size`, `color`, `unitPrice`, `quantity`, `totalPrice`.
- **`Coupon`**: `id`, `code`, `discountType` (`PERCENTAGE`/`FIXED`), `discountValue`, `minSpend`, `maxDiscount`, `usageLimit`, `usedCount`, `startDate`, `expiryDate`.
- **`Campaign`**: `id`, `title`, `slug`, `bannerUrl`, `discountPct`, `startDate`, `endDate`.
- **`AuditLog`**: `id`, `adminId`, `action`, `target`, `targetId`, `payload`.

---

## 4. API Endpoints Reference Matrix

| Domain | Route | HTTP | Access | Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/api/v1/auth/register` | POST | Public | Register customer account & generate OTP code |
| **Auth** | `/api/v1/auth/verify-otp` | POST | Public | Verify registration OTP code & get JWT tokens |
| **Auth** | `/api/v1/auth/login` | POST | Public | Authenticate with phone/email and password |
| **Auth** | `/api/v1/auth/refresh` | POST | Public | Refresh JWT access token using refresh token |
| **Auth** | `/api/v1/auth/me` | GET | Bearer | Get authenticated user profile |
| **Catalog**| `/api/v1/categories` | GET | Public | List active categories with subcategories |
| **Catalog**| `/api/v1/products` | GET | Public | List products with search (`q`), filter (`category`, `subcategory`, `collection`, `priceMin`, `priceMax`, `colors`, `sizes`), & pagination |
| **Catalog**| `/api/v1/products/:idOrSlug` | GET | Public | Get product details with all size/color variants |
| **Checkout**|`/api/v1/orders` | POST | Public/Auth | Place new order (atomic stock deduction & coupon validation) |
| **Checkout**|`/api/v1/orders/track/:identifier` | GET | Public | Track order status by order number (`DRP-XXXXX`) or phone |
| **Checkout**|`/api/v1/orders/my-orders` | GET | CUSTOMER | List authenticated customer order history |
| **Coupons**| `/api/v1/coupons/validate` | POST | Public | Validate coupon code against cart subtotal |
| **Coupons**| `/api/v1/admin/coupons` | GET/POST/DELETE| STORE_MANAGER/SUPER_ADMIN | Manage coupon discount codes |
| **Campaigns**|`/api/v1/campaigns` | GET | Public | List active marketing campaigns |
| **Admin** | `/api/v1/admin/orders` | GET | CSR/STORE_MANAGER/SUPER_ADMIN | List all platform orders |
| **Admin** | `/api/v1/admin/orders/:id/status`| PATCH | CSR/STORE_MANAGER/SUPER_ADMIN | Transition order status (`SHIPPED`, `DELIVERED`, etc.) |
| **Admin** | `/api/v1/admin/inventory/adjust` | POST | STORE_MANAGER/SUPER_ADMIN | Adjust variant stock quantity & record log |
| **Admin** | `/api/v1/admin/reports/summary` | GET | STORE_MANAGER/SUPER_ADMIN | Financial metrics & total sales report |

---

## 5. Core Business Logic & Conventions

### Standardized Response Envelope
All success responses automatically get wrapped by `ResponseStandardizationInterceptor`:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully.",
  "data": { ... },
  "timestamp": "2026-09-10T02:00:00.000Z"
}
```

### Order Placement Execution Flow
1. **Validate Request & Items**: Verify all variant items exist and are active.
2. **Atomic Stock Verification & Reservation**: Inside a Prisma `$transaction`, ensure `variant.stock >= requestedQuantity`. If insufficient, throw `400 Bad Request`.
3. **Price & Shipping Fee Calculation**:
   - Subtotal computed strictly from DB prices.
   - Shipping fee: Inside Dhaka = ৳80, Outside Dhaka = ৳150.
   - Coupon discount evaluated and deducted.
4. **Deduct Stock**: Decrement `variant.stock` and log entry in `InventoryLog` (`reason: CUSTOMER_ORDER`).
5. **Persist Order Record**: Create `Order`, `OrderItem`s, and initial `OrderStatusHistory` record (`PENDING`, `"Order received"`).

---

## 6. How to Run & Verify

### Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `DATABASE_URL` in `.env` with your PostgreSQL credentials.

### Development Commands
```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with initial admin accounts & products
npm run db:seed

# Start development server with live reload
npm run dev

# Build production bundle
npm run build
```

---

## 7. Key Credentials Created in Seed

- **Super Admin**: `admin@drape.com` / `Password123!`
- **Store Manager**: `manager@drape.com` / `Password123!`
- **Customer Support**: `csr@drape.com` / `Password123!`
- **Demo Customer**: `customer@drape.com` / `Password123!` (Phone: `+8801733333333`)
