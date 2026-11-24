import { useEffect, useId, useRef } from "react";
import type { Submission } from "../lib/api";
import { getMakeLabel } from "../lib/vehicleData";

interface SubmissionResultProps {
  result: Submission;
  onNewSubmission: () => void;
}

/** Shows what the backend returned. Focuses its heading when it appears. */
export function SubmissionResult({ result, onNewSubmission }: SubmissionResultProps) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="card result" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} ref={headingRef} tabIndex={-1}>
        Submission received
      </h2>

      <dl className="result-details">
        <dt>Make</dt>
        <dd>{getMakeLabel(result.make)}</dd>
        <dt>Model</dt>
        <dd>{result.model}</dd>
        <dt>Badge</dt>
        <dd>{result.badge}</dd>
      </dl>

      <p className="result-label">Logbook:</p>
      {/* <pre> keeps the file's whitespace and line breaks; CSS wraps long lines. */}
      <pre className="logbook-text">{result.logbook.contents}</pre>

      <button className="button button-primary" type="button" onClick={onNewSubmission}>
        New Submission
      </button>
    </section>
  );
}
