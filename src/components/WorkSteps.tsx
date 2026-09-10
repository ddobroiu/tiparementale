import type { Transformation } from "@/lib/types";

/**
 * Drumul unei convingeri, în patru bife: confirmată → convingere nouă →
 * exersată → rezolvată. Bifele se pun singure din starea reală, nu dintr-o
 * declarație — dar arată clar ce urmează și unde se apasă.
 */
export function WorkSteps({
  confirmed,
  transformation,
}: {
  confirmed: boolean;
  transformation: Transformation | null;
}) {
  const status = transformation?.status ?? null;
  const steps = [
    { label: "Confirmată", done: confirmed, hint: "Spui că e adevărat." },
    { label: "Convingere nouă", done: Boolean(transformation), hint: "Apasă „Lucrăm la asta”." },
    {
      label: "O exersez",
      done: status === "practicing" || status === "adopted",
      hint: "Exerciții, bifate pe măsură ce le faci.",
    },
    { label: "Rezolvată", done: status === "adopted", hint: "Devine verde pe hartă." },
  ];
  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <ol className="mt-4 grid grid-cols-4 gap-1">
      {steps.map((step, i) => {
        const isNext = i === nextIndex;
        return (
          <li key={step.label} className="flex flex-col items-center text-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                step.done
                  ? "border-[color:var(--value)] bg-[color:var(--value)] text-ink"
                  : isNext
                    ? "border-paper text-paper"
                    : "border-ink-line text-paper-faint"
              }`}
              aria-hidden="true"
            >
              {step.done ? "✓" : i + 1}
            </span>
            <span
              className={`mt-1.5 text-[10px] leading-tight ${
                step.done ? "text-[color:var(--value)]" : isNext ? "text-paper" : "text-paper-faint"
              }`}
            >
              {step.label}
            </span>
            {isNext && (
              <span className="mt-0.5 text-[9px] leading-tight text-paper-faint">{step.hint}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
