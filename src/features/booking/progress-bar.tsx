import { useBooking } from "./booking-context";

export function ProgressBar() {
  const { stepIndex, totalSteps, state } = useBooking();
  // Don't show on intent or confirmation
  if (state.step === "intent" || state.step === "confirmation") return null;
  const pct = ((stepIndex + 1) / totalSteps) * 100;
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-neutral-200 z-50">
      <div
        className="h-full bg-brand transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
