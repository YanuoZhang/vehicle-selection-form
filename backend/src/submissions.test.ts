import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { MAX_FILE_SIZE_BYTES } from "./submissions.js";

const app = createApp();

const validVehicle = { make: "ford", model: "Ranger", badge: "Raptor" };

interface UploadFile {
  content: string | Buffer;
  filename?: string;
  field?: string;
}

/** POSTs a multipart submission; pass `file: null` to send no file. */
function submit(
  fields: Record<string, string> = validVehicle,
  file: UploadFile | null = { content: "Service 1: oil change" },
) {
  const req = request(app).post("/api/submissions");
  for (const [key, value] of Object.entries(fields)) req.field(key, value);
  if (file) {
    const buffer = typeof file.content === "string" ? Buffer.from(file.content) : file.content;
    req.attach(file.field ?? "logbook", buffer, {
      filename: file.filename ?? "logbook.txt",
      contentType: "text/plain",
    });
  }
  return req;
}

function expectError(res: request.Response, status: number, code: string) {
  expect(res.status).toBe(status);
  expect(res.type).toBe("application/json");
  expect(res.body.error.code).toBe(code);
  expect(typeof res.body.error.message).toBe("string");
}

describe("POST /api/submissions — success", () => {
  it("echoes the vehicle and logbook with 200", async () => {
    const res = await submit(validVehicle, {
      content: "Service 1: oil change",
      filename: "service.txt",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      make: "ford",
      model: "Ranger",
      badge: "Raptor",
      logbook: { fileName: "service.txt", size: 21, contents: "Service 1: oil change" },
    });
  });

  it("preserves line endings, Unicode and surrounding whitespace exactly", async () => {
    const content = "  10,000 km — oil ✔\r\n15,000 km: tyres 🛞\n\ttabbed line  \n";
    const res = await submit(validVehicle, { content });

    expect(res.status).toBe(200);
    expect(res.body.logbook.contents).toBe(content);
    expect(res.body.logbook.size).toBe(Buffer.byteLength(content));
  });

  it("strips a leading UTF-8 BOM", async () => {
    const content = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("Logbook")]);
    const res = await submit(validVehicle, { content });

    expect(res.status).toBe(200);
    expect(res.body.logbook.contents).toBe("Logbook");
  });

  it("returns HTML-like content as plain text, unchanged", async () => {
    const content = "<script>alert(1)</script>";
    const res = await submit(validVehicle, { content });

    expect(res.body.logbook.contents).toBe(content);
  });

  it.each(["SERVICE.TXT", "notes.Txt", "my logbook 2024.txt"])(
    "accepts the file name %j",
    async (filename) => {
      const res = await submit(validVehicle, { content: "ok", filename });

      expect(res.status).toBe(200);
      expect(res.body.logbook.fileName).toBe(filename);
    },
  );

  it("keeps a non-ASCII file name intact", async () => {
    const res = await submit(validVehicle, { content: "ok", filename: "日志 – Ranger.txt" });

    expect(res.status).toBe(200);
    expect(res.body.logbook.fileName).toBe("日志 – Ranger.txt");
  });

  it("accepts models and badges with spaces", async () => {
    const res = await submit({ make: "tesla", model: "Model 3", badge: "Long Range" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ make: "tesla", model: "Model 3", badge: "Long Range" });
  });

  it("accepts a file of exactly 1 MB", async () => {
    const res = await submit(validVehicle, { content: Buffer.alloc(MAX_FILE_SIZE_BYTES, "a") });

    expect(res.status).toBe(200);
    expect(res.body.logbook.size).toBe(MAX_FILE_SIZE_BYTES);
  });
});

