import { afterEach, describe, expect, it, vi } from "vitest";
import { submitVehicle, SubmissionError } from "./api";

const vehicle = { make: "ford", model: "Ranger", badge: "Raptor" };
const logbook = new File(["Serviced 2024"], "logbook.txt", { type: "text/plain" });

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function rejection(promise: Promise<unknown>): Promise<SubmissionError> {
  const error = await promise.then(
    () => expect.unreachable("expected the submission to fail"),
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(SubmissionError);
  return error as SubmissionError;
}

describe("submitVehicle", () => {
  it("POSTs the vehicle and logbook as multipart form data", async () => {
    const submission = {
      ...vehicle,
      logbook: { fileName: "logbook.txt", size: 13, contents: "Serviced 2024" },
    };
    fetchMock.mockResolvedValue(jsonResponse(200, submission));

    await expect(submitVehicle(vehicle, logbook)).resolves.toEqual(submission);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/submissions");
    expect(init?.method).toBe("POST");
    // Let the browser set the multipart Content-Type with its boundary.
    expect(init?.headers).toBeUndefined();

    const body = init?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("make")).toBe("ford");
    expect(body.get("model")).toBe("Ranger");
    expect(body.get("badge")).toBe("Raptor");
    const sentFile = body.get("logbook") as File;
    expect(sentFile.name).toBe("logbook.txt");
    expect(sentFile.size).toBe(logbook.size);
  });

  it("uses the API's error code and message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: { code: "EMPTY_FILE", message: "The logbook file is empty" },
      }),
    );

    const error = await rejection(submitVehicle(vehicle, logbook));

    expect(error.code).toBe("EMPTY_FILE");
    expect(error.status).toBe(400);
    expect(error.message).toBe("The logbook file is empty");
  });

  it("falls back to a generic message when the error body isn't the API shape", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad Gateway</html>", { status: 502 }),
    );

    const error = await rejection(submitVehicle(vehicle, logbook));

    expect(error.code).toBe("HTTP_ERROR");
    expect(error.status).toBe(502);
    expect(error.message).toBe(
      "The server returned an error (HTTP 502). Please try again.",
    );
  });

  it("reports a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await rejection(submitVehicle(vehicle, logbook));

    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.status).toBeUndefined();
    expect(error.message).toBe(
      "Couldn't reach the server. Check your connection and try again.",
    );
  });

  it("reports a successful response that isn't JSON", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));

    const error = await rejection(submitVehicle(vehicle, logbook));

    expect(error.code).toBe("INVALID_RESPONSE");
    expect(error.status).toBe(200);
    expect(error.message).toBe(
      "The server sent an unexpected response. Please try again.",
    );
  });
});
