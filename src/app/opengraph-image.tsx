import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imaginea care apare când cineva dă linkul mai departe.
 *
 * Generată din cod, cu ecusonul citit de pe disc: rămâne aliniată cu
 * identitatea vizuală și nu trebuie redesenată manual la fiecare schimbare.
 */
export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "logo-512.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#0a1424",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            flex: 1,
            paddingRight: 48,
          }}
        >
          <div style={{ color: "#f2f5fa", fontSize: 30, letterSpacing: "-0.5px" }}>
            {SITE.name}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                color: "#f2f5fa",
                fontSize: 64,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
              }}
            >
              O hartă vie a felului în care gândești.
            </div>
            <div style={{ color: "#a7b5cb", fontSize: 27 }}>
              Convingerile care îți conduc reacțiile, vizibile și schimbabile.
            </div>
          </div>

          <div style={{ color: "#6d7d97", fontSize: 24 }}>{SITE.domain}</div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={400} height={400} alt="" style={{ borderRadius: 200 }} />
      </div>
    ),
    size,
  );
}
