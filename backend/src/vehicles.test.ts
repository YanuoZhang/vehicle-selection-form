import { describe, expect, it } from "vitest";
import { isValidVehicle, vehicles } from "./vehicles.js";

describe("vehicles", () => {
  it("loads the shared dataset", () => {
    expect(Object.keys(vehicles)).toEqual(["ford", "bmw", "tesla"]);
    expect(vehicles.ford.Ranger).toEqual(["Raptor", "Raptor X", "Wildtrak"]);
  });
});

describe("isValidVehicle", () => {
  it.each([
    ["ford", "Ranger", "Raptor X"],
    ["ford", "Falcon Ute", "XR6 Turbo"],
    ["bmw", "240i", "xDrive 50d"],
    ["tesla", "Model 3", "Dual Motor"],
  ])("accepts %s / %s / %s", (make, model, badge) => {
    expect(isValidVehicle(make, model, badge)).toBe(true);
  });

  it("checks the badge against the selected model, not just any model", () => {
    // XR8 exists under Falcon but not Falcon Ute
    expect(isValidVehicle("ford", "Falcon", "XR8")).toBe(true);
    expect(isValidVehicle("ford", "Falcon Ute", "XR8")).toBe(false);
    // xDrive 26d exists under 130d but not 240i
    expect(isValidVehicle("bmw", "130d", "xDrive 26d")).toBe(true);
    expect(isValidVehicle("bmw", "240i", "xDrive 26d")).toBe(false);
  });

  it("rejects a model from a different make", () => {
    expect(isValidVehicle("bmw", "Ranger", "Raptor")).toBe(false);
  });

  it.each([
    ["unknown make", "holden", "Commodore", "SS"],
    ["unknown model", "ford", "Mustang", "GT"],
    ["unknown badge", "ford", "Ranger", "XLT"],
    ["empty values", "", "", ""],
  ])("rejects %s", (_case, make, model, badge) => {
    expect(isValidVehicle(make, model, badge)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidVehicle("Ford", "Ranger", "Raptor")).toBe(false);
    expect(isValidVehicle("ford", "ranger", "Raptor")).toBe(false);
    expect(isValidVehicle("ford", "Ranger", "raptor")).toBe(false);
  });

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "rejects inherited property name %s",
    (name) => {
      expect(isValidVehicle(name, "Ranger", "Raptor")).toBe(false);
      expect(isValidVehicle("ford", name, "Raptor")).toBe(false);
    },
  );
});
