import { createRequire } from "node:module";

/** make id → model name → badge names */
export type VehicleData = Record<string, Record<string, string[]>>;

// Loaded with require rather than `import … with { type: "json" }`, which
// prints an "experimental feature" warning on Node 20.
const require = createRequire(import.meta.url);
export const vehicles: VehicleData = require("@vehicle-selection/shared/vehicles.json");

/**
 * True when the badge exists under that make and model.
 * Uses Object.hasOwn so names like "constructor" or "__proto__" are never
 * mistaken for vehicles via the object prototype.
 */
export function isValidVehicle(make: string, model: string, badge: string): boolean {
  if (!Object.hasOwn(vehicles, make)) return false;
  const models = vehicles[make];
  if (!Object.hasOwn(models, model)) return false;
  return models[model].includes(badge);
}
