import type { ErrorRequestHandler, RequestHandler } from "express";

/** An error that maps directly to an API error response. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface ErrorResponse {
  error: { code: string; message: string };
}

/** JSON 404 for any /api route that doesn't exist. */
export const apiNotFound: RequestHandler = (req, res) => {
  const body: ErrorResponse = {
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.originalUrl}` },
  };
  res.status(404).json(body);
};

/** Turns any error into the API's JSON error shape. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ErrorResponse = { error: { code: err.code, message: err.message } };
    res.status(err.status).json(body);
    return;
  }

  // Unexpected: log the details, but don't leak them to the client.
  console.error(err);
  const body: ErrorResponse = {
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  };
  res.status(500).json(body);
};
