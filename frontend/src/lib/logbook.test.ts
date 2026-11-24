import { describe, expect, it } from "vitest";
import { MAX_LOGBOOK_BYTES, validateLogbook } from "./logbook";

function fileOfSize(name: string, size: number) {
  return new File(["a".repeat(size)], name, { type: "text/plain" });
}

describe("validateLogbook", () => {
  it.each(["logbook.txt", "LOGBOOK.TXT", "notes.Txt", "my.service.log.txt"])(
    "accepts %j",
    (name) => {
      expect(validateLogbook(fileOfSize(name, 10))).toBeNull();
    },
  );

  it.each(["logbook.pdf", "logbook.txt.exe", "logbook", "txt", "logbook.text"])(
    "rejects %j as the wrong type",
    (name) => {
      expect(validateLogbook(fileOfSize(name, 10))).toBe(
        "Only .txt files are accepted",
      );
    },
  );

  it("accepts a file of exactly 1 MB", () => {
    expect(validateLogbook(fileOfSize("big.txt", MAX_LOGBOOK_BYTES))).toBeNull();
  });

  it("rejects a file over 1 MB", () => {
    expect(validateLogbook(fileOfSize("big.txt", MAX_LOGBOOK_BYTES + 1))).toBe(
      "The logbook must be 1 MB or smaller",
    );
  });
});
