import { useState } from "react";
import { SubmissionResult } from "./components/SubmissionResult";
import { VehicleForm } from "./components/VehicleForm";
import type { Submission } from "./lib/api";

export default function App() {
  const [result, setResult] = useState<Submission | null>(null);

  return (
    <main>
      <h1>Vehicle Selection Form</h1>
      {/* Clearing the result remounts VehicleForm, so it starts empty. */}
      {result ? (
        <SubmissionResult result={result} onNewSubmission={() => setResult(null)} />
      ) : (
        <VehicleForm onSubmitted={setResult} />
      )}
    </main>
  );
}
