import type { VehicleSelection } from "./vehicleData";

/** The 200 response from POST /api/submissions. */
export interface Submission {
  make: string;
  model: string;
  badge: string;
  logbook: { fileName: string; size: number; contents: string };
}

/**
 * A failed submission. `code` is the API's error code, or NETWORK_ERROR,
 * HTTP_ERROR or INVALID_RESPONSE when there's no API error to report.
 * `status` is the HTTP status, if a response arrived.
 */
export class SubmissionError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SubmissionError";
  }
}

export async function submitVehicle(
  vehicle: VehicleSelection,
  logbook: File,
): Promise<Submission> {
  const body = new FormData();
  body.append("make", vehicle.make);
  body.append("model", vehicle.model);
  body.append("badge", vehicle.badge);
  body.append("logbook", logbook, logbook.name);

  let response: Response;
  try {
    // No Content-Type header: the browser adds multipart/form-data with the boundary.
    response = await fetch("/api/submissions", { method: "POST", body });
  } catch {
    throw new SubmissionError(
      "Couldn't reach the server. Check your connection and try again.",
      "NETWORK_ERROR",
    );
  }

  const data: unknown = await response.json().catch(() => undefined);

  if (response.ok) {
    if (data === undefined) {
      throw new SubmissionError(
        "The server sent an unexpected response. Please try again.",
        "INVALID_RESPONSE",
        response.status,
      );
    }
    return data as Submission;
  }

  const apiError = (data as { error?: { code?: unknown; message?: unknown } } | undefined)
    ?.error;
  if (typeof apiError?.code === "string" && typeof apiError.message === "string") {
    throw new SubmissionError(apiError.message, apiError.code, response.status);
  }
  throw new SubmissionError(
    `The server returned an error (HTTP ${response.status}). Please try again.`,
    "HTTP_ERROR",
    response.status,
  );
}
