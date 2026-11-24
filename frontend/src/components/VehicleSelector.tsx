import { useId } from "react";
import {
  getBadges,
  getMakeLabel,
  getMakes,
  getModels,
  type VehicleSelection,
} from "../lib/vehicleData";

interface VehicleSelectorProps {
  value: VehicleSelection;
  onChange: (value: VehicleSelection) => void;
}

/**
 * Make → model → badge dropdowns. Controlled: the parent owns the selection.
 * Changing a dropdown clears the ones after it.
 */
export function VehicleSelector({ value, onChange }: VehicleSelectorProps) {
  const id = useId();
  const models = getModels(value.make);
  const badges = getBadges(value.make, value.model);

  return (
    <fieldset className="group">
      <legend>Vehicle</legend>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-make`}>Make</label>
          <select
            id={`${id}-make`}
            value={value.make}
            onChange={(e) => onChange({ make: e.target.value, model: "", badge: "" })}
          >
            <option value="">Select a make</option>
            {getMakes().map((make) => (
              <option key={make} value={make}>
                {getMakeLabel(make)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-model`}>Model</label>
          <select
            id={`${id}-model`}
            value={value.model}
            disabled={models.length === 0}
            onChange={(e) => onChange({ ...value, model: e.target.value, badge: "" })}
          >
            <option value="">Select a model</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${id}-badge`}>Badge</label>
          <select
            id={`${id}-badge`}
            value={value.badge}
            disabled={badges.length === 0}
            onChange={(e) => onChange({ ...value, badge: e.target.value })}
          >
            <option value="">Select a badge</option>
            {badges.map((badge) => (
              <option key={badge} value={badge}>
                {badge}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  );
}
