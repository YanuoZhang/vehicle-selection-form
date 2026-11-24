import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { submitVehicle, SubmissionError, type Submission } from "../lib/api";
import { MAX_LOGBOOK_BYTES } from "../lib/logbook";
import { VehicleForm } from "./VehicleForm";

vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  submitVehicle: vi.fn(),
}));
const submitMock = vi.mocked(submitVehicle);

afterEach(() => {
  submitMock.mockReset();
});

function renderForm() {
  const onSubmitted = vi.fn<(result: Submission) => void>();
  render(<VehicleForm onSubmitted={onSubmitted} />);
  return { onSubmitted };
}

function makeSelect() {
  return screen.getByRole<HTMLSelectElement>("combobox", { name: "Make" });
}
function modelSelect() {
  return screen.getByRole<HTMLSelectElement>("combobox", { name: "Model" });
}
function badgeSelect() {
  return screen.getByRole<HTMLSelectElement>("combobox", { name: "Badge" });
}

/** Visible text of the real (non-placeholder) options. */
function optionLabels(select: HTMLSelectElement) {
  return within(select)
    .getAllByRole<HTMLOptionElement>("option")
    .filter((option) => option.value !== "")
    .map((option) => option.textContent);
}

function choose(select: HTMLSelectElement, value: string) {
  fireEvent.change(select, { target: { value } });
}

describe("vehicle dropdowns", () => {
  it("starts with nothing selected and only the make dropdown enabled", () => {
    renderForm();

    expect(makeSelect()).toHaveValue("");
    expect(makeSelect()).toBeEnabled();
    expect(modelSelect()).toHaveValue("");
    expect(modelSelect()).toBeDisabled();
    expect(badgeSelect()).toHaveValue("");
    expect(badgeSelect()).toBeDisabled();
  });

  it("lists every make by its display name", () => {
    renderForm();

    expect(optionLabels(makeSelect())).toEqual(["Ford", "BMW", "Tesla"]);
  });

  it("enables the model dropdown with that make's models once a make is chosen", () => {
    renderForm();

    choose(makeSelect(), "ford");

    expect(modelSelect()).toBeEnabled();
    expect(optionLabels(modelSelect())).toEqual([
      "Ranger",
      "Falcon",
      "Falcon Ute",
    ]);
    expect(badgeSelect()).toBeDisabled();
  });

  it("enables the badge dropdown with that model's badges once a model is chosen", () => {
    renderForm();

    choose(makeSelect(), "ford");
    choose(modelSelect(), "Falcon Ute");

    expect(badgeSelect()).toBeEnabled();
    expect(optionLabels(badgeSelect())).toEqual(["XR6", "XR6 Turbo"]);

    choose(badgeSelect(), "XR6 Turbo");

    expect(makeSelect()).toHaveValue("ford");
    expect(modelSelect()).toHaveValue("Falcon Ute");
    expect(badgeSelect()).toHaveValue("XR6 Turbo");
  });

  it("clears the model and badge when the make changes", () => {
    renderForm();

    choose(makeSelect(), "ford");
    choose(modelSelect(), "Ranger");
    choose(badgeSelect(), "Raptor");
    choose(makeSelect(), "bmw");

    expect(modelSelect()).toHaveValue("");
    expect(optionLabels(modelSelect())).toEqual(["130d", "240i", "320e"]);
    expect(badgeSelect()).toHaveValue("");
    expect(badgeSelect()).toBeDisabled();
  });

  it("clears the badge when the model changes", () => {
    renderForm();

    choose(makeSelect(), "ford");
    choose(modelSelect(), "Falcon");
    choose(badgeSelect(), "XR8");
    choose(modelSelect(), "Falcon Ute");

    expect(badgeSelect()).toHaveValue("");
    expect(optionLabels(badgeSelect())).toEqual(["XR6", "XR6 Turbo"]);
  });

  it("disables the model and badge dropdowns again when the make is cleared", () => {
    renderForm();

    choose(makeSelect(), "tesla");
    choose(modelSelect(), "Model 3");
    choose(makeSelect(), "");

    expect(modelSelect()).toHaveValue("");
    expect(modelSelect()).toBeDisabled();
    expect(badgeSelect()).toHaveValue("");
    expect(badgeSelect()).toBeDisabled();
  });
});

