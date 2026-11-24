import { useState } from "react";
import { QuickSelect } from "./QuickSelect";
import { VehicleSelector } from "./VehicleSelector";
import { emptySelection, type VehicleSelection } from "../lib/vehicleData";

/** Owns the form state. Task 3: the vehicle selection only. */
export function VehicleForm() {
  const [vehicle, setVehicle] = useState<VehicleSelection>(emptySelection);

  return (
    <form>
      <QuickSelect onSelect={setVehicle} />
      <VehicleSelector value={vehicle} onChange={setVehicle} />
    </form>
  );
}
