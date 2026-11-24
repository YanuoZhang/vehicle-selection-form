# Vehicle Selection Form

A small full-stack app: choose a vehicle (make → model → badge), upload its logbook as a `.txt` file, and see what the backend received.

## Features

- **Cascading dropdowns:** Make, Model and Badge. Changing one clears the ones after it, and each stays disabled until it has options.
- **Quick select:** preset buttons fill in all three dropdowns at once.
- **Logbook upload:** shown once the vehicle is complete. Accepts one `.txt` file (case-insensitive) up to 1 MB, checked in the browser and again by the backend. A selected file is kept if the vehicle is changed and completed again.
- **Submission:** sent as `multipart/form-data` to `POST /api/submissions`. Submit stays disabled until the vehicle and file are valid. Duplicate submits are blocked and inputs are locked while the request runs. API and network errors are shown and can be retried.
- **Result view:** shows the make, model and badge returned by the backend, plus the logbook text with its line breaks kept. **New Submission** returns to an empty form.

## Prerequisites

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the backend on http://localhost:3001 (restarts on change) and the Vite dev server on http://localhost:5173. Open http://localhost:5173. Vite passes `/api/*` requests to the backend.

### Production build

```bash
npm run build        # frontend → frontend/dist/, backend → backend/dist/
npm start            # built backend on http://localhost:3001 (set PORT to change)
```

`npm start` serves the API only. To try the built frontend locally, run this in a second terminal while `npm start` is running:

```bash
npm run preview -w frontend   # http://localhost:4173, passes /api/* to the backend on port 3001
```

In a real deployment, serve `frontend/dist/` as static files and route `/api/*` to the backend.

### Tests and type checking

```bash
npm test             # run all frontend and backend tests once
npm run typecheck    # type-check both workspaces
```

Other scripts in the root `package.json`:
- `dev:frontend` / `dev:backend`, `build:frontend` / `build:backend` and `test:frontend` / `test:backend` run one workspace only.
- `test:watch` (plus `test:watch:frontend` / `test:watch:backend`) runs the tests in watch mode.

[Vitest](https://vitest.dev) runs both test suites:
- **`frontend/`:** React Testing Library + jest-dom on jsdom.
- **`backend/`:** Supertest against the Express app from `createApp()`, so no port is opened.

Test files sit next to the code they test, as `*.test.ts(x)`.

## Project structure

npm workspaces:

```
shared/      vehicles.json: the make → model → badge data used by both apps
backend/     Node.js + Express + TypeScript API
  src/       app.ts (routes), submissions.ts (POST /api/submissions), vehicles.ts, errors.ts
frontend/    React + TypeScript + Vite
  src/
    App.tsx          switches between the form and the result view
    components/      VehicleForm (form state), VehicleSelector, QuickSelect, LogbookUpload, SubmissionResult
    lib/             vehicleData.ts, logbook.ts (file checks), api.ts (submission request)
    styles.css       plain CSS
```

## Design decisions

- **Shared vehicle data.** `shared/vehicles.json` is the single source of vehicle data. The frontend builds its dropdowns from it, and the backend validates submissions against the same file, so they can't drift apart.
- **Multipart request, JSON response.** The form sends the vehicle and the logbook file together as `multipart/form-data` in one request. The API replies with JSON: either the submission it received (vehicle and logbook text), which the result view shows directly, or an `{ error: { code, message } }` object.
- **The backend has the final say.** The frontend checks only the file type and size, to give quick feedback. The backend re-checks everything (fields, vehicle, file type, size and text content) and its error messages are shown to the user as returned.
- **State kept simple.** `VehicleForm` owns all form state; the other components receive values and callbacks. `App` only holds the successful result, and clearing it brings back a new, empty form. There's no router, global store or persistence.
- **Make ids vs. labels.** The data and API use lowercase make ids (`ford`); the UI shows display names (`Ford`).

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
