import { useRef, useState, type FormEvent } from "react";
import { LogbookUpload } from "./LogbookUpload";
import { QuickSelect } from "./QuickSelect";
import { VehicleSelector } from "./VehicleSelector";
import { submitVehicle, SubmissionError, type Submission } from "../lib/api";
import { validateLogbook } from "../lib/logbook";
import { emptySelection, getBadges, type VehicleSelection } from "../lib/vehicleData";

interface VehicleFormProps {
  onSubmitted: (result: Submission) => void;
}

/** Owns the form state: vehicle, logbook file, submitting flag and errors. */
export function VehicleForm({ onSubmitted }: VehicleFormProps) {
  const [vehicle, setVehicle] = useState<VehicleSelection>(emptySelection);
  const [logbook, setLogbook] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Blocks a second submit before the `submitting` re-render lands.
  const inFlight = useRef(false);

  const vehicleComplete = getBadges(vehicle.make, vehicle.model).includes(vehicle.badge);
  const canSubmit = vehicleComplete && logbook !== null && !submitting;

  function changeVehicle(next: VehicleSelection) {
    setVehicle(next);
    setSubmitError(null);
  }

  function changeLogbook(file: File | null) {
    const error = file && validateLogbook(file);
    setLogbook(error ? null : file);
    setFileError(error);
    setSubmitError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vehicleComplete || !logbook || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    let result: Submission;
    try {
      result = await submitVehicle(vehicle, logbook);
    } catch (err) {
      setSubmitError(
        err instanceof SubmissionError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      return;
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
    // Outside the try, so an error in the callback isn't shown as a failed submission.
    onSubmitted(result);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* A disabled fieldset disables every control inside it while the request runs. */}
      <fieldset disabled={submitting}>
        <QuickSelect onSelect={changeVehicle} />
        <VehicleSelector value={vehicle} onChange={changeVehicle} />
        <LogbookUpload file={logbook} error={fileError} onChange={changeLogbook} />

        {submitError !== null && <p role="alert">Submission failed: {submitError}</p>}

        <button type="submit" disabled={!canSubmit}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </fieldset>
    </form>
  );
}
