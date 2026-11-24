import { useState } from "react";
import { SubmissionResult } from "./components/SubmissionResult";
import { VehicleForm } from "./components/VehicleForm";
import type { Submission } from "./lib/api";

export default function App() {
  const [result, setResult] = useState<Submission | null>(null);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Vehicle Selection Form</h1>
        <p>Choose a vehicle, then upload its logbook as a .txt file.</p>
      </header>
      {/* Clearing the result remounts VehicleForm, so it starts empty. */}
      {result ? (
        <SubmissionResult result={result} onNewSubmission={() => setResult(null)} />
      ) : (
        <VehicleForm onSubmitted={setResult} />
      )}
    </main>
  );
}
