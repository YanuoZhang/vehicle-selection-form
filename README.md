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
| `npm test`             | Run frontend and backend tests once  |
| `npm run test:frontend` | Run frontend tests only            |
| `npm run test:backend`  | Run backend tests only             |
| `npm run test:watch`   | Run both test suites in watch mode   |
| `npm run test:watch:frontend` | Watch frontend tests only   |
| `npm run test:watch:backend`  | Watch backend tests only    |
| `npm start`            | Start the built backend              |

## Testing

[Vitest](https://vitest.dev) in both workspaces:

- `frontend/`: React Testing Library + jest-dom on jsdom (config in `vite.config.ts`)
- `backend/`: Supertest against the Express app from `createApp()`, so no port is opened

Test files sit next to the code as `*.test.ts(x)`. Vitest's keyboard shortcuts only work when watching one workspace (`test:watch:frontend` / `test:watch:backend`).

## API

- `GET /api/health` → `{ "status": "ok" }`

```bash
curl http://localhost:3001/api/health
```
