import { useState } from "react";
import { VehicleForm } from "./components/VehicleForm";
import type { Submission } from "./lib/api";

export default function App() {
  // Task 5 will switch to the Result view once a submission succeeds.
  const [, setResult] = useState<Submission | null>(null);

  return (
    <main>
      <h1>Vehicle Selection Form</h1>
      <VehicleForm onSubmitted={setResult} />
    </main>
  );
}
