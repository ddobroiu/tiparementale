"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Ecusonul, ca o monedă: se rotește încet în jurul axei verticale și poate fi
 * învârtit cu degetul sau cu mouse-ul. Pe ambele fețe e același ecuson.
 *
 * Rotația trăiește într-un ref și se scrie direct pe element: șaizeci de
 * randări React pe secundă pentru un unghi ar fi risipă.
 */
export function SpinningBadge({ size = 440 }: { size?: number }) {
  const coin = useRef<HTMLDivElement>(null);
  const angle = useRef(-18);
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused && !drag.current) angle.current += dt * 0.022;
      if (coin.current) {
        coin.current.style.transform = `rotateY(${angle.current}deg)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  function onPointerDown(event: React.PointerEvent) {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, angle: angle.current };
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag.current) return;
    angle.current = drag.current.angle + (event.clientX - drag.current.x) * 0.6;
  }

  function endDrag() {
    drag.current = null;
  }

  const face =
    "absolute inset-0 rounded-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

  return (
    <div
      className="relative shrink-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      style={{ width: size, height: size, perspective: size * 2.4 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      title="Trage ca să rotești"
    >
      {/* Aura aurie stă în spate, nemișcată: se rotește moneda, nu lumina. */}
      <div
        className="absolute inset-[6%] rounded-full"
        style={{ boxShadow: "0 0 110px 20px rgba(217,179,106,0.16)" }}
      />

      <div
        ref={coin}
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ transform: "rotateY(-18deg)" }}
      >
        <Image
          src="/logo-512.png"
          alt="Tipare Mentale — reprogramează-ți viața"
          width={size}
          height={size}
          priority
          draggable={false}
          className={face}
        />

        {/* Reversul: aceeași poză, rotită la 180°. Când moneda ajunge la 180°,
            cele două rotații se anulează și poza apare exact ca în față. */}
        <Image
          src="/logo-512.png"
          alt=""
          width={size}
          height={size}
          draggable={false}
          className={face}
          style={{ transform: "rotateY(180deg)" }}
        />
      </div>
    </div>
  );
}
