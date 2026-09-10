/**
 * Din logo-ul sursă (marketing/brand/logo.png, 1254×1254) face versiunile de
 * care are nevoie site-ul: iconițe și un logo mic pentru antet și imaginea
 * de partajare. Fundal transparent, ca să stea pe orice culoare.
 *
 *   node scripts/brand-assets.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { brandMarkSvg } from "../src/lib/brand-mark.ts";

const SOURCE = "marketing/brand/logo.png";
/** Ecusonul pictat, redimensionat. */
const BADGES = [
  { file: "public/logo-512.png", size: 512 },
  { file: "public/logo-192.png", size: 192 },
];

/** Simbolul — creierul cu dalta — pe disc închis: iconițele browserului. */
const ICONS = [
  { file: "src/app/icon.png", size: 192 },
  { file: "src/app/apple-icon.png", size: 180 },
  { file: "public/simbol-512.png", size: 512 },
];

const data = `data:image/png;base64,${readFileSync(SOURCE).toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const t of BADGES) {
  mkdirSync(path.dirname(t.file), { recursive: true });
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="${data}" width="${t.size}" height="${t.size}" style="display:block"></body></html>`,
  );
  await page.waitForTimeout(150);
  await page.screenshot({ path: t.file, omitBackground: true });
  console.log("  ✓", t.file, `${t.size}×${t.size}`);
}

for (const t of ICONS) {
  mkdirSync(path.dirname(t.file), { recursive: true });
  await page.setViewportSize({ width: t.size, height: t.size });
  const radius = Math.round(t.size * 0.22);
  const inner = Math.round(t.size * 0.78);
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div style="width:${t.size}px;height:${t.size}px;border-radius:${radius}px;background:#0a0a0f;display:flex;align-items:center;justify-content:center">${brandMarkSvg(inner)}</div></body></html>`,
  );
  await page.waitForTimeout(150);
  await page.screenshot({ path: t.file, omitBackground: true });
  console.log("  ✓", t.file, `${t.size}×${t.size}`);
}

await browser.close();
