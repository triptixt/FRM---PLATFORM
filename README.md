# FRM Platform — Phase 1

Fraud Risk Management service for Payment Orchestration Platform.

## Stack
- **Backend**: Node.js (TypeScript + Express + pg + ioredis + JWT)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS (see /frontend)
- **Databases**: PostgreSQL + Redis (with intelligent memory fail-open fallback)
- **Auth**: JWT

---

## Quick Start

### Step 1 — Start databases (Docker or local PostgreSQL/Redis)
```powershell
docker-compose up -d
```
*(If running local PostgreSQL on port 5432 or 5433, the backend automatically detects and connects).*

### Step 2 — Start backend (Node.js + TypeScript)
```powershell
cd backend
npm install
npm run dev
```
The backend initializes database tables and seeds the 18 Phase 1 rules and default admin user automatically on startup!
Listening on **http://localhost:8081**.

### Step 3 — Start frontend (Next.js 14 + TypeScript)
```powershell
cd ../frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser and sign in with:
- **Username**: `admin`
- **Password**: `Admin@123`

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Get JWT token |

### Screening (called by Orchestration)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/frm/screen` | Screen a transaction |
| GET  | `/frm/health` | Health check |

### Admin (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/rules` | List all rules |
| PATCH | `/admin/rules/{id}/status` | Enable/disable a rule |
| GET | `/admin/transactions` | List screened transactions |
| GET | `/admin/cases` | List fraud cases |
| PATCH | `/admin/cases/{id}` | Update case status |
| GET | `/admin/dashboard/summary` | Dashboard counts |

---

## Screening Request Example

```json
POST /frm/screen
Authorization: Bearer <token>

{
  "txnId": "TXN-20260323-001",
  "merchantId": "MID-001",
  "amount": 75000,
  "currency": "INR",
  "paymentMode": "UPI",
  "payerMobile": "9876543210",
  "payerEmail": "user@gmail.com",
  "vpa": "user@upi",
  "ipAddress": "182.75.10.20",
  "deviceId": "DEV-ABC123"
}
```

```json
// Response
{
  "success": true,
  "data": {
    "txnId": "TXN-20260323-001",
    "decision": "REVIEW",
    "riskScore": 55,
    "triggeredRules": ["HIGH_AMOUNT_50K"],
    "caseGenerated": true,
    "caseRef": "CASE-2026-000001",
    "screeningMs": 12
  }
}
```

---

## Default Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | ADMIN |

---

## Phase 1 Rules (seeded automatically)

| Code | Type | Description | Score |
|------|------|-------------|-------|
| HIGH_AMOUNT_50K | STATIC | Amount > ₹50,000 | 40 |
| DISPOSABLE_EMAIL | STATIC | Temp email domain | 30 |
| NEW_CARD_HIGH_AMOUNT | STATIC | New card + amount > ₹25k | 35 |
| BNPL_EMI_HIGH_AMOUNT | STATIC | BNPL/EMI > ₹1L | 25 |
| SUSPICIOUS_ROUND_AMOUNT | STATIC | Amount ends in 999 | 20 |
| MOBILE_VELOCITY_5_IN_5M | AGGREGATION | >5 txns/mobile/5min | 60 |
| IP_VELOCITY_20_IN_5M | AGGREGATION | >20 txns/IP/5min (BLOCK) | 70 |
| DEVICE_VELOCITY_10_IN_10M | AGGREGATION | >10 txns/device/10min | 50 |
| MOBILE_AMOUNT_1L_1H | AGGREGATION | >₹1L/mobile/hour | 65 |
| MERCHANT_VELOCITY_500_IN_1M | AGGREGATION | >500 txns/merchant/1min | 55 |

---

## Decision Thresholds (configurable in application.yml)
| Score | Decision |
|-------|----------|
| < 40 | ALLOW |
| 40 – 69 | REVIEW (case created) |
| ≥ 70 | BLOCK (case created) |

---

## Project Structure
```
frm-platform/
├── docker-compose.yml
├── backend/                         ← Node.js + TypeScript FRM service
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts                ← Express application entry point
│       ├── config/                  ← Database pool, Redis, migrations, env
│       ├── core/                    ← Rule engine, decision engine, evaluators
│       │   ├── engine/              ← RuleEngineService, DecisionEngine, TransactionContext
│       │   ├── evaluators/          ← StaticEvaluator, AggregationEvaluator
│       │   └── types/               ← Domain types & interfaces
│       ├── services/                ← ScreeningService, CaseService, VelocityService, BlacklistService
│       ├── routes/                  ← Screening, Admin, Auth, Debug REST routes
│       ├── middleware/              ← JWT auth & centralized error handler
│       └── utils/                   ← ApiResponse & logger
└── frontend/                        ← Next.js 14 App Router + TypeScript + Tailwind CSS
    ├── package.json
    ├── next.config.mjs              ← Proxies /frm, /auth, /admin to backend (8081)
    └── src/
        ├── app/                     ← App router pages (dashboard, transactions, cases, rules, blacklist, login)
        ├── components/              ← Sidebar, badges, dialogs, cards
        ├── services/                ← Typed API client (axios interceptors + Bearer tokens)
        ├── context/                 ← AuthContext
        └── types/                   ← Frontend TypeScript interfaces
```
