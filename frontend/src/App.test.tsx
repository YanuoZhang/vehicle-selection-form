import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { submitVehicle, type Submission } from "./lib/api";

vi.mock("./lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./lib/api")>()),
  submitVehicle: vi.fn(),
}));
const submitMock = vi.mocked(submitVehicle);

afterEach(() => {
  submitMock.mockReset();
});

const submission: Submission = {
  make: "tesla",
  model: "Model 3",
  badge: "Long Range",
  logbook: { fileName: "logbook.txt", size: 13, contents: "Serviced 2024" },
};

function makeSelect() {
  return screen.getByRole("combobox", { name: "Make" });
}

async function submitValidForm() {
  submitMock.mockResolvedValue(submission);
  fireEvent.click(
    screen.getByRole("button", { name: "Tesla Model 3 Long Range" }),
  );
  fireEvent.change(screen.getByLabelText("Logbook (.txt, up to 1 MB)"), {
    target: { files: [new File(["Serviced 2024"], "logbook.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  return screen.findByRole("heading", { name: "Submission received" });
}

describe("App", () => {
  it("renders the page heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Vehicle Selection Form" }),
    ).toBeInTheDocument();
  });

  it("renders the vehicle form", () => {
    render(<App />);

    expect(screen.getByRole("combobox", { name: "Make" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Quick select" }),
    ).toBeInTheDocument();
  });

  it("replaces the form with the result after a successful submission", async () => {
    render(<App />);

    const heading = await submitValidForm();

    // Focus moves in an effect, which can run just after the heading appears.
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.queryByRole("combobox", { name: "Make" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(screen.getByText("Long Range")).toBeInTheDocument();
    expect(screen.getByText("Serviced 2024")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Vehicle Selection Form" }),
    ).toBeInTheDocument();
  });

  it("returns to a fresh, empty form from New Submission", async () => {
    render(<App />);
    await submitValidForm();

    fireEvent.click(screen.getByRole("button", { name: "New Submission" }));

    expect(
      screen.queryByRole("heading", { name: "Submission received" }),
    ).not.toBeInTheDocument();
    expect(makeSelect()).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Model" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Badge" })).toBeDisabled();
    expect(screen.queryByText(/^Selected:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(submitMock).toHaveBeenCalledTimes(1);
  });
});
