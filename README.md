<div align="center">

<img src="mobile/assets/icon.png" alt="FarmDirect" width="100" />

<h3><b>FarmDirect</b></h3>
<p><b>Agricultural produce, direct from farm to table — no middlemen, fair prices.</b></p>

<p>
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#testing"><strong>Testing</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a>
</p>

<p>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Playwright](https://img.shields.io/badge/Playwright-19%2F19-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</p>

</div>

---

FarmDirect is a direct-trade platform that connects farmers and consumers, cutting out distributors so growers earn more and buyers pay less. Farmers manage listings and track demand through an AI-powered dashboard; consumers browse, order, and pay inside a single mobile app.

## Features

<details>
<summary><b>Consumer Experience</b></summary>

- **Browse & Discover** — Category grid, regional filters, and AI-curated recommendations on the home feed
- **Price Transparency** — Real-time AI price tags show whether a product is above or below market trend
- **Cart & Checkout** — Multi-item cart with quantity controls and integrated payment flow (PortOne / dummy mode)
- **Order Tracking** — Live status updates from `pending` through `paid` to `completed`
- **Reviews** — Star ratings and photo reviews gated behind verified purchases
- **Push Notifications** — Order and payment events delivered via FCM (or stub in dev)

</details>

<details>
<summary><b>Farmer Dashboard</b></summary>

- **Product Management** — Create, edit, and soft-delete listings with stock control
- **AI Demand Forecast** — Prophet-based 30-day demand curves per category
- **AI Price Optimiser** — Suggests optimal listing price with confidence score and reasoning
- **Sales Stats** — Revenue totals, order counts, and trend charts
- **Order Fulfilment** — Accept and mark orders complete from a single screen

</details>

<details>
<summary><b>Backend & Integrations</b></summary>

- **Async REST API** — FastAPI with async SQLAlchemy and PostgreSQL
- **Swappable service layer** — Every external dependency (Firebase Auth, PortOne payments, S3 storage, FCM) ships with a drop-in dummy implementation; flip `USE_REAL_SERVICES=true` to go live
- **ML pipeline** — Prophet forecaster + scikit-learn price optimiser, PyTorch-ready
- **Database migrations** — Alembic with auto-generated revisions and seed script

</details>

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | [React Native](https://reactnative.dev) 0.83 + [Expo](https://expo.dev) 55 |
| Language (mobile) | [TypeScript](https://www.typescriptlang.org) 5.9 |
| Navigation | [React Navigation](https://reactnavigation.org) 7 |
| State | [Zustand](https://zustand-demo.pmnd.rs) 5 + [TanStack Query](https://tanstack.com/query) 5 |
| API | [FastAPI](https://fastapi.tiangolo.com) 0.115 + [Uvicorn](https://www.uvicorn.org) |
| Language (backend) | Python 3.11 |
| ORM | [SQLAlchemy](https://sqlalchemy.org) 2.0 (async) + [Alembic](https://alembic.sqlalchemy.org) |
| Database | [PostgreSQL](https://postgresql.org) 16 |
| ML | [Prophet](https://facebook.github.io/prophet) · [PyTorch](https://pytorch.org) · [scikit-learn](https://scikit-learn.org) |
| Auth | [Firebase Admin SDK](https://firebase.google.com) (swappable) |
| Payments | [PortOne](https://portone.io) (swappable) |
| E2E Tests | [Playwright](https://playwright.dev) |

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 16 (`brew install postgresql@16`)

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env          # then edit DATABASE_URL, SECRET_KEY, etc.

# Create database and run migrations
createdb farmdirect
alembic upgrade head

# Seed sample data
python -m scripts.seed_data

# Start API server
uvicorn app.main:app --reload --port 8000
```

> [!NOTE]
> By default `USE_REAL_SERVICES=false`. All external services (Firebase, PortOne, S3, FCM) run as in-process stubs — no credentials required to develop locally.

### 2. Mobile

```bash
cd mobile
npm install

# Start Expo dev server (web target for e2e tests)
npm start
# or target a specific platform:
npm run ios
npm run android
```

The app connects to `http://localhost:8000/api` by default.

### Environment Variables (backend)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/farmdirect` | PostgreSQL connection string |
| `SECRET_KEY` | *(change me)* | JWT signing secret |
| `USE_REAL_SERVICES` | `false` | Set `true` to activate Firebase / PortOne / S3 / FCM |
| `FIREBASE_CREDENTIALS_PATH` | `firebase-credentials.json` | Firebase Admin service account key |
| `PG_MERCHANT_ID` | — | PortOne merchant ID |
| `PG_API_KEY` | — | PortOne API key |
| `PG_API_SECRET` | — | PortOne API secret |

## Testing

FarmDirect ships with **19/19 Playwright e2e tests** covering both the API layer and the React Native Web UI.

### Run e2e tests

```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --port 8000

# Terminal 2 — mobile (web)
cd mobile && npx expo start --web

# Terminal 3 — run tests
cd e2e
npm install
npx playwright test
```

### Test coverage

| Suite | Tests | Scope |
|---|---|---|
| App loading | 2 | React Native Web renders, Korean content present |
| Backend API | 8 | Health check, auth flow, product CRUD, order→payment→review flow, cart CRUD, AI endpoints, notifications |
| UI click | 9 | Onboarding navigation, login form elements, signup flow, page rendering |

```
Running 19 tests using 1 worker

  ✓ 앱이 정상적으로 로드된다
  ✓ 온보딩 화면이 표시된다
  ✓ 헬스체크 API가 동작한다
  ✓ 카테고리 API가 동작한다
  ✓ 회원가입 → 로그인 → 프로필 조회 플로우
  ✓ 상품 CRUD 전체 플로우
  ✓ 주문 → 결제 → 완료 → 리뷰 전체 플로우
  ✓ AI 수요 예측 및 가격 최적화
  ✓ 장바구니 CRUD
  ✓ 알림 읽음 처리
  ✓ 온보딩 화면을 넘기고 로그인 화면에 도달한다
  ✓ 로그인 화면의 모든 요소가 존재한다
  ✓ 이메일/비밀번호를 입력하고 로그인 버튼을 클릭할 수 있다
  ✓ 회원가입 링크를 클릭하면 회원가입 화면으로 이동한다
  ✓ 회원가입 화면에서 폼을 채우고 제출할 수 있다
  ✓ 온보딩 슬라이드를 순서대로 넘길 수 있다
  ✓ 앱에 한글 컨텐츠가 렌더링된다
  ✓ React Native Web이 #root에 렌더링된다
  ✓ 스크린샷이 빈 화면이 아니다

  19 passed (42s)
```

## Architecture

```mermaid
graph TB
    subgraph Mobile["Mobile (Expo / React Native)"]
        UI[Screens & Components]
        Nav[React Navigation]
        Store[Zustand Store]
        Query[TanStack Query]
        AuthSvc[Auth Service]
        PaySvc[Payment Service]
    end

    subgraph Backend["Backend (FastAPI)"]
        API[REST API Routers]
        Services[Service Container]
        ML[ML Pipeline]
        DB[(PostgreSQL)]
    end

    subgraph External["External Services (swappable)"]
        Firebase[Firebase Auth]
        PortOne[PortOne PG]
        S3[AWS S3]
        FCM[FCM Push]
    end

    UI --> Query
    UI --> Store
    Query --> API
    AuthSvc -->|dummy / real| Firebase
    PaySvc -->|dummy / real| PortOne
    API --> Services
    Services --> DB
    Services --> ML
    Services -->|dummy / real| Firebase
    Services -->|dummy / real| PortOne
    Services -->|dummy / real| S3
    Services -->|dummy / real| FCM
```

### Key design decision — swappable service layer

Every external dependency implements a common interface. `ServiceContainer` reads `USE_REAL_SERVICES` at startup and injects either the real provider or a zero-config dummy. This means the entire application flow — auth, payments, storage, push notifications — runs end-to-end in development without any external accounts.

See [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for step-by-step instructions on switching each service to production.

### Directory structure

```
farm-direct/
├── backend/
│   ├── app/
│   │   ├── routers/       # auth, products, cart, orders, payments, reviews, notifications, ai
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic + swappable external providers
│   │   └── ml/            # Prophet forecaster, price optimiser
│   ├── alembic/           # Database migrations
│   └── scripts/           # Seed data
├── mobile/
│   └── src/
│       ├── screens/       # auth, home, product, cart, orders, farmer
│       ├── components/    # common UI, farmer dashboard, product cards
│       ├── api/           # Axios clients per domain
│       ├── store/         # Zustand stores
│       └── navigation/    # Stack + tab navigators
└── e2e/
    └── tests/             # Playwright specs (19 tests)
```

## License

MIT
