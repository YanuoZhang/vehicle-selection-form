import data from "@vehicle-selection/shared/vehicles.json";

/** make id → model name → badge names */
export type VehicleData = Record<string, Record<string, string[]>>;

export interface VehicleSelection {
  make: string;
  model: string;
  badge: string;
}

export const vehicles: VehicleData = data;

// Make ids in the dataset are lowercase; these are the names shown to users.
const makeLabels: Record<string, string> = {
  ford: "Ford",
  bmw: "BMW",
  tesla: "Tesla",
};

export function getMakeLabel(make: string): string {
  return Object.hasOwn(makeLabels, make) ? makeLabels[make] : make;
}

export function getMakes(): string[] {
  return Object.keys(vehicles);
}

export function getModels(make: string): string[] {
  return Object.hasOwn(vehicles, make) ? Object.keys(vehicles[make]) : [];
}

export function getBadges(make: string, model: string): string[] {
  if (!Object.hasOwn(vehicles, make)) return [];
  const models = vehicles[make];
  return Object.hasOwn(models, model) ? models[model] : [];
}

export const quickSelectPresets: VehicleSelection[] = [
  { make: "ford", model: "Ranger", badge: "Raptor" },
  { make: "bmw", model: "320e", badge: "xDrive 75d" },
  { make: "tesla", model: "Model 3", badge: "Long Range" },
];
