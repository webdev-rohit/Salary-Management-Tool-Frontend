# PayrollHub — Frontend

React + Vite SPA for the PayrollHub Salary Management Tool. Integrates with a FastAPI backend to provide employee management and salary analytics.

## Pages

| Route | Description |
|---|---|
| `/login` | JWT authentication |
| `/employees` | Employee list with add, edit, delete, search, and filtering |
| `/insights` | Salary analytics dashboard with charts and ad-hoc queries |

## Tech Stack

- **React 18** with React Router v6
- **Vite 6** (dev server + proxy)
- **Axios** with JWT Bearer interceptor
- **Chart.js** (bar chart, doughnut chart)

## Prerequisites

- Node.js 18+
- PayrollHub backend running on `http://127.0.0.1:8000`

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

Copy `.env.example` to `.env` before running:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty)* | Leave empty to use the Vite dev proxy (recommended). Set to the backend URL only for production builds. |

## Why is `VITE_API_BASE_URL` empty?

During development, Vite proxies all `/auth`, `/employees`, and `/insights` requests to `http://127.0.0.1:8000`. This keeps requests same-origin from the browser's perspective and avoids CORS preflight issues. See `vite.config.js` for the proxy configuration.

## Project Structure

```
src/
├── api/             # Axios wrappers for each backend resource
│   ├── axios.js     # Base Axios instance with auth interceptor
│   ├── auth.js
│   ├── employees.js
│   └── insights.js
├── components/      # Shared UI components
│   ├── Sidebar.jsx
│   ├── EmployeeModal.jsx
│   ├── DeleteModal.jsx
│   └── Toast.jsx
├── context/
│   └── AuthContext.jsx  # JWT stored in localStorage
├── pages/
│   ├── Login.jsx
│   ├── Employees.jsx
│   └── Insights.jsx
├── styles/
│   └── globals.css  # Single global stylesheet
├── utils/
│   └── format.js    # Salary formatting, initials, avatar colour helpers
├── App.jsx          # Router with protected/public route guards
└── main.jsx
```

## Build for Production

```bash
npm run build
```

Output is in `dist/`. For production, set `VITE_API_BASE_URL` to the backend URL and ensure the backend has CORS configured for the frontend's origin.
