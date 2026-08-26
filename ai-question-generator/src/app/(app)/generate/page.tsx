import { Suspense } from "react";
import GenerateWizard from "./GenerateWizard";

export default function GeneratePage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading...</p>}>
      <GenerateWizard />
    </Suspense>
  );
}
