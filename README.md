# Vehicle Selection Form

Monorepo using npm workspaces.

| Workspace   | Stack                          | Dev URL               |
| ----------- | ------------------------------ | --------------------- |
| `frontend/` | React + TypeScript + Vite      | http://localhost:5173 |
| `backend/`  | Node.js + Express + TypeScript | http://localhost:3001 |

The Vite dev server proxies `/api/*` to the backend.

## Requirements

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
```

## Scripts (run from repo root)

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Run frontend and backend together    |
| `npm run dev:frontend` | Run frontend only                    |
| `npm run dev:backend`  | Run backend only (watch mode)        |
| `npm run build`        | Build both workspaces                |
| `npm run build:frontend` | Build frontend only → `frontend/dist/` |
| `npm run build:backend`  | Build backend only → `backend/dist/`   |
| `npm run typecheck`    | Type-check both workspaces           |
| `npm start`            | Start the built backend              |

## API

- `GET /api/health` → `{ "status": "ok" }`

```bash
curl http://localhost:3001/api/health
```
