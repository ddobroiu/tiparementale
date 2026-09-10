"use client";

import { useEffect, useRef, useState } from "react";

import { LandingMap } from "./LandingMap";

const STEPS = [
  {
    n: "01",
    title: "Identificare",
    body:
      "O ședință pe o temă ghidată: casa în care ai crescut, părinții, banii, " +
      "relațiile, munca, rolul de părinte. Răspunzi liber sau alegi dintre " +
      "variante. Din ce povestești, harta se umple cu convingeri, frici, valori " +
      "și tipare.",
    aside: "Fiecare element păstrează citatul exact din care a fost dedus.",
  },
  {
    n: "02",
    title: "Interpretare",
    body:
      "Harta se citește. Confirmi ce e adevărat, reformulezi, respingi ce nu e. " +
      "Ceri o citire de ansamblu — ce leagă între ele punctele — și predicții " +
      "de comportament la care răspunzi cu „mă regăsesc” sau „nu”.",
    aside:
      "Ce confirmi capătă contur plin. Ce respingi dispare și nu se mai propune.",
  },
  {
    n: "03",
    title: "Transformare",
    body:
      "Pe fiecare convingere confirmată se lucrează: o convingere nouă care să-i " +
      "ia locul, exerciții concrete pe care le bifezi când le faci, o carte și " +
      "un film. Când o simți ca a ta, o marchezi rezolvată — și devine verde " +
      "pe hartă.",
    aside:
      "Patru bife pe fiecare convingere: confirmată, convingere nouă, exersată, rezolvată.",
  },
];

export function LandingSteps() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = refs.current.indexOf(entry.target as HTMLDivElement);
          if (index >= 0) setStage(index as 0 | 1 | 2);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    for (const el of refs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Harta rămâne pe ecran cât timp citești. Ea este subiectul. */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-ink-line bg-ink-soft/40 p-5 sm:p-8">
            <LandingMap stage={stage} />
          </div>
          <p className="mt-4 text-center text-xs text-paper-faint">
            Exemplu. Harta ta pornește goală.
          </p>
        </div>

        <div>
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="border-l border-ink-line py-10 pl-6 transition-colors duration-500 first:pt-0 sm:py-16"
              style={{
                borderLeftColor:
                  stage === i ? "var(--paper-faint)" : "var(--ink-line)",
              }}
            >
              <span className="text-xs tracking-[0.2em] text-paper-faint">
                {step.n}
              </span>
              <h2 className="mt-3 font-serif text-3xl text-paper sm:text-4xl">
                {step.title}
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-paper-dim">
                {step.body}
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-paper-faint italic">
                {step.aside}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
