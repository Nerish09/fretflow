import { Suspense } from "react";

import PracticeClient from "./PracticeClient";


export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeLoading />}>
      <PracticeClient />
    </Suspense>
  );
}


function PracticeLoading() {
  return (
    <div className="studio-app">
      <main className="practice-loading">
        <p>Loading practice room...</p>
      </main>
    </div>
  );
}