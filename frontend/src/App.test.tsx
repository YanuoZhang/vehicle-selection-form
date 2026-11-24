import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

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
});
