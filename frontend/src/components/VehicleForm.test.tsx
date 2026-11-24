import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VehicleForm } from "./VehicleForm";

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
    render(<VehicleForm />);

    expect(makeSelect()).toHaveValue("");
    expect(makeSelect()).toBeEnabled();
    expect(modelSelect()).toHaveValue("");
    expect(modelSelect()).toBeDisabled();
    expect(badgeSelect()).toHaveValue("");
    expect(badgeSelect()).toBeDisabled();
  });

  it("lists every make by its display name", () => {
    render(<VehicleForm />);

    expect(optionLabels(makeSelect())).toEqual(["Ford", "BMW", "Tesla"]);
  });

  it("enables the model dropdown with that make's models once a make is chosen", () => {
    render(<VehicleForm />);

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
    render(<VehicleForm />);

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
    render(<VehicleForm />);

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
    render(<VehicleForm />);

    choose(makeSelect(), "ford");
    choose(modelSelect(), "Falcon");
    choose(badgeSelect(), "XR8");
    choose(modelSelect(), "Falcon Ute");

    expect(badgeSelect()).toHaveValue("");
    expect(optionLabels(badgeSelect())).toEqual(["XR6", "XR6 Turbo"]);
  });

  it("disables the model and badge dropdowns again when the make is cleared", () => {
    render(<VehicleForm />);

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
    render(<VehicleForm />);

    fireEvent.click(screen.getByRole("button", { name: label }));

    expect(makeSelect()).toHaveValue(make);
    expect(modelSelect()).toHaveValue(model);
    expect(modelSelect()).toBeEnabled();
    expect(badgeSelect()).toHaveValue(badge);
    expect(badgeSelect()).toBeEnabled();
  });

  it("replaces an existing selection", () => {
    render(<VehicleForm />);

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
    render(<VehicleForm />);

    fireEvent.click(screen.getByRole("button", { name: "Ford Ranger Raptor" }));
    choose(badgeSelect(), "Wildtrak");

    expect(makeSelect()).toHaveValue("ford");
    expect(modelSelect()).toHaveValue("Ranger");
    expect(badgeSelect()).toHaveValue("Wildtrak");
  });

  it("uses non-submitting buttons", () => {
    render(<VehicleForm />);

    for (const button of within(
      screen.getByRole("group", { name: "Quick select" }),
    ).getAllByRole("button")) {
      expect(button).toHaveAttribute("type", "button");
    }
  });
});
