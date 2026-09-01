# EcoLife Retail Point of Sale (POS) Web System 🌿

A full-stack, production-ready Point of Sale (POS) web application designed specifically for retail eco-friendly and plastic-free product markets. Built with a clean, modern, dark-mode interface optimized for high-speed cashier checkouts, touchscreen terminals, and minimal training requirements.

---

## 🚀 Technology Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Recharts
- **Backend**: Node.js + Express API + JWT Auth + bcryptjs
- **Database / ORM**: Prisma ORM with SQLite (for zero-dependency local setup) & ready for PostgreSQL in production.
- **Testing**: Vitest unit test suite for billing math, tax calculation, and stock deductions.
- **Currency**: Configured for **Sri Lankan Rupees (LKR / Rs.)**.

---

## ⚡ Core Features & Capabilities

1. **Authentication & Role-Based Access Control (RBAC)**:
   - **Admin**: Full access to shop settings, user management, reports, DB backup.
   - **Manager**: Inventory CRUD, stock adjustments, void transaction authorization, purchase orders, returns.
   - **Cashier**: High-speed POS billing terminal, customer loyalty lookup, hold/resume sales.
   - Audit activity log tracking every action.

2. **Sales & Billing POS Screen**:
   - Fast instant product search by name, SKU, or category.
   - **USB Barcode Scanner Support**: Automatically captures scanned barcodes anywhere on the POS screen.
   - Multi-Payment Support: Cash, Card, Bank Transfer, Mobile Payments, and **Split Payments**.
   - Auto calculates VAT tax, item discounts, overall discounts, and change due in **LKR**.
   - Park / Hold sales and resume later.
   - **Thermal Receipt Printer Support**: 58mm & 80mm roll print optimization (`@media print`), with digital receipt email/SMS simulation.
   - **Offline-First Resilience**: Automatically queues sales in localStorage when connection drops and auto-syncs when online!

3. **Product & Inventory Management**:
   - Comprehensive product catalog with cost price, selling price, VAT %, unit (pcs/kg/pack), SKU, and barcode.
   - Stock adjustments with tracking reasons (Restock, Damage, Return, Expired, Correction).
   - Low-stock threshold badges & alerts widget.
   - Product CSV Import/Export.

4. **Returns & Refunds**:
   - Full or partial returns against original invoice numbers.
   - Automatic inventory stock replenishment.

5. **Customer & Loyalty System**:
   - Customer purchase history tracking.
   - Automatic loyalty points calculation (1 point per 100 LKR spent).

6. **Suppliers & Purchasing (GRN)**:
   - Supplier database & Purchase Order (PO) creation.
   - **Goods Received Note (GRN)**: Receiving a PO automatically updates inventory stock in real-time.

7. **Reports & Financial Analytics**:
   - Daily/Weekly/Monthly Sales Summary with Recharts area charts.
   - **Profit & Loss (P&L) Statement**: (Sales Revenue - Cost of Goods Sold - Shop Expenses = Net Profit).
   - Stock Valuation & Movement History Report.

8. **Shop Expenses**:
   - Record shop operational expenses by category (Rent, Electricity, Eco Packaging, Salaries).

9. **Settings & Customization**:
   - Custom shop header, address, VAT registration number, LKR currency settings, receipt footer message.
   - **Database Backup**: One-click complete JSON database export dump.

---

## 🔑 Default Demo User Credentials

| Role | Username / Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ecopos.com` | `Admin@123` | Everything (Settings, Users, Reports, POS, Inventory) |
| **Manager** | `manager@ecopos.com` | `Manager@123` | Dashboard, Reports, Inventory, PO, Returns, POS |
| **Cashier** | `cashier@ecopos.com` | `Cashier@123` | POS Terminal & Customer Loyalty |

---

## 🛠️ Quick Local Setup Instructions

### 1. Clone & Install Dependencies

#### Backend:
```bash
cd backend
cmd /c "npm install"
```

#### Frontend:
```bash
cd frontend
cmd /c "npm install"
```

### 2. Database Migration & Seeding

```bash
cd backend
cmd /c "npx prisma db push"
cmd /c "node prisma/seed.js"
```

### 3. Run Backend Server

```bash
cd backend
cmd /c "npm start"
# API will start on http://localhost:5000
```

### 4. Run Frontend Client

```bash
cd frontend
cmd /c "npm run dev"
# App will start on http://localhost:5173
```

---

## 🧪 Running Unit Tests

```bash
cd backend
cmd /c "npm test"
```

---

## 📁 Directory Structure

```
POS System/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # DB Schema
│   │   └── seed.js         # Seed Data Script
│   ├── src/
│   │   ├── config/         # DB & JWT config
│   │   ├── controllers/    # Express controllers
│   │   ├── middleware/     # Auth, Role & Activity Logger
│   │   ├── routes/         # API Routes
│   │   ├── utils/          # Billing calculation helpers
│   │   └── server.js       # Main server entry
│   ├── tests/              # Vitest unit test suite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # POS, ThermalReceipt, Navbar, Sidebar
│   │   ├── context/        # Auth & Cart Providers
│   │   ├── pages/          # Dashboard, POS, Inventory, Reports...
│   │   ├── services/       # API & Offline Queue Sync
│   │   └── utils/          # LKR Formatters
│   ├── package.json
│   └── vite.config.js
└── README.md
```
