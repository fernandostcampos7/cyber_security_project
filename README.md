# LePax Commerce & CMS Scaffold

LePax is a luxury fashion e-commerce scaffold with a privacy-first analytics layer. The stack combines a Flask API, SQLite 3 with SQLAlchemy, and a React + TypeScript + Vite frontend styled using Tailwind CSS.

## Repository layout

```
/backend         # Flask API, SQLAlchemy models, payments stubs
/frontend        # React + Vite client with Tailwind theme
```

## Backend quickstart

### Prerequisites

* Python 3.11+
* `pipx` or `virtualenv`

### Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Environment setup

Copy the example environment file and adjust values as needed.

```bash
cp .env.example .env
```

Key values:

* `SECRET_KEY` – secure random string
* `DATABASE_URL` – SQLite path, defaults to `sqlite:///../instance/lepax.db`
* OAuth, Stripe, PayPal credentials for local dev

### Database migration & seed data

```bash
mkdir -p ../instance
python -m app.seed
```

The seed script provisions:

* Admin: `admin@lepax.test` / `password`
* Seller: `seller@lepax.test` / `password`
* Customer: `customer@lepax.test` / `password`
* Ten demo products with imagery and variants
* A paid order and matching reviews to unlock review submission

### Run the API

```bash
export FLASK_APP=app:create_app
export FLASK_ENV=development
flask run --port 5000
```

Security defaults include strict CORS to the frontend origin, secure cookies, CSP for Stripe and PayPal domains, and lightweight rate limiting.

## Frontend quickstart

### Install dependencies

```bash
cd frontend
npm install
```

### Environment

```bash
cp .env.example .env
```

Set `VITE_API_BASE` to the API base URL (defaults to `http://localhost:5000/api`).

### Run the dev server

```bash
npm run dev
```

Visit `http://localhost:5173` to browse the storefront. The frontend uses TanStack Query for data fetching, React Router for navigation, and Tailwind tokens that express the LePax gold, silver, and rose gold palette on a charcoal canvas.

## Core features

* Browse, search, and filter products via `/api/products`
* View product detail pages with variants, imagery, and sanitised Markdown reviews
* Server-side cart stored per session
* Checkout sessions via Stripe Payment Element stub or PayPal order creation
* OAuth placeholders for Google and Facebook sign in flows
* Seller workspace for product management and transactions
* Admin observatory for analytics, audit logs, and user management
* GDPR tooling for analytics consent, export, and deletion requests

## Testing & quality

Planned CI checks:

* Backend: `pytest`, `bandit`, `semgrep`, `pip audit`
* Frontend: `npm run lint`, Playwright flows for cart + checkout

## Production hardening checklist

* Replace OAuth and payment stubs with real integrations via Authlib and Stripe SDK
* Enforce HTTPS and managed secrets in deployment infrastructure
* Move static/media to a CDN or object storage with signed URLs
* Extend rate limiting, CSRF protections, and refresh token storage

## License

This scaffold is provided for internal project bootstrapping.
