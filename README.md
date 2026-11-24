# Vehicle Selection Form

Choose a vehicle (make → model → badge), upload its logbook as a `.txt` file, and see what the backend received.

## Features

- Cascading Make / Model / Badge dropdowns, plus Quick Select presets
- Logbook upload (one `.txt` file, up to 1 MB), shown once the vehicle is complete
- Submit is enabled only when the vehicle and file are valid; errors are shown and can be retried
- Result view with the submitted vehicle and logbook text, and a **New Submission** button

## Tech stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript, Multer
- **Tests:** Vitest, React Testing Library, Supertest
- npm workspaces, with the vehicle data in a shared package

## Getting started

Requires Node.js 20+ and npm 10+.

```bash
npm install
```

### Development

```bash
npm run dev            # frontend and backend together
npm run dev:frontend   # frontend only: http://localhost:5173
npm run dev:backend    # backend only:  http://localhost:3001
```

Open http://localhost:5173. The Vite dev server forwards `/api` requests to the backend.

### Build and local preview

```bash
npm run build                  # builds both: frontend/dist/ and backend/dist/
npm start                      # runs the built backend on http://localhost:3001
npm run preview -w frontend    # in a second terminal: serves the built frontend on http://localhost:4173
```

## Testing

```bash
npm test                 # all tests
npm run test:frontend    # frontend tests only
npm run test:backend     # backend tests only
npm run typecheck        # type-check both workspaces
```

## Project structure

```
shared/     vehicles.json: make → model → badge data used by both apps
backend/    Express API (src/app.ts, src/submissions.ts)
frontend/   React app
  src/components/   VehicleForm, VehicleSelector, QuickSelect, LogbookUpload, SubmissionResult
  src/lib/          vehicle data helpers, file checks, API client
```

## API

### `POST /api/submissions`

Send `multipart/form-data` with:

| Field     | Notes                                       |
| --------- | ------------------------------------------- |
| `make`    | Make id, e.g. `ford`                        |
| `model`   | e.g. `Ranger`                               |
| `badge`   | Must belong to the make and model           |
| `logbook` | One `.txt` file, UTF-8, not empty, ≤ 1 MB   |

```bash
curl -F make=ford -F model=Ranger -F badge=Raptor \
     -F logbook=@logbook.txt http://localhost:3001/api/submissions
```

A valid submission returns **200** with the data received:

```json
{
  "make": "ford",
  "model": "Ranger",
  "badge": "Raptor",
  "logbook": { "fileName": "logbook.txt", "size": 123, "contents": "..." }
}
```

Invalid requests return **400** (or **413** for a file over 1 MB) with:

```json
{ "error": { "code": "INVALID_VEHICLE", "message": "..." } }
```

`GET /api/health` returns `{ "status": "ok" }`.
