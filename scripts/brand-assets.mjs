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

const SOURCE = "marketing/brand/logo.png";
const TARGETS = [
  { file: "public/logo-512.png", size: 512 },
  { file: "public/logo-192.png", size: 192 },
  { file: "src/app/icon.png", size: 192 },
  { file: "src/app/apple-icon.png", size: 180 },
];

const data = `data:image/png;base64,${readFileSync(SOURCE).toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const t of TARGETS) {
  mkdirSync(path.dirname(t.file), { recursive: true });
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="${data}" width="${t.size}" height="${t.size}" style="display:block"></body></html>`,
  );
  await page.waitForTimeout(150);
  await page.screenshot({ path: t.file, omitBackground: true });
  console.log("  ✓", t.file, `${t.size}×${t.size}`);
}

await browser.close();
