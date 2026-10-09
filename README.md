# BookNFeast

BookNFeast is a hotel and restaurant management system with a Node/Express + MySQL backend and a static, single-page frontend. It covers rooms, guests, bookings, menu items, restaurant tables, orders, staff, and reports.

## Features
- Hotel operations: rooms, guests, bookings, and occupancy insights.
- Restaurant operations: menu, tables, orders, and service tracking.
- Admin auth flow with default credentials on first run.
- SQL-backed data with a localStorage fallback in the UI.
- Reports and dashboard with charts.

## Tech Stack
- Frontend: HTML, CSS, JavaScript (Chart.js)
- Backend: Node.js, Express, MySQL

## Project Structure
- backend/ - API server, DB setup, and seed logic
- database/ - MySQL schema
- frontend/ - SPA UI and pages
- assets/ - shared images and icons

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8+

### Backend
1) Install dependencies

```bash
cd backend
npm install
```

2) Create a database user and set env vars (create backend/.env)

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
```

3) Initialize schema

```bash
npm run db:init
```

4) Start the API server

```bash
npm run dev
```

API runs at http://localhost:3000

### Frontend
Open frontend/index.html in your browser. For a better dev experience, use a local server (VS Code Live Server or any static file server).

## Default Admin
- Username: admin
- Password: admin

## API Overview
- GET /api/health
- POST /api/auth/login
- POST /api/auth/reset
- GET /api/bootstrap
- POST /api/seed

## Notes
- The UI will fallback to localStorage seed data if the backend is offline.
