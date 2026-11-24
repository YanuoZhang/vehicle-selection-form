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
    <fieldset className="group">
      <legend>Quick select</legend>
      <div className="quick-select-options">
        {quickSelectPresets.map((preset) => {
          const label = `${getMakeLabel(preset.make)} ${preset.model} ${preset.badge}`;
          return (
            <button
              key={label}
              className="button button-secondary"
              type="button"
              onClick={() => onSelect(preset)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