describe("quick select", () => {
  it.each([
    ["Ford Ranger Raptor", "ford", "Ranger", "Raptor"],
    ["BMW 320e xDrive 75d", "bmw", "320e", "xDrive 75d"],
    ["Tesla Model 3 Long Range", "tesla", "Model 3", "Long Range"],
  ])("%s fills in all three dropdowns", (label, make, model, badge) => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: label }));

    expect(makeSelect()).toHaveValue(make);
    expect(modelSelect()).toHaveValue(model);
    expect(modelSelect()).toBeEnabled();
    expect(badgeSelect()).toHaveValue(badge);
    expect(badgeSelect()).toBeEnabled();
  });

  it("replaces an existing selection", () => {
    renderForm();

    choose(makeSelect(), "ford");
    choose(modelSelect(), "Falcon");
    choose(badgeSelect(), "XR8");
    fireEvent.click(
      screen.getByRole("button", { name: "Tesla Model 3 Long Range" }),
    );

    expect(makeSelect()).toHaveValue("tesla");
    expect(modelSelect()).toHaveValue("Model 3");
    expect(badgeSelect()).toHaveValue("Long Range");
  });

  it("leaves the dropdowns editable afterwards", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Ford Ranger Raptor" }));
    choose(badgeSelect(), "Wildtrak");

    expect(makeSelect()).toHaveValue("ford");
    expect(modelSelect()).toHaveValue("Ranger");
    expect(badgeSelect()).toHaveValue("Wildtrak");
  });

  it("uses non-submitting buttons", () => {
    renderForm();

    for (const button of within(
      screen.getByRole("group", { name: "Quick select" }),
    ).getAllByRole("button")) {
      expect(button).toHaveAttribute("type", "button");
    }
  });
});

function logbookInput() {
  return screen.getByLabelText<HTMLInputElement>("Logbook (.txt, up to 1 MB)");
}
function submitButton() {
  return screen.getByRole("button", { name: /^Submit/ });
}
function querySubmitButton() {
  return screen.queryByRole("button", { name: /^Submit/ });
}

function textFile(name: string, contents = "Serviced 2024") {
  return new File([contents], name, { type: "text/plain" });
}

function upload(file: File | null) {
  fireEvent.change(logbookInput(), { target: { files: file ? [file] : [] } });
}

