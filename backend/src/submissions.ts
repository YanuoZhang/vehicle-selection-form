import { Router, type RequestHandler } from "express";
import multer from "multer";
import { HttpError } from "./errors.js";
import { isValidVehicle } from "./vehicles.js";

export const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB

const FILE_FIELD = "logbook";
const TEXT_FIELDS = ["make", "model", "badge"] as const;

export interface SubmissionResponse {
  make: string;
  model: string;
  badge: string;
  logbook: { fileName: string; size: number; contents: string };
}

const upload = multer({
  storage: multer.memoryStorage(),
  // Browsers send non-ASCII file names as raw UTF-8; multer's default is latin1.
  defParamCharset: "utf8",
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 10,
    fieldSize: 1024,
  },
}).single(FILE_FIELD);

/** Runs multer and converts its errors into API errors. */
const parseUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          return next(new HttpError(413, "FILE_TOO_LARGE", "The logbook must be 1 MB or smaller"));
        case "LIMIT_UNEXPECTED_FILE":
        case "LIMIT_FILE_COUNT":
          return next(
            new HttpError(
              400,
              "UNEXPECTED_FIELD",
              `Send exactly one file, in the "${FILE_FIELD}" field`,
            ),
          );
        default:
          return next(new HttpError(400, "INVALID_REQUEST", err.message));
      }
    }

    // Malformed multipart body (e.g. missing boundary, truncated stream).
    next(new HttpError(400, "INVALID_REQUEST", "The request body could not be read"));
  });
};

/** Decodes the file as UTF-8, or returns null if it isn't valid plain text. */
function decodePlainText(buffer: Buffer): string | null {
  if (buffer.includes(0)) return null;
  try {
    // fatal: throw on invalid UTF-8. The decoder also strips a leading BOM.
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

const handleSubmission: RequestHandler = (req, res) => {
  // multer gives a null-prototype object; it's empty for non-multipart requests.
  const body: Record<string, unknown> = req.body ?? {};

  const unexpected = Object.keys(body).filter(
    (key) => !(TEXT_FIELDS as readonly string[]).includes(key),
  );
  if (unexpected.length > 0) {
    throw new HttpError(400, "UNEXPECTED_FIELD", `Unexpected field(s): ${unexpected.join(", ")}`);
  }

  // A repeated field arrives as an array, so it counts as missing too.
  const missing = TEXT_FIELDS.filter((key) => typeof body[key] !== "string" || body[key] === "");
  if (missing.length > 0) {
    throw new HttpError(
      400,
      "MISSING_FIELDS",
      `Missing required field(s): ${missing.join(", ")}`,
    );
  }
  const { make, model, badge } = body as Record<(typeof TEXT_FIELDS)[number], string>;

  if (!isValidVehicle(make, model, badge)) {
    throw new HttpError(
      400,
      "INVALID_VEHICLE",
      `No vehicle matches make "${make}", model "${model}", badge "${badge}"`,
    );
  }

  const file = req.file;
  if (!file) {
    throw new HttpError(400, "MISSING_FILE", `Attach the logbook file in the "${FILE_FIELD}" field`);
  }
  if (!/\.txt$/i.test(file.originalname)) {
    throw new HttpError(400, "INVALID_FILE_TYPE", "Only .txt files are accepted");
  }
  const contents = decodePlainText(file.buffer);
  if (contents === null) {
    throw new HttpError(
      400,
      "INVALID_FILE_CONTENT",
      "The logbook must be plain text (UTF-8, no binary data)",
    );
  }
  // Checked after decoding so a file holding only a BOM also counts as empty.
  if (contents === "") {
    throw new HttpError(400, "EMPTY_FILE", "The logbook file is empty");
  }

  const response: SubmissionResponse = {
    make,
    model,
    badge,
    logbook: { fileName: file.originalname, size: file.size, contents },
  };
  res.status(200).json(response);
};

export const submissionsRouter = Router();
submissionsRouter.post("/", parseUpload, handleSubmission);
