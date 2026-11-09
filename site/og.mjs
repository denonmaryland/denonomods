#!/usr/bin/env node
// Renders Open Graph cards (1200x630 PNG) into site/public/og/ with headless Chromium.
// Run locally after adding a mod: `node site/build.mjs && node site/og.mjs && node site/build.mjs`.
// Needs `chromium` (or CHROMIUM=/path) on this machine; the deployed site only serves the PNGs.
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
import { tmpdir } from "node:os";

const SITE = dirname(fileURLToPath(import.meta.url));
const DIST = join(SITE, "dist");
const OUT = join(SITE, "public/og");
const CHROME = process.env.CHROMIUM || "chromium";
if (!existsSync(join(DIST, "mods.json"))) { console.error("run node site/build.mjs first"); process.exit(1); }
const mods = JSON.parse(readFileSync(join(DIST, "mods.json"), "utf8"));
const led = readFileSync(join(SITE, "src/led.svg"), "utf8");
const field = readFileSync(join(SITE, "src/field.svg"), "utf8");
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const contentFor = (id) => { const p = join(SITE, "content", `${id}.json`); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {}; };

const shell = (inner) => `<!doctype html><html data-theme="grey"><head><meta charset="utf-8"><link rel="stylesheet" href="/styles.css">
<style>html,body{width:1200px;height:630px;overflow:hidden}body{position:relative;background:var(--bg)}
.ogf{position:absolute;inset:0;opacity:.9}.ogf svg{width:1200px;height:633px}
.og{position:relative;height:100%;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between}
.og .led{width:560px}.og .top{display:flex;justify-content:space-between;align-items:center;font-size:18px;color:var(--muted)}
.og h1{font-family:var(--sans);font-size:64px;font-weight:600;letter-spacing:-.03em;line-height:68px;color:var(--text)}
.og p{font-size:22px;line-height:34px;color:var(--text-2);max-width:620px}
.og .cmdl{font-size:22px;color:var(--text);background:var(--bg-deep);box-shadow:0 0 0 1px var(--border);padding:14px 20px;width:fit-content}
.og .shot{position:absolute;right:64px;top:150px;width:440px;height:275px;object-fit:cover;box-shadow:0 0 0 1px var(--ring)}
.og .foot{font-size:16px;color:var(--muted)}</style></head><body>${inner}</body></html>`;

const pages = {
  default: shell(`<div class="ogf">${field}</div><div class="og" style="align-items:center;justify-content:center;gap:40px;text-align:center">
    ${led.replace('class="led"', 'class="led" style="width:900px"')}
    <p style="font-size:30px;line-height:40px;color:var(--text);max-width:none">Mods for the desktop you live in</p>
    <div class="cmdl"><span class="dollar">$ </span>denonomods install &lt;mod&gt;</div>
    <div class="foot">${mods.length} mods for Omarchy, Herdr &amp; your agents · made for Omarchy &amp; Herdr, not affiliated</div></div>`),
};
for (const m of mods) {
  const c = contentFor(m.id);
  const shot = c.preview ? `<img class="shot" src="/media/${esc(c.preview)}">` : "";
  pages[m.id] = shell(`<div class="og">
    <div class="top">${led}<span>mods / ${esc(m.category)}</span></div>
    <div style="display:flex;flex-direction:column;gap:18px;${shot ? "max-width:620px" : ""}"><h1>${esc(m.name)}</h1><p>${esc(m.summary)}</p></div>
    <div class="cmdl"><span class="dollar">$ </span>${esc(m.cmd)}</div>${shot}</div>`);
}

const types = { ".css": "text/css", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".html": "text/html" };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url.startsWith("/__og/")) { res.writeHead(200, { "content-type": "text/html" }); return res.end(pages[url.slice(6)] || ""); }
  const f = join(DIST, url);
  if (!f.startsWith(DIST) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[extname(f)] || "application/octet-stream" });
  res.end(readFileSync(f));
}).listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  mkdirSync(OUT, { recursive: true });
  const profile = join(tmpdir(), `denonomodz-og-${process.pid}`);
  for (const id of Object.keys(pages)) {
    const out = join(OUT, `${id}.png`);
    await run(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${profile}`, "--window-size=1200,630",
      "--virtual-time-budget=3000", `--screenshot=${out}`, `http://127.0.0.1:${port}/__og/${id}`], { timeout: 60000 });
    console.log("og", id);
  }
  rmSync(profile, { recursive: true, force: true });
  server.close();
});
