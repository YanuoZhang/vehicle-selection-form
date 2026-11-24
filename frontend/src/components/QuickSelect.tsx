import {
  getMakeLabel,
  quickSelectPresets,
  type VehicleSelection,
} from "../lib/vehicleData";

interface QuickSelectProps {
  onSelect: (vehicle: VehicleSelection) => void;
}

/** One button per preset; clicking one reports that full selection. */
export function QuickSelect({ onSelect }: QuickSelectProps) {
  return (
    <fieldset>
      <legend>Quick select</legend>
      {quickSelectPresets.map((preset) => {
        const label = `${getMakeLabel(preset.make)} ${preset.model} ${preset.badge}`;
        return (
          <button key={label} type="button" onClick={() => onSelect(preset)}>
            {label}
          </button>
        );
      })}
    </fieldset>
  );
}
