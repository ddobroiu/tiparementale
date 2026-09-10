/**
 * Creierul din spatele hărții.
 *
 * Silueta e cea de profil — lobii bombați deasupra, fisura care taie lobul
 * temporal, cerebelul strâns la spate, trunchiul care coboară. Peste ea, o
 * textură de circumvoluții generată determinist (aceleași linii la fiecare
 * randare, pe server și în browser), sinapse care pâlpâie și câteva impulsuri
 * care circulă pe trasee. Culorile trec de la auriul ecusonului la lavanda
 * hărții, ca cele două să pară același obiect.
 *
 * Rămâne fundal: opacitățile sunt mici, iar nodurile stau deasupra. Un
 * creier care ar concura cu nodurile ar strica exact lucrul pe care îl
 * servește.
 */

/** Emisfera văzută din profil, cu marginea de sus lobată. */
const CEREBRUM =
  "M 272 300 " +
  "C 264 240 292 190 340 166 " +
  "C 366 152 372 172 398 164 " +
  "C 424 156 424 138 452 138 " +
  "C 482 138 484 158 512 154 " +
  "C 540 150 542 166 570 170 " +
  "C 606 176 640 190 668 214 " +
  "C 700 242 716 278 712 314 " +
  "C 709 344 694 364 674 376 " +
  "C 686 392 686 410 672 420 " +
  "C 678 436 668 450 650 452 " +
  "C 640 470 618 478 598 470 " +
  "C 596 496 586 520 566 530 " +
  "C 550 538 538 528 542 512 " +
  "C 548 492 556 478 548 466 " +
  "C 520 474 486 476 458 470 " +
  "C 416 462 372 456 338 440 " +
  "C 296 420 276 368 272 300 Z";

/** Fisura laterală: linia care desparte lobul temporal de restul. */
const SYLVIAN = "M 296 344 C 356 388 440 402 520 390 C 558 384 580 370 598 350";

/** Șanțurile mari, desenate de mână: ancorele texturii. */
const SULCI = [
  "M 330 208 C 382 230 430 218 470 240 C 508 260 518 288 558 298",
  "M 300 274 C 352 298 400 284 442 306 C 486 330 500 354 548 360",
  "M 322 356 C 372 376 420 366 462 386",
  "M 402 176 C 422 212 402 238 420 266",
  "M 522 166 C 542 204 522 230 540 260",
  "M 624 198 C 644 234 622 260 640 290",
  "M 664 326 C 634 344 604 338 584 354",
];

/** Cerebelul, cu striațiile lui strânse. */
const CEREBELLUM =
  "M 600 404 C 636 396 670 414 674 436 C 678 458 656 472 628 472 " +
  "C 608 472 594 456 594 436 C 594 422 596 410 600 404 Z";

const CEREBELLUM_LINES = [
  "M 604 412 C 632 408 658 418 666 434",
  "M 601 422 C 630 418 654 428 664 444",
  "M 600 432 C 628 428 650 438 660 452",
  "M 601 442 C 626 438 646 446 654 458",
  "M 604 452 C 626 448 640 454 646 464",
];

/** Trunchiul cerebral. */
const STEM = "M 566 462 C 576 486 572 512 558 526";

/** Trasee de circuit dinspre ceafă, ecoul ecusonului. */
const TRACES = [
  "M 704 262 H 748 V 236 H 792",
  "M 712 296 H 764 V 318 H 806",
  "M 708 334 H 742 V 364 H 780",
  "M 690 388 H 730 V 404 H 760",
];

const GOLD = "#d9b36a";
const LAVENDER = "#c8b6ff";

/**
 * Fisura laterală ca funcție: y-ul ei pentru un x dat. Textura se rupe
 * acolo, ca lobul temporal să se vadă despărțit, nu doar desenat pe deasupra.
 */
function sylvianY(x: number): number {
  const t = (x - 296) / (598 - 296);
  // Parabolă prin capetele fisurii și punctul ei cel mai de jos.
  return 344 + (350 - 344) * t + 4 * 56 * t * (1 - t);
}

/** Generator determinist: aceeași textură la fiecare randare. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

interface Curve {
  d: string;
  points: Array<{ x: number; y: number }>;
}

/**
 * Circumvoluțiile: rânduri ondulate, cu amplitudine și fază variate, rupte
 * pe fisura laterală. Decuparea pe siluetă se face cu clipPath, deci
 * rândurile pot porni și se pot termina oriunde.
 */
function gyri(): Curve[] {
  const rnd = seeded(7);
  const curves: Curve[] = [];

  for (let row = 0; row < 24; row++) {
    const y0 = 150 + row * 14.5;
    const amp = 6 + rnd() * 6;
    const wave = 18 + rnd() * 10;
    const phase = rnd() * Math.PI * 2;
    // Rândurile de sus urmează bolta; cele de jos, curbura lobului temporal.
    const bend = (row - 12) * 0.9;

    let d = "";
    let open = false;
    const points: Array<{ x: number; y: number }> = [];

    for (let x = 262; x <= 730; x += 6) {
      const centre = (x - 496) / 234;
      const y =
        y0 + bend * centre * centre * 40 + amp * Math.sin(x / wave + phase);
      const gap = Math.abs(y - sylvianY(x)) < 13 && x > 300 && x < 600;

      if (gap) {
        open = false;
        continue;
      }
      d += open ? ` L ${x} ${y.toFixed(1)}` : `M ${x} ${y.toFixed(1)}`;
      open = true;
      if (x % 60 === 0) points.push({ x, y });
    }

    curves.push({ d, points });
  }

  return curves;
}

