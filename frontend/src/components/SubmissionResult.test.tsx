import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Submission } from "../lib/api";
import { SubmissionResult } from "./SubmissionResult";

const contents = "2024-03-01  Oil change\n2024-09-12  Brake pads\n\n  Indented note";

const result: Submission = {
  make: "bmw",
  model: "320e",
  badge: "xDrive 75d",
  logbook: { fileName: "service-log.TXT", size: 2048, contents },
};

function renderResult() {
  const onNewSubmission = vi.fn();
  render(<SubmissionResult result={result} onNewSubmission={onNewSubmission} />);
  return { onNewSubmission };
}

/** The <dd> value for a <dt> term. */
function detail(term: string) {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling;
}

describe("SubmissionResult", () => {
  it("shows the vehicle returned by the backend", () => {
    renderResult();

    expect(detail("Make")).toHaveTextContent("BMW");
    expect(detail("Model")).toHaveTextContent("320e");
    expect(detail("Badge")).toHaveTextContent("xDrive 75d");
  });

  it("shows the logbook text under a Logbook: label, keeping line breaks and spacing", () => {
    renderResult();

    const text = screen.getByText("Logbook:").nextElementSibling;
    expect(text?.tagName).toBe("PRE");
    expect(text?.textContent).toBe(contents);
  });

  it("does not show the file name, size or a contents heading", () => {
    renderResult();

    expect(screen.queryByText("File", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Size", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("service-log.TXT")).not.toBeInTheDocument();
    expect(screen.queryByText("2.0 KB")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Logbook contents" }),
    ).not.toBeInTheDocument();
  });

  it("moves focus to the result heading", () => {
    renderResult();

    expect(
      screen.getByRole("heading", { name: "Submission received" }),
    ).toHaveFocus();
  });

  it("calls onNewSubmission from the New Submission button", () => {
    const { onNewSubmission } = renderResult();

    const button = screen.getByRole("button", { name: "New Submission" });
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);

    expect(onNewSubmission).toHaveBeenCalledTimes(1);
  });
});
