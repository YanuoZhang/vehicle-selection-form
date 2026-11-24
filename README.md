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

### `POST /api/submissions`

`multipart/form-data` with:

| Field     | Type | Notes                                                   |
| --------- | ---- | ------------------------------------------------------- |
| `make`    | text | Required, non-empty, sent once; the make id, e.g. `ford` |
| `model`   | text | Required, non-empty, sent once                          |
| `badge`   | text | Required, non-empty, sent once; must match make + model |
| `logbook` | file | Required, one `.txt` file, UTF-8, ≤ 1 MB, not empty     |

```bash
curl -F make=ford -F model=Ranger -F badge=Raptor \
     -F logbook=@logbook.txt http://localhost:3001/api/submissions
```

**200** echoes the submission:

```json
{
  "make": "ford",
  "model": "Ranger",
  "badge": "Raptor",
  "logbook": { "fileName": "logbook.txt", "size": 123, "contents": "..." }
}
```

**Errors** use `{ "error": { "code": "...", "message": "..." } }`. Checks run in this order and the first failure is returned:

1. **Parsing the multipart body.** These errors fire as the body streams in, so they come before any field check:
   - `413 FILE_TOO_LARGE`: the file is over 1 MB
   - `400 UNEXPECTED_FIELD`: a file is in a field other than `logbook`, or more than one file is sent
   - `400 INVALID_REQUEST`: the body is malformed, has more than 10 text fields, or a text value is over 1 KB
2. `400 UNEXPECTED_FIELD`: a text field other than `make`, `model` or `badge`
3. `400 MISSING_FIELDS`: `make`, `model` or `badge` is missing, empty or repeated. A body that isn't multipart ends up here.
4. `400 INVALID_VEHICLE`: no vehicle has that make/model/badge combination (exact, case-sensitive match)
5. `400 MISSING_FILE`: no `logbook` file
6. `400 INVALID_FILE_TYPE`: the file name doesn't end in `.txt` (case-insensitive)
7. `400 INVALID_FILE_CONTENT`: the file isn't valid UTF-8 or contains NUL bytes
8. `400 EMPTY_FILE`: the file is empty, or holds only a UTF-8 BOM

Unknown `/api` routes return `404 NOT_FOUND`. Unexpected server errors return `500 INTERNAL_ERROR` with a generic message.
