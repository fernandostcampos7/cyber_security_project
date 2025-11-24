# LePax Secure Shop Prototype

This project is a secure e-commerce prototype developed as part of the **Cyber Security Coursework**.
It demonstrates the application of secure software engineering principles using a modern full-stack architecture.

---

## 1. Overview

**LePax** simulates an online shop with secure login, role-based access control, product listings, sanitised user reviews and analytics.
The architecture follows a layered approach separating:

- **Frontend:** React + TypeScript (presentation and interaction)
- **Backend:** Flask + SQLAlchemy (logic and persistence)
- **Database:** SQLite (local database for demonstration)

The focus is on **security, maintainability, and clear separation of concerns**.

---

## 2. Tech Stack

### Backend

| Category | Technology |
|-----------|-------------|
| Language | Python 3.10 |
| Framework | Flask 3 |
| Security | Flask-Talisman, Argon2 (argon2-cffi), Passlib, bcrypt, Bleach, Pillow |
| Database | SQLite + SQLAlchemy 2 |
| Migrations | Alembic |
| CORS / Config | Flask-CORS, python-dotenv |
| Testing | Pytest |
| Markup Handling | Markdown + Bleach |
| Deployment | Local execution via Flask or `python3 -m backend.app` |

### Frontend

| Category | Technology |
|-----------|-------------|
| Framework | React 19 + TypeScript |
| State / Data | React Query (@tanstack/react-query) + Axios |
| Routing | React Router DOM |
| Styling | Tailwind CSS, PostCSS, Autoprefixer |
| Charts | Recharts |
| Build | Vite 7 (@vitejs/plugin-react) |
| Linting | ESLint, TypeScript-ESLint, eslint-plugin-react-hooks, eslint-plugin-react-refresh |

---

## 3. Repository Structure

```
cyber_security_project/
  ├── backend/
  │   ├── app.py
  │   ├── requirements.txt
  │   ├── models/
  │   ├── routes/
  │   ├── security/
  │   ├── scripts/
  │   ├── alembic/
  │   └── lepax.db
  ├── frontend/
  │   ├── package.json
  │   ├── vite.config.ts
  │   ├── tailwind.config.js
  │   └── src/
  ├── Makefile
  ├── run.sh
  └── README.md
```

---

## 4. Installation and Execution

### 4.1 Prerequisites
- **Python 3.10** or later
- **Node.js 20+** and **npm**
- **Linux, macOS, or WSL**

---

### 4.2 Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Alternative (from project root):
```bash
python3 -m backend.app
```

If port 5000 is busy:
```bash
lsof -ti:5000 | xargs -r kill -9
```

---

### 4.3 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Vite runs on **http://localhost:5173**.
API requests default to **http://localhost:5000** unless `VITE_API_URL` is defined.

---

### 4.4 Using the Makefile
```bash
make backend     # setup + run backend
make frontend    # setup + run frontend
make clean       # free ports 5000 and 5173
```

---

### 4.5 Using run.sh
```bash
./run.sh
```

This script creates the virtual environment, installs dependencies, starts both servers, and stops them when you press **Ctrl + C**.

---

## 5. Default Users

| Role | Email | Password |
|------|--------|-----------|
| **Admin** | admin@example.com | Test1234! |
| **Buyer** | buyer@example.com | Test1234! |
| **Seller** | seller@example.com | Test1234! |
| **Buyer_Future_Seller** | future_seller@example.com | Test1234! |

---

## 6. Core Features

### Authentication and Access Control
- Argon2 password hashing
- RBAC (Roles: admin, seller, customer)
- Flask decorators for route protection
- JWT/session-based authentication

### Product Management
- Sellers create/edit listings
- Admin views and manages all listings

### Reviews
- Markdown input, sanitised with Bleach
- Stored safely in the database

### File Uploads
- Validated and processed via Pillow
- Size and format checks for images

### Analytics
- Records page views and interactions
- Visualised with Recharts on frontend
- Admin dashboard summarises events

---

## 7. Security Highlights
- **Argon2** hashing for credentials
- **Flask-Talisman** secure headers
- **Bleach** removes unsafe HTML
- **Pillow** verifies images
- **SQLAlchemy** prevents SQL injection
- **Role-based decorators** limit access

---

## 8. Quick Start for Tutors
```bash
git clone <repository_url>
cd cyber_security_project
make clean
make backend
make frontend
```
Then open **http://localhost:5173** and log in as `admin@example.com / Test1234!`.

---

## 9. Licence
Educational use only.
Developed by **Fernando Campos** for the **Cyber Security** coursework at Coventry University.
