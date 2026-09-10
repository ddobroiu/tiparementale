/**
 * Imaginile pentru pagina de Facebook: profil, copertă și patru postări
 * pătrate. Generate din HTML cu identitatea site-ului, ca să nu depindă de
 * un fișier de design ținut separat.
 *
 *   node scripts/facebook-images.mjs [outDir]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = process.argv[2] ?? "marketing/facebook";
mkdirSync(OUT, { recursive: true });

const INK = "#0a0a0f";
const SOFT = "#12121a";
const LINE = "#22222e";
const PAPER = "#f4f3f0";
const DIM = "#a5a3ae";
const FAINT = "#6a6875";
const BELIEF = "#c8b6ff";
const VALUE = "#a0e7c4";

/** Semnul mărcii, identic cu componenta Logo. */
function mark(size, opacity = 1) {
  const nodes = [
    [11, 9, 2.6, 0.5],
    [21, 12.5, 1.9, 0.5],
    [12.5, 19, 1.9, 0.5],
    [21.5, 22, 3.2, 0.95],
  ];
  const links = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" style="opacity:${opacity}">
    <path d="M 24.5 6.5 C 19 1.5 8 2.5 4.5 10 C 1.8 15.8 4 22.5 9.5 26 C 13 28.2 18 28.6 21.5 27"
      stroke="${BELIEF}" stroke-opacity="0.55" stroke-width="1.4" stroke-linecap="round"/>
    ${links.map(([a, b]) => `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${BELIEF}" stroke-opacity="0.42" stroke-width="1"/>`).join("")}
    ${nodes.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BELIEF}" fill-opacity="${o}"/>`).join("")}
  </svg>`;
}

/** O hartă mică, decorativă: puncte de culori diferite, legate. */
function miniMap(width, height, seed = 1) {
  const colors = ["#f6d186", "#ffb4a2", "#a0e7c4", "#a2d6f9", "#d8a0c4", "#c8b6ff", "#b8c9e8"];
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pts = Array.from({ length: 14 }, (_, i) => ({
    x: 60 + rnd() * (width - 120),
    y: 50 + rnd() * (height - 100),
    r: 5 + rnd() * 9,
    c: colors[i % colors.length],
    resolved: i === 3 || i === 9,
  }));
  const links = pts
    .map((p, i) => [i, (i * 5 + 3) % pts.length])
    .concat(pts.map((p, i) => [i, (i * 7 + 1) % pts.length]));
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
    ${links.map(([a, b]) => `<path d="M ${pts[a].x} ${pts[a].y} Q ${(pts[a].x + pts[b].x) / 2 + 30} ${(pts[a].y + pts[b].y) / 2 - 30} ${pts[b].x} ${pts[b].y}" stroke="${PAPER}" stroke-opacity="0.12" stroke-width="1"/>`).join("")}
    ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.r + 9}" fill="${p.resolved ? VALUE : p.c}" fill-opacity="0.08"/><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.resolved ? VALUE : p.c}" fill-opacity="${p.resolved ? 0.95 : 0.45}" stroke="${p.resolved ? VALUE : p.c}" stroke-width="1.4"/>${p.resolved ? `<text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${INK}">✓</text>` : ""}`).join("")}
  </svg>`;
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; }
  body { background: ${INK}; color: ${PAPER}; font-family: Inter, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .serif { font-family: Fraunces, Georgia, serif; font-weight: 400; letter-spacing: -0.02em; }
  .dim { color: ${DIM}; } .faint { color: ${FAINT}; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand span { font-family: Fraunces, Georgia, serif; font-size: 34px; letter-spacing: -0.02em; }
  .brand span b { font-weight: 400; color: ${DIM}; }
  .pill { display: inline-block; border: 1px solid ${LINE}; border-radius: 999px; padding: 10px 20px; font-size: 22px; color: ${DIM}; }
  .cta { display: inline-block; background: ${PAPER}; color: ${INK}; border-radius: 16px; padding: 18px 30px; font-size: 26px; font-weight: 500; }
`;

function page(width, height, body, extraCss = "") {
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8">${FONTS}<style>${BASE_CSS}${extraCss} html,body{width:${width}px;height:${height}px;overflow:hidden}</style></head><body>${body}</body></html>`;
}

const IMAGES = [
  {
    file: "profil.png",
    width: 512,
    height: 512,
    html: page(
      512,
      512,
      `<div style="width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%, ${SOFT} 0%, ${INK} 70%)">${mark(340)}</div>`,
    ),
  },
  {
    file: "coperta.png",
    width: 1640,
    height: 624,
    html: page(
      1640,
      624,
      `<div style="position:relative;width:1640px;height:624px;overflow:hidden">
        <div style="position:absolute;right:0;top:0;opacity:.9">${miniMap(820, 624, 7)}</div>
        <div style="position:absolute;left:500px;top:0;width:640px;height:624px;display:flex;flex-direction:column;justify-content:center;gap:26px;padding:0 20px">
          <div class="brand">${mark(48)}<span>Tipare <b>Mentale</b></span></div>
          <div class="serif" style="font-size:56px;line-height:1.1">O hartă vie a felului în care gândești.</div>
          <div class="dim" style="font-size:24px;line-height:1.5">Convingerile care îți conduc reacțiile, vizibile și schimbabile. Prima ședință e gratuită.</div>
          <div class="faint" style="font-size:22px">tiparementale.ro</div>
        </div>
      </div>`,
    ),
  },
  {
    file: "postare-01-harta.png",
    width: 1080,
    height: 1080,
    html: page(
      1080,
      1080,
      `<div style="position:relative;width:1080px;height:1080px;padding:72px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="position:absolute;inset:0;opacity:.85">${miniMap(1080, 1080, 3)}</div>
        <div class="brand" style="position:relative">${mark(44)}<span>Tipare <b>Mentale</b></span></div>
        <div style="position:relative;background:${INK}dd;border:1px solid ${LINE};border-radius:28px;padding:44px 48px;backdrop-filter:blur(8px)">
          <div class="serif" style="font-size:58px;line-height:1.12">Ce crezi despre bani ai învățat până la 12 ani.</div>
          <div class="dim" style="font-size:28px;line-height:1.45;margin-top:22px">Vorbești liber. Din ce spui apare o hartă: convingeri, frici, valori, tipare — fiecare cu citatul din care a fost dedusă.</div>
          <div style="margin-top:34px;display:flex;align-items:center;justify-content:space-between"><span class="cta">Prima ședință e gratuită</span><span class="faint" style="font-size:22px">tiparementale.ro</span></div>
        </div>
      </div>`,
    ),
  },
  {
    file: "postare-02-trei-pasi.png",
    width: 1080,
    height: 1080,
    html: page(
      1080,
      1080,
      `<div style="width:1080px;height:1080px;padding:80px;display:flex;flex-direction:column;justify-content:space-between">
        <div class="brand">${mark(44)}<span>Tipare <b>Mentale</b></span></div>
        <div style="display:flex;flex-direction:column;gap:22px">
          ${[
            ["1", "Identificare", "O ședință pe o temă. Din ce povestești, harta se umple."],
            ["2", "Interpretare", "Confirmi ce e adevărat. Ceri o citire de ansamblu."],
            ["3", "Transformare", "Convingere nouă, exerciții bifate, carte, film. Rezolvată → verde pe hartă."],
          ]
            .map(
              ([n, t, d], i) => `<div style="display:flex;gap:28px;align-items:flex-start;border:1px solid ${i === 2 ? VALUE + "80" : LINE};border-radius:24px;padding:30px 34px;background:${SOFT}">
              <div style="width:56px;height:56px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;background:${i === 2 ? VALUE : PAPER};color:${INK}">${n}</div>
              <div><div class="serif" style="font-size:40px;line-height:1.1">${t}</div><div class="dim" style="font-size:24px;line-height:1.4;margin-top:8px">${d}</div></div>
            </div>`,
            )
            .join("")}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="pill">Harta e a ta. Nu expiră nimic.</span><span class="faint" style="font-size:22px">tiparementale.ro</span></div>
      </div>`,
    ),
  },
  {
    file: "postare-03-citat.png",
    width: 1080,
    height: 1080,
    html: page(
      1080,
      1080,
      `<div style="width:1080px;height:1080px;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:radial-gradient(circle at 30% 20%, #1a1830 0%, ${INK} 60%)">
        <div class="brand">${mark(44)}<span>Tipare <b>Mentale</b></span></div>
        <div>
          <div style="display:flex;align-items:center;gap:14px" class="faint"><span style="width:12px;height:12px;border-radius:999px;background:#a2d6f9;display:inline-block"></span><span style="font-size:20px;letter-spacing:.16em;text-transform:uppercase">Muncă · Convingere</span></div>
          <div class="serif" style="font-size:64px;line-height:1.1;margin-top:22px">„Dacă cer ajutor, înseamnă că nu mă descurc.”</div>
          <div style="margin-top:44px;border-left:3px solid ${VALUE};padding-left:26px">
            <div class="faint" style="font-size:20px;letter-spacing:.16em;text-transform:uppercase">Convingerea nouă</div>
            <div class="serif" style="font-size:38px;line-height:1.2;color:${VALUE};margin-top:10px">Pot cere ajutor și rămân competent. Așa lucrează oamenii buni.</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="dim" style="font-size:24px">Așa arată o convingere pe hartă. Și ce urmează după ea.</span><span class="faint" style="font-size:22px">tiparementale.ro</span></div>
      </div>`,
    ),
  },
  {
    file: "postare-04-nu-e-chatbot.png",
    width: 1080,
    height: 1080,
    html: page(
      1080,
      1080,
      `<div style="position:relative;width:1080px;height:1080px;padding:80px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="position:absolute;right:-120px;bottom:-60px;opacity:.7">${miniMap(760, 700, 11)}</div>
        <div class="brand" style="position:relative">${mark(44)}<span>Tipare <b>Mentale</b></span></div>
        <div style="position:relative">
          <div class="serif" style="font-size:92px;line-height:1.02">Nu e un chatbot.</div>
          <div class="dim" style="font-size:30px;line-height:1.45;margin-top:28px;max-width:720px">Conversația e doar metoda. Ce rămâne după ea e harta: ce s-a adăugat, ce s-a întărit, ce a slăbit față de săptămâna trecută.</div>
          <div style="margin-top:36px;display:flex;gap:14px;flex-wrap:wrap">${["Citatul din care a fost dedus", "Exporți sau ștergi tot, oricând", "Fără instalare"].map((t) => `<span class="pill">${t}</span>`).join("")}</div>
        </div>
        <div class="faint" style="position:relative;font-size:22px">tiparementale.ro</div>
      </div>`,
    ),
  },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
for (const img of IMAGES) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: img.width, height: img.height });
  await p.setContent(img.html, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, img.file) });
  await p.close();
  console.log("  ✓", img.file);
}
await browser.close();
console.log("\n✓ Imagini în", path.resolve(OUT));