const GYRI = gyri();

/** Sinapsele: puncte alese de pe rândurile texturii. */
const SYNAPSES = (() => {
  const rnd = seeded(23);
  const all = GYRI.flatMap((c) => c.points);
  const picked: Array<{ x: number; y: number; delay: number; r: number }> = [];
  for (let i = 0; i < 34 && all.length > 0; i++) {
    const idx = Math.floor(rnd() * all.length);
    const [p] = all.splice(idx, 1);
    picked.push({ x: p.x, y: p.y, delay: rnd() * 6, r: 1.2 + rnd() * 1.4 });
  }
  return picked;
})();

/** Rândurile pe care circulă impulsurile. */
const IMPULSE_ROWS = [4, 10, 17];

export function BrainBackdrop() {
  return (
    <g className="pointer-events-none" aria-hidden="true">
      <defs>
        <radialGradient id="brain-core" cx="48%" cy="44%" r="58%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.14" />
          <stop offset="45%" stopColor={LAVENDER} stopOpacity="0.06" />
          <stop offset="100%" stopColor={LAVENDER} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="brain-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD} />
          <stop offset="100%" stopColor={LAVENDER} />
        </linearGradient>
        <filter id="brain-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <clipPath id="brain-clip">
          <path d={CEREBRUM} />
        </clipPath>
        <clipPath id="cerebellum-clip">
          <path d={CEREBELLUM} />
        </clipPath>
      </defs>

      {/* Aura: conturul difuz, în spatele tuturor. */}
      <path
        d={CEREBRUM}
        fill="none"
        stroke="url(#brain-stroke)"
        strokeOpacity={0.35}
        strokeWidth={10}
        filter="url(#brain-blur)"
        className="brain-breathe"
      />

      {/* Corpul: umplere cu gradient, ca o lumină dinăuntru. */}
      <path d={CEREBRUM} fill="url(#brain-core)" />

      {/* Textura de circumvoluții, decupată pe siluetă. Două straturi: unul
          fin peste tot, unul mai vizibil pe rândurile de bază. */}
      <g clipPath="url(#brain-clip)">
        <g
          transform="translate(3 4)"
          stroke={LAVENDER}
          strokeOpacity={0.07}
          strokeWidth={1}
          fill="none"
        >
          {GYRI.map((c, i) => (
            <path key={`b-${i}`} d={c.d} />
          ))}
        </g>
        <g
          stroke="url(#brain-stroke)"
          strokeOpacity={0.22}
          strokeWidth={1.1}
          fill="none"
          strokeLinecap="round"
        >
          {GYRI.map((c, i) => (
            <path key={i} d={c.d} />
          ))}
        </g>

        {/* Impulsurile: o dungă de lumină care aleargă pe trei rânduri. */}
        {IMPULSE_ROWS.map((row, i) => (
          <path
            key={`imp-${row}`}
            d={GYRI[row].d}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.8}
            strokeWidth={1.6}
            strokeLinecap="round"
            className="brain-impulse"
            style={{ animationDelay: `${i * 2.3}s` }}
          />
        ))}
      </g>

      {/* Șanțurile mari, deasupra texturii. */}
      <path
        d={CEREBRUM}
        fill="none"
        stroke="url(#brain-stroke)"
        strokeOpacity={0.5}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path
        d={SYLVIAN}
        fill="none"
        stroke={GOLD}
        strokeOpacity={0.32}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {SULCI.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={LAVENDER}
          strokeOpacity={0.18}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      ))}

      {/* Cerebelul: contur și striații, decupate. */}
      <path
        d={CEREBELLUM}
        fill="url(#brain-core)"
        stroke="url(#brain-stroke)"
        strokeOpacity={0.45}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <g clipPath="url(#cerebellum-clip)">
        {CEREBELLUM_LINES.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={LAVENDER}
            strokeOpacity={0.22}
            strokeWidth={1}
          />
        ))}
      </g>

      <path
        d={STEM}
        fill="none"
        stroke="url(#brain-stroke)"
        strokeOpacity={0.4}
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Sinapsele: puncte care pâlpâie, fiecare în ritmul ei. */}
      {SYNAPSES.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={i % 3 === 0 ? GOLD : LAVENDER}
          className="brain-synapse"
          style={{ animationDelay: `${s.delay}s` }}
        />
      ))}

      {/* Trasee de circuit, spre dreapta: legătura cu ecusonul. */}
      <g stroke={GOLD} strokeOpacity={0.22} strokeWidth={1} fill="none">
        {TRACES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {[
        [792, 236],
        [806, 318],
        [780, 364],
        [760, 404],
      ].map(([x, y], i) => (
        <circle
          key={`t-${i}`}
          cx={x}
          cy={y}
          r={2}
          fill={GOLD}
          className="brain-synapse"
          style={{ animationDelay: `${1.1 * i}s` }}
        />
      ))}
    </g>
  );
}
