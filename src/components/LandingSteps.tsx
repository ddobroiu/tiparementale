"use client";

import { useEffect, useRef, useState } from "react";

import { LandingMap } from "./LandingMap";

const STEPS = [
  {
    n: "01",
    title: "Identificare",
    body:
      "O conversație adevărată, nu un formular. Pui întrebări, urmezi firul, " +
      "ceri exemple — despre bani, relații, sănătate, muncă, familie. Din " +
      "cuvintele tale ies la suprafață convingerile care îți conduc reacțiile.",
    aside: "Fiecare element păstrează citatul exact din care a fost dedus.",
  },
  {
    n: "02",
    title: "Interpretare",
    body:
      "Se construiește harta, pe ramuri: fiecare domeniu de viață își are " +
      "zona lui, iar elementele se leagă între ele și arată ce alimentează ce. " +
      "Tu confirmi, reformulezi sau respingi fiecare interpretare.",
    aside: "Aici devine precisă. Ce respingi nu se mai propune.",
  },
  {
    n: "03",
    title: "Transformare",
    body:
      "Pentru convingerile pe care le-ai confirmat, primești o convingere nouă " +
      "care să le ia locul — plus exerciții mici, exemple concrete, o carte și " +
      "un film alese pentru convingerea aceea anume.",
    aside: "Progresul se măsoară din ce spui, nu din ce declari că simți.",
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
                borderLeftColor: stage === i ? "var(--paper-faint)" : "var(--ink-line)",
              }}
            >
              <span className="text-xs tracking-[0.2em] text-paper-faint">{step.n}</span>
              <h2 className="mt-3 font-serif text-3xl text-paper sm:text-4xl">
                {step.title}
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-paper-dim">{step.body}</p>
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