function fillInValidForm(file = textFile("logbook.txt")) {
  fireEvent.click(screen.getByRole("button", { name: "Ford Ranger Raptor" }));
  upload(file);
  return file;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const submission: Submission = {
  make: "ford",
  model: "Ranger",
  badge: "Raptor",
  logbook: { fileName: "logbook.txt", size: 13, contents: "Serviced 2024" },
};

describe("logbook upload", () => {
  it("accepts a single .txt file and shows its name and size", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Ford Ranger Raptor" }));

    expect(logbookInput()).toHaveAttribute("type", "file");
    expect(logbookInput()).not.toHaveAttribute("multiple");
    upload(textFile("LOGBOOK.TXT"));

    expect(screen.getByText("Selected: LOGBOOK.TXT (13 bytes)")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("describes the file input with the current file status", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Ford Ranger Raptor" }));

    expect(logbookInput()).toHaveAccessibleDescription("No file selected");

    upload(textFile("logbook.txt"));

    expect(logbookInput()).toHaveAccessibleDescription(
      "Selected: logbook.txt (13 bytes)",
    );
  });

  it("rejects a file that isn't .txt", () => {
    renderForm();

    fillInValidForm(textFile("logbook.pdf"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only .txt files are accepted",
    );
    expect(logbookInput()).toHaveAccessibleDescription(
      "Only .txt files are accepted",
    );
    expect(submitButton()).toBeDisabled();
  });

  it("rejects a file over 1 MB", () => {
    renderForm();

    fillInValidForm(textFile("big.txt", "a".repeat(MAX_LOGBOOK_BYTES + 1)));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The logbook must be 1 MB or smaller",
    );
    expect(submitButton()).toBeDisabled();
  });

  it("clears the error when a valid file replaces an invalid one", () => {
    renderForm();

    fillInValidForm(textFile("logbook.pdf"));
    upload(textFile("logbook.txt"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("discards a previously valid file when an invalid one is selected", () => {
    renderForm();

    fillInValidForm(textFile("logbook.txt"));
    expect(submitButton()).toBeEnabled();
    upload(textFile("logbook.pdf"));

    expect(screen.queryByText(/^Selected:/)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Only .txt files are accepted");
    expect(submitButton()).toBeDisabled();
  });

  it("forgets the file when the selection is cleared", () => {
    renderForm();

    fillInValidForm();
    upload(null);

    expect(screen.queryByText(/^Selected:/)).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });
});

describe("conditional logbook upload and Submit", () => {
  function queryLogbookInput() {
    return screen.queryByLabelText("Logbook (.txt, up to 1 MB)");
  }

  function expectHidden() {
    expect(queryLogbookInput()).not.toBeInTheDocument();
    expect(querySubmitButton()).not.toBeInTheDocument();
  }

  it("are hidden until make, model and badge are all chosen", () => {
    renderForm();
    expectHidden();

    choose(makeSelect(), "ford");
    expectHidden();

    choose(modelSelect(), "Ranger");
    expectHidden();

    choose(badgeSelect(), "Raptor");
    expect(queryLogbookInput()).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("appear immediately after a quick select, with Submit disabled until a file is chosen", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "BMW 320e xDrive 75d" }));

    expect(queryLogbookInput()).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it.each([
    ["the make changes", () => choose(makeSelect(), "tesla")],
    ["the make is cleared", () => choose(makeSelect(), "")],
    ["the model changes", () => choose(modelSelect(), "Falcon")],
    ["the badge is cleared", () => choose(badgeSelect(), "")],
  ])("hide again when %s", (_case, makeIncomplete) => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Ford Ranger Raptor" }));

    makeIncomplete();

    expectHidden();
  });

  it("keeps a valid file while hidden and submits it once the vehicle is complete again", async () => {
    submitMock.mockResolvedValue(submission);
    const { onSubmitted } = renderForm();
    const file = fillInValidForm();

    choose(modelSelect(), "Falcon");
    expectHidden();

    choose(badgeSelect(), "XR8");
    // The new file input is empty, so the status text is what reports the kept file.
    expect(logbookInput()).toHaveAccessibleDescription(
      "Selected: logbook.txt (13 bytes)",
    );
    expect(submitButton()).toBeEnabled();

    fireEvent.click(submitButton());
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(submitMock).toHaveBeenCalledWith(
      { make: "ford", model: "Falcon", badge: "XR8" },
      file,
    );
  });
});

describe("submission", () => {
  it("keeps Submit disabled until both the vehicle and the file are valid", () => {
    renderForm();
    expect(querySubmitButton()).not.toBeInTheDocument();

    choose(makeSelect(), "ford");
    choose(modelSelect(), "Ranger");
    expect(querySubmitButton()).not.toBeInTheDocument();

    choose(badgeSelect(), "Raptor");
    expect(submitButton()).toHaveAttribute("type", "submit");
    expect(submitButton()).toBeDisabled();

    upload(textFile("logbook.txt"));
    expect(submitButton()).toBeEnabled();

    choose(makeSelect(), "bmw");
    expect(querySubmitButton()).not.toBeInTheDocument();
  });

  it("sends the selected vehicle and file and reports the result", async () => {
    submitMock.mockResolvedValue(submission);
    const { onSubmitted } = renderForm();

    const file = fillInValidForm();
    fireEvent.click(submitButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(submission));
    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock).toHaveBeenCalledWith(
      { make: "ford", model: "Ranger", badge: "Raptor" },
      file,
    );
  });

  it("does not submit again while a request is in progress", async () => {
    const request = deferred<Submission>();
    submitMock.mockReturnValue(request.promise);
    const { onSubmitted } = renderForm();

    fillInValidForm();
    const form = submitButton().closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveTextContent("Submitting…");

    request.resolve(submission);
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it("shows the API error and lets the user retry", async () => {
    submitMock
      .mockRejectedValueOnce(
        new SubmissionError("The logbook file is empty", "EMPTY_FILE", 400),
      )
      .mockResolvedValueOnce(submission);
    const { onSubmitted } = renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Submission failed: The logbook file is empty",
    );
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(submitButton()).toBeEnabled();
    expect(submitButton()).toHaveTextContent("Submit");

    fireEvent.click(submitButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(submission));
    expect(submitMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a network error", async () => {
    submitMock.mockRejectedValue(
      new SubmissionError(
        "Couldn't reach the server. Check your connection and try again.",
        "NETWORK_ERROR",
      ),
    );
    renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach the server. Check your connection and try again.",
    );
    expect(submitButton()).toBeEnabled();
  });

  it("shows a generic message for an unexpected error", async () => {
    submitMock.mockRejectedValue(new Error("boom"));
    renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Submission failed: Something went wrong. Please try again.",
    );
  });

  it("clears the submission error when the vehicle changes", async () => {
    submitMock.mockRejectedValue(
      new SubmissionError("Server error", "INTERNAL_ERROR", 500),
    );
    renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());
    await screen.findByRole("alert");

    choose(badgeSelect(), "Wildtrak");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("while submitting", () => {
  function controls() {
    return [
      makeSelect(),
      modelSelect(),
      badgeSelect(),
      logbookInput(),
      ...within(screen.getByRole("group", { name: "Quick select" })).getAllByRole(
        "button",
      ),
    ];
  }

  it("disables every input and keeps the submitted values", async () => {
    const request = deferred<Submission>();
    submitMock.mockReturnValue(request.promise);
    renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());

    for (const control of controls()) expect(control).toBeDisabled();
    expect(makeSelect()).toHaveValue("ford");
    expect(modelSelect()).toHaveValue("Ranger");
    expect(badgeSelect()).toHaveValue("Raptor");
    expect(screen.getByText("Selected: logbook.txt (13 bytes)")).toBeInTheDocument();

    request.resolve(submission);
    await waitFor(() => expect(submitButton()).toHaveTextContent(/^Submit$/));
  });

  it("makes the inputs editable again after a failed request", async () => {
    const request = deferred<Submission>();
    submitMock.mockReturnValue(request.promise);
    renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());
    request.reject(new SubmissionError("Server error", "INTERNAL_ERROR", 500));
    await screen.findByRole("alert");

    for (const control of controls()) expect(control).toBeEnabled();
    choose(badgeSelect(), "Wildtrak");
    expect(badgeSelect()).toHaveValue("Wildtrak");
  });

  it("allows another submission after a successful one", async () => {
    submitMock.mockResolvedValue(submission);
    const { onSubmitted } = renderForm();

    fillInValidForm();
    fireEvent.click(submitButton());
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));

    for (const control of controls()) expect(control).toBeEnabled();
    expect(submitButton()).toBeEnabled();
    fireEvent.click(submitButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(2));
    expect(submitMock).toHaveBeenCalledTimes(2);
  });
});