describe("POST /api/submissions — fields", () => {
  it.each(["make", "model", "badge"])("rejects a missing %s", async (field) => {
    const fields: Record<string, string> = { ...validVehicle };
    delete fields[field];
    const res = await submit(fields);

    expectError(res, 400, "MISSING_FIELDS");
    expect(res.body.error.message).toContain(field);
  });

  it("rejects empty values", async () => {
    const res = await submit({ make: "", model: "", badge: "" });

    expectError(res, 400, "MISSING_FIELDS");
  });

  it("rejects a field sent twice", async () => {
    const res = await request(app)
      .post("/api/submissions")
      .field("make", "ford")
      .field("make", "bmw")
      .field("model", "Ranger")
      .field("badge", "Raptor")
      .attach("logbook", Buffer.from("ok"), "logbook.txt");

    expectError(res, 400, "MISSING_FIELDS");
  });

  it("rejects an extra text field", async () => {
    const res = await submit({ ...validVehicle, colour: "red" });

    expectError(res, 400, "UNEXPECTED_FIELD");
    expect(res.body.error.message).toContain("colour");
  });

  it("rejects a non-multipart request", async () => {
    const res = await request(app).post("/api/submissions").send(validVehicle);

    expectError(res, 400, "MISSING_FIELDS");
  });

  it("rejects a malformed multipart body", async () => {
    const res = await request(app)
      .post("/api/submissions")
      .set("Content-Type", "multipart/form-data; boundary=xyz")
      .send("--xyz\r\nnot a valid part");

    expectError(res, 400, "INVALID_REQUEST");
  });
});

describe("POST /api/submissions — vehicle", () => {
  it.each([
    ["a badge from another model", { make: "ford", model: "Falcon Ute", badge: "XR8" }],
    ["a model from another make", { make: "bmw", model: "Ranger", badge: "Raptor" }],
    ["an unknown make", { make: "holden", model: "Commodore", badge: "SS" }],
    ["a display label instead of the id", { make: "Ford", model: "Ranger", badge: "Raptor" }],
    ["an inherited property name", { make: "constructor", model: "Ranger", badge: "Raptor" }],
  ])("rejects %s", async (_case, fields) => {
    const res = await submit(fields);

    expectError(res, 400, "INVALID_VEHICLE");
  });

  it("checks the vehicle before the file", async () => {
    const res = await submit({ make: "ford", model: "Falcon Ute", badge: "XR8" }, null);

    expectError(res, 400, "INVALID_VEHICLE");
  });
});

describe("POST /api/submissions — file", () => {
  it("rejects a missing file", async () => {
    const res = await submit(validVehicle, null);

    expectError(res, 400, "MISSING_FILE");
  });

  it("rejects a file in the wrong field", async () => {
    const res = await submit(validVehicle, { content: "ok", field: "file" });

    expectError(res, 400, "UNEXPECTED_FIELD");
  });

  it("rejects more than one file", async () => {
    const res = await submit(validVehicle)
      .attach("logbook", Buffer.from("second"), "second.txt");

    expectError(res, 400, "UNEXPECTED_FIELD");
  });

  it.each(["notes.csv", "logbook", "notes.txt.exe", "notes.txt ", "txt"])(
    "rejects the file name %j",
    async (filename) => {
      const res = await submit(validVehicle, { content: "ok", filename });

      expectError(res, 400, "INVALID_FILE_TYPE");
    },
  );

  it("rejects an empty file", async () => {
    const res = await submit(validVehicle, { content: "" });

    expectError(res, 400, "EMPTY_FILE");
  });

  it("rejects a file containing only a UTF-8 BOM", async () => {
    // 3 bytes on disk, but no text once the BOM is stripped
    const res = await submit(validVehicle, { content: Buffer.from([0xef, 0xbb, 0xbf]) });

    expectError(res, 400, "EMPTY_FILE");
  });

  it.each([
    ["invalid UTF-8", Buffer.from([0x4f, 0x69, 0x6c, 0xc3, 0x28])],
    ["NUL bytes", Buffer.from("oil\u0000change")],
    ["a PNG renamed to .txt", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])],
  ])("rejects %s", async (_case, content) => {
    const res = await submit(validVehicle, { content });

    expectError(res, 400, "INVALID_FILE_CONTENT");
  });

  it("rejects a file over 1 MB with 413", async () => {
    const res = await submit(validVehicle, { content: Buffer.alloc(MAX_FILE_SIZE_BYTES + 1, "a") });

    expectError(res, 413, "FILE_TOO_LARGE");
  });
});
