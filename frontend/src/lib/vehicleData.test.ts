import { describe, expect, it } from "vitest";
import {
  getBadges,
  getMakeLabel,
  getMakes,
  getModels,
  quickSelectPresets,
} from "./vehicleData";

describe("getMakes", () => {
  it("returns make ids in dataset order", () => {
    expect(getMakes()).toEqual(["ford", "bmw", "tesla"]);
  });
});

describe("getModels", () => {
  it("returns the models for a make", () => {
    expect(getModels("ford")).toEqual(["Ranger", "Falcon", "Falcon Ute"]);
    expect(getModels("tesla")).toEqual(["Model 3"]);
  });

  it.each(["", "holden", "Ford", "constructor", "__proto__"])(
    "returns no models for %j",
    (make) => {
      expect(getModels(make)).toEqual([]);
    },
  );
});

describe("getBadges", () => {
  it("returns the badges for a make and model", () => {
    expect(getBadges("ford", "Falcon")).toEqual(["XR6", "XR6 Turbo", "XR8"]);
    expect(getBadges("ford", "Falcon Ute")).toEqual(["XR6", "XR6 Turbo"]);
  });

  it("returns no badges when the model belongs to another make", () => {
    expect(getBadges("bmw", "Ranger")).toEqual([]);
  });

  it.each([
    ["", ""],
    ["ford", ""],
    ["holden", "Commodore"],
    ["ford", "constructor"],
  ])("returns no badges for %j / %j", (make, model) => {
    expect(getBadges(make, model)).toEqual([]);
  });
});

describe("getMakeLabel", () => {
  it("returns display names for every make in the dataset", () => {
    expect(getMakes().map(getMakeLabel)).toEqual(["Ford", "BMW", "Tesla"]);
  });

  it("falls back to the id for an unknown make", () => {
    expect(getMakeLabel("holden")).toBe("holden");
    expect(getMakeLabel("constructor")).toBe("constructor");
  });
});

describe("quickSelectPresets", () => {
  it("has at least two presets", () => {
    expect(quickSelectPresets.length).toBeGreaterThanOrEqual(2);
  });

  it.each(quickSelectPresets)(
    "$make / $model / $badge exists in the dataset",
    ({ make, model, badge }) => {
      expect(getBadges(make, model)).toContain(badge);
    },
  );
});
