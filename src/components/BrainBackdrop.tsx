/**
 * Conturul de creier din spatele hărții.
 *
 * Este fundal, nu subiect: la opacitățile de mai jos se citește ca o formă
 * abia ghicită, iar nodurile rămân lucrul pe care îl privești. Un creier
 * desenat apăsat ar concura cu harta și ar face-o mai greu de citit.
 */

/** Circumvoluțiile unei emisfere. Cealaltă este aceeași, oglindită. */
const GYRI = [
  "M 512 168 C 578 172 636 214 652 278",
  "M 512 238 C 588 243 642 290 648 352",
  "M 512 310 C 583 320 628 368 623 430",
  "M 512 382 C 573 397 608 441 594 494",
  "M 512 454 C 558 469 583 503 564 538",
];

const OUTLINE =
  "M 500 122 C 620 122 700 182 720 272 C 740 362 700 470 610 540 " +
  "C 562 578 500 586 500 586 C 500 586 438 578 390 540 " +
  "C 300 470 260 362 280 272 C 300 182 380 122 500 122 Z";

/** Fisura dintre emisfere, cu o undă ușoară ca să nu pară trasă cu rigla. */
const FISSURE =
  "M 500 128 C 508 220 492 318 500 420 C 506 500 497 542 500 580";

export function BrainBackdrop() {
  return (
    <g className="pointer-events-none" aria-hidden="true">
      <defs>
        <radialGradient id="brain-glow" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#c8b6ff" stopOpacity="0.07" />
          <stop offset="70%" stopColor="#c8b6ff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#c8b6ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={OUTLINE} fill="url(#brain-glow)" stroke="#c8b6ff" strokeOpacity={0.14} />
      <path d={FISSURE} fill="none" stroke="#c8b6ff" strokeOpacity={0.1} />

      {[1, -1].map((side) => (
        <g
          key={side}
          transform={side === 1 ? undefined : "translate(1000, 0) scale(-1, 1)"}
        >
          {GYRI.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#c8b6ff"
              strokeOpacity={0.085}
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
    </g>
  );
}
