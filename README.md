# Social Marketing SaaS

AI-powered social media content generation and campaign planning platform.

## Project Structure

```
social-marketing-saas/
├── frontend/                     # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── layout/           # Layout, Navbar, Sidebar
│       │   └── auth/             # ProtectedRoute
│       ├── pages/
│       │   ├── auth/             # Login, Register
│       │   ├── Dashboard.jsx
│       │   ├── Calendar.jsx
│       │   ├── BlogGenerator.jsx
│       │   ├── BlogHistory.jsx
│       │   └── Settings.jsx
│       ├── context/              # AuthContext, GlobalStateContext
│       └── services/             # API client (axios)
│
├── backend/                      # Node + Express API server
│   ├── data/                     # SQLite database
│   └── src/
│       ├── config/               # Env vars, constants
│       ├── middleware/            # Auth middleware (JWT)
│       ├── routes/               # auth, calendar, ai, dashboard
│       ├── services/             # Gemini AI integration
│       ├── db/                   # SQLite connection + queries
│       ├── utils/                # Helpers (date, error)
│       ├── app.js                # Express app setup
│       └── server.js             # Entry point
│
└── README.md
```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Node.js, Express, SQLite, JWT, bcryptjs
- **AI**: Google Gemini API (content generation)

## Getting Started

### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

The API server starts at `http://127.0.0.1:8000`.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### 3. Configure AI (optional)

Copy `.env.example` to `.env` in the `backend/` folder and add your Gemini API key:

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
```

Users can also set their own API key in the Settings page.

## API Endpoints

| Route                        | Method | Description              |
|------------------------------|--------|--------------------------|
| `/api/health`                | GET    | Health check             |
| `/api/auth/register`         | POST   | Register new user        |
| `/api/auth/login`            | POST   | Login (returns JWT)      |
| `/api/auth/me`               | GET    | Get current user         |
| `/api/auth/me`               | PUT    | Update profile/API key   |
| `/api/calendar`              | GET    | List campaigns           |
| `/api/calendar`              | POST   | Create campaign          |
| `/api/calendar/:id`          | GET    | Get campaign             |
| `/api/calendar/:id`          | PUT    | Update campaign          |
| `/api/calendar/:id`          | DELETE | Delete campaign          |
| `/api/ai/jobs`               | POST   | Create AI generation job |
| `/api/ai/jobs`               | GET    | List AI jobs             |
| `/api/ai/jobs/:id`           | GET    | Get AI job               |
| `/api/ai/jobs/:id`           | PUT    | Update job content       |
| `/api/ai/jobs/:id`           | DELETE | Delete AI job            |
| `/api/ai/jobs/:id/retry`     | POST   | Retry failed job         |
| `/api/dashboard/overview`    | GET    | Dashboard stats          |
