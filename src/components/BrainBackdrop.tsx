/**
 * Conturul de creier din spatele hărții.
 *
 * Prima variantă era o formă ovală cu câteva linii înăuntru — arăta a fasole,
 * nu a creier. Ce lipsea era silueta: un creier se recunoaște după profil, cu
 * lobii bombați deasupra, fisura care taie lobul temporal, cerebelul strâns
 * dedesubt la spate și trunchiul care coboară.
 *
 * Rămâne fundal, nu subiect: la opacitățile de mai jos se citește ca o formă
 * abia ghicită, iar nodurile rămân lucrul pe care îl privești.
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
const SYLVIAN =
  "M 296 344 C 356 388 440 402 520 390 C 558 384 580 370 598 350";

/** Șanțurile dintre circumvoluții. Urmăresc forma, nu o traversează. */
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
  "M 604 414 C 632 410 656 422 664 438",
  "M 600 428 C 628 424 650 434 660 450",
  "M 602 444 C 626 440 644 448 652 460",
];

/** Trunchiul cerebral. */
const STEM = "M 566 462 C 576 486 572 512 558 526";

const STROKE = "#c8b6ff";

export function BrainBackdrop() {
  return (
    <g className="pointer-events-none" aria-hidden="true">
      <defs>
        <radialGradient id="brain-glow" cx="46%" cy="42%">
          <stop offset="0%" stopColor={STROKE} stopOpacity="0.09" />
          <stop offset="65%" stopColor={STROKE} stopOpacity="0.025" />
          <stop offset="100%" stopColor={STROKE} stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d={CEREBRUM}
        fill="url(#brain-glow)"
        stroke={STROKE}
        strokeOpacity={0.17}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />

      <path
        d={SYLVIAN}
        fill="none"
        stroke={STROKE}
        strokeOpacity={0.13}
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {SULCI.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={STROKE}
          strokeOpacity={0.09}
          strokeLinecap="round"
        />
      ))}

      <path
        d={CEREBELLUM}
        fill="url(#brain-glow)"
        stroke={STROKE}
        strokeOpacity={0.14}
        strokeLinejoin="round"
      />
      {CEREBELLUM_LINES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={STROKE} strokeOpacity={0.1} />
      ))}

      <path d={STEM} fill="none" stroke={STROKE} strokeOpacity={0.13} strokeWidth={1.2} />
    </g>
  );
}
