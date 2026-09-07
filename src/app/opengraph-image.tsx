import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imaginea care apare când cineva dă linkul mai departe.
 *
 * Generată din cod, nu dintr-un fișier: rămâne aliniată cu identitatea vizuală
 * și nu trebuie redesenată manual la fiecare schimbare de nume.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0f",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: "2px solid #c8b6ff",
              opacity: 0.75,
            }}
          />
          <div style={{ color: "#f4f3f0", fontSize: 30, letterSpacing: "-0.5px" }}>
            {SITE.name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              color: "#f4f3f0",
              fontSize: 68,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              maxWidth: 900,
            }}
          >
            O hartă vie a felului în care gândești.
          </div>
          <div style={{ color: "#a5a3ae", fontSize: 28, maxWidth: 820 }}>
            Convingerile care îți conduc reacțiile, vizibile și schimbabile.
          </div>
        </div>

        <div style={{ color: "#6a6875", fontSize: 24 }}>{SITE.domain}</div>
      </div>
    ),
    size,
  );
}
