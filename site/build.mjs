#!/usr/bin/env node
// Builds the DENONOMODZ site into site/dist from the catalog (mods/*/mod.json) plus optional
// site extras (site/content/<id>.json). A new mod with only a mod.json still gets a card and a page.
// No dependencies: `node site/build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SITE, "..");
const DIST = join(SITE, "dist");
const read = (p) => readFileSync(p, "utf8");
const json = (p) => JSON.parse(read(p));

const host = process.env.SITE_URL
  || (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
  || "";
const abs = (p) => `${host}${p}`;

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const PLATFORM = { omarchy: "Omarchy", herdr: "Herdr", "claude-code": "Claude skill", hermes: "Hermes" };
const CATEGORY_ORDER = ["omarchy", "herdr", "claude-code", "hermes"];
const KIND_TAG = { "omarchy-plugin": "plugin", "repo-installer": "installer", "claude-skill": "skill", "hermes-desktop-plugin": "desktop plugin", "hermes-skill": "skill" };
const GOES_TO = {
  "omarchy-plugin": "~/.config/omarchy/plugins/",
  "repo-installer": "wherever its installer puts it",
  "claude-skill": "~/.claude/skills/",
  "hermes-desktop-plugin": "~/.hermes/desktop-plugins/",
  "hermes-skill": "~/.hermes/skills/",
};
const LIB_REPO = "https://github.com/denonmaryland/denonomods";
const OMARCHY = "https://omarchy.org";
const HERDR = "https://herdr.dev";

const svg = {
  led: read(join(SITE, "src/led.svg")),
  field: read(join(SITE, "src/field.svg")).replace("<svg ", "<svg class=\"field-lg\" "),
  fieldSm: read(join(SITE, "src/field-sm.svg")),
  mark: read(join(SITE, "src/mark.svg")),
};

// ---- catalog -------------------------------------------------------------------------------
const mods = readdirSync(join(ROOT, "mods"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, "mods", d.name, "mod.json")))
  .map((d) => {
    const m = json(join(ROOT, "mods", d.name, "mod.json"));
    const cPath = join(SITE, "content", `${m.id}.json`);
    const c = existsSync(cPath) ? json(cPath) : {};
    const repo = m.homepage || m.source?.git || null;
    return {
      ...m,
      site: c,
      platform: PLATFORM[m.category] || m.category,
      tags: c.tags || [KIND_TAG[m.kind] || m.kind],
      label: c.label || "",
      repo,
      url: `/mods/${m.id}/`,
      cmd: `denonomods install ${m.id}`,
      license: c.license || (m.source?.bundled ? "MIT" : ""),
    };
  });
const ORDER = ["tricky-tiles", "theme-studio", "hello-lock", "softly", "pebble-shell", "project-pals", "omarchy-computer-use", "hermes-rice"];
const rank = (m) => {
  const i = ORDER.indexOf(m.id);
  return [i === -1 ? 1 : 0, CATEGORY_ORDER.indexOf(m.category) === -1 ? 99 : CATEGORY_ORDER.indexOf(m.category), i, m.name];
};
mods.sort((a, b) => {
  const ra = rank(a), rb = rank(b);
  for (let k = 0; k < ra.length; k++) if (ra[k] !== rb[k]) return ra[k] < rb[k] ? -1 : 1;
  return 0;
});

// ---- pieces --------------------------------------------------------------------------------
const pixelGlyph = (name) => {
  // A 5x5 pixel monogram for mods without a preview: first letter of the name on the LED grid.
  const L = { A: "01110100011111110001100011", B: "11110100011111010001111101", C: "01111100001000010000011111", D: "11110100011000110001111101",
    E: "11111100001111010000111111", F: "11111100001111010000100001", G: "01111100001001110001011111", H: "10001100011111110001100011",
    I: "11111001000010000100111111", J: "00111000010000110001011101", K: "10001100101110010010100011", L: "10000100001000010000111111",
    M: "10001110111010110001100011", N: "10001110011010110011100011", O: "01110100011000110001011101", P: "11110100011111010000100001",
    Q: "01110100011010110010011011", R: "11110100011111010010100011", S: "01111100000111000001111101", T: "11111001000010000100001001",
    U: "10001100011000110001011101", V: "10001100011000101010001001", W: "10001100011010111011100011", X: "10001010100010001010100011",
    Y: "10001010100010000100001001", Z: "11111000100010001000111111" };
  const bits = (L[(name || "?")[0].toUpperCase()] || L.D).slice(0, 25);
  let r = "";
  [...bits].forEach((b, i) => { if (b === "1") r += `<rect x="${(i % 5) * 18}" y="${Math.floor(i / 5) * 18}" width="14" height="14" fill="var(--b${Math.floor(i / 5)})"/>`; });
  return `<svg viewBox="0 0 86 86" aria-hidden="true">${r}</svg>`;
};

const preview = (m, big = false) => {
  const s = m.site;
  if (s.terminal) {
    const lines = s.terminal.map(([k, t]) => k === "prompt"
      ? `<span class="prompt">❯ ${esc(t)}</span>` : `<span class="${k}">${esc(t)}</span>`).join("");
    return `<div class="pv-term" aria-hidden="true">${lines}<span class="prompt">❯ <i class="cursor"></i></span></div>`;
  }
  if (s.mock === "hermes") {
    return `<div class="pv-hermes" aria-hidden="true"><div class="rail"><i></i><i></i><i></i><i></i></div>
      <div class="col"><span>Sessions</span><i class="on"></i><i></i><i></i><i></i></div>
      <div class="col"><span>Bots</span><i></i><i></i><i></i></div></div>`;
  }
  const file = big ? (s.wide || s.preview) : s.preview;
  if (file) {
    const [w, h] = big ? [1488, 786] : [800, 500];
    return `<img src="/media/${esc(file)}" alt="${esc(m.name)} screenshot" width="${w}" height="${h}" loading="${big ? "eager" : "lazy"}" decoding="async">`;
  }
  return `<div class="pv-pixel" aria-hidden="true">${pixelGlyph(m.name)}</div>`;
};

const copyBtn = (text, label = "⧉") => `<button class="copy" type="button" data-copy="${esc(text)}" aria-label="Copy: ${esc(text)}">${label}</button>`;

const tags = (m) => `<div class="tags"><span class="tag tag--platform">${esc(m.platform)}</span>${m.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;

const card = (m) => `
<article class="card" data-category="${esc(m.category)}">
  <a class="card-media" href="${m.url}" tabindex="-1" aria-hidden="true">${preview(m)}</a>
  <div class="card-body">
    <div class="card-title"><a href="${m.url}">${esc(m.name)}</a><span>${esc(m.label)}</span></div>
    <p class="card-desc">${esc(m.site.oneLine || m.summary)}</p>
    ${tags(m)}
  </div>
  <div class="cmd"><code><span class="dollar">$ </span>${esc(m.cmd)}</code>${copyBtn(m.cmd)}</div>
</article>`;

const makeCard = `
<article class="card make">
  <div><h3>Make the next one</h3>
  <p>Start a mod from a template. denonomods knows five kinds: Omarchy plugin, repo installer, Claude skill, Hermes plugin, Hermes skill.</p></div>
  <div class="codebox"><span><span class="dollar">$ </span>denonomods new omarchy my-mod \\</span><span>    --kind omarchy-plugin</span><span class="ok">✓ mods/my-mod/mod.json</span></div>
</article>`;

const nav = (bar = false) => `
<header class="nav${bar ? " nav--bar" : ""}"><div class="wrap">
  <div class="nav-left">
    <a class="logo" href="/" aria-label="DENONOMODZ home">${svg.mark}<span>DENONOMODZ</span></a>
    <nav class="nav-links" aria-label="Sections"><a href="/#mods">Mods</a><a href="/#omarchy" data-jump="omarchy">Omarchy</a><a href="/#herdr" data-jump="herdr">Herdr</a><a href="/#claude-code" data-jump="claude-code">Skills</a><a href="${LIB_REPO}#use-it">CLI</a></nav>
  </div>
  <div class="nav-right">
    <button class="theme-chip" type="button" data-theme-toggle aria-label="Switch colour theme">theme: mono-grey ▾</button>
    <a class="gh" href="${LIB_REPO}">GitHub</a>
    <a class="btn-install" href="/#get">Install</a>
  </div>
</div></header>`;

const footer = `
<footer class="footer"><div class="wrap">
  <div class="footer-top">
    <div class="footer-brand"><strong>DENONOMODZ</strong><p>Mods for the desktop you live in, by DeNon Maryland. MIT, local-first, and every install can be undone.</p></div>
    <div class="footer-cols">
      <div><h4>MODS</h4><a href="/#omarchy" data-jump="omarchy">Omarchy</a><a href="/#herdr" data-jump="herdr">Herdr</a><a href="/#claude-code" data-jump="claude-code">Claude skills</a><a href="/#hermes" data-jump="hermes">Hermes</a></div>
      <div><h4>CLI</h4><a href="/#get">Install</a><a href="${LIB_REPO}#use-it">Commands</a><a href="${LIB_REPO}#kinds">Kinds</a><a href="${LIB_REPO}#safety">Safety</a></div>
      <div><h4>ELSEWHERE</h4><a href="${LIB_REPO}">GitHub</a><a href="${OMARCHY}" rel="noopener">omarchy.org ↗</a><a href="${HERDR}" rel="noopener">Herdr ↗</a></div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>Made for <a href="${OMARCHY}" rel="noopener">Omarchy</a> &amp; Herdr. Independent project, not affiliated with or endorsed by Omarchy.</span>
    <span>© ${new Date().getFullYear()} DeNon Maryland</span>
  </div>
</div></footer>`;

const page = ({ title, description, path, og, body }) => `<!doctype html>
<html lang="en" data-theme="grey">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0e0e0e">
<link rel="canonical" href="${esc(abs(path))}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DENONOMODZ">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(path))}">
<meta property="og:image" content="${esc(abs(og))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(abs(og))}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
<script>try{var t=localStorage.getItem("denonomodz-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<script src="/app.js" defer></script>
</head>
<body>
${body}
</body>
</html>
`;

const ogFor = (id) => existsSync(join(SITE, "public/og", `${id}.png`)) ? `/og/${id}.png` : "/og/default.png";

// ---- landing -------------------------------------------------------------------------------
const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, mods.filter((m) => m.category === c).length]));
const extraCats = [...new Set(mods.map((m) => m.category))].filter((c) => !CATEGORY_ORDER.includes(c));
const filterLabel = { omarchy: "Omarchy", herdr: "Herdr", "claude-code": "Claude skill", hermes: "Hermes" };
const filters = [`<button type="button" data-filter="all" aria-pressed="true">All ${mods.length}</button>`,
  ...[...CATEGORY_ORDER, ...extraCats].filter((c) => mods.some((m) => m.category === c))
    .map((c) => `<button type="button" data-filter="${c}" aria-pressed="false">${esc(filterLabel[c] || c)} ${counts[c] ?? mods.filter((m) => m.category === c).length}</button>`)].join("");

const landing = page({
  title: "DENONOMODZ · Mods for Omarchy, Herdr & your agents",
  description: `${mods.length} mods for Omarchy, Herdr and your agents by DeNon Maryland. Install any of them with one command, and undo it just as easily.`,
  path: "/",
  og: ogFor("default"),
  body: `
<section class="hero">
  <div class="field">${svg.field}${svg.fieldSm}</div>
  ${nav()}
  <div class="hero-body wrap">
    <a class="chip" href="#mods">${mods.length} mods for Omarchy, Herdr &amp; your agents · one command to install them →</a>
    <h1 class="sr-only">DENONOMODZ</h1>
    ${svg.led}
    <div class="hero-copy">
      <p class="hero-title">Mods for the desktop you live in</p>
      <p class="hero-sub">Plugins, layouts and agent skills by DeNon Maryland.<br> Find one, install it, change your mind: <b>denonomods</b> undoes what it does.</p>
    </div>
    <div class="ctas" id="get">
      <a class="btn btn-primary" href="${LIB_REPO}">↓ Get denonomods</a>
      <a class="btn btn-secondary" href="#mods">Browse the mods</a>
    </div>
    <div class="oneliner"><span class="dollar">$</span><code>git clone github.com/denonmaryland/denonomods &amp;&amp; ./denonomods/install.sh</code>${copyBtn("git clone https://github.com/denonmaryland/denonomods && ./denonomods/install.sh")}</div>
  </div>
</section>
<main>
<section class="mods" id="mods"><div class="wrap">
  <div class="section-head">
    <div><h2 class="h2">Every mod, one command away</h2>
    <p class="lede">Each one installs the way its own README says, asks first, and keeps a backup. Omarchy plugins go through <b>omarchy plugin</b>; the rest through their own installers.</p></div>
    <a class="link" href="${LIB_REPO}">All on GitHub →</a>
  </div>
  <div class="filters" data-filters role="group" aria-label="Filter mods">${filters}</div>
  <div class="grid">${mods.map(card).join("")}${makeCard}</div>
</div></section>
</main>
${footer}`,
});

// ---- detail pages --------------------------------------------------------------------------
const installTabs = (m) => {
  const tabs = [["denonomods", m.cmd]];
  if (m.kind === "omarchy-plugin" && m.source?.git) tabs.push(["omarchy plugin", `omarchy plugin add ${m.source.git} --enable`]);
  if (m.kind === "repo-installer" && m.source?.git) {
    const dir = m.source.git.split("/").pop().replace(/\.git$/, "");
    tabs.push(["from source", `git clone ${m.source.git}\ncd ${dir} && ${(m.install || ["./install.sh"]).join(" && ")}`]);
  }
  const tl = tabs.map(([n], i) => `<button type="button" role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}">${esc(n)}</button>`).join("");
  const panels = tabs.map(([, c], i) => `<div class="tab-panel" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}"${i ? " hidden" : ""}><code><span class="dollar">$ </span>${esc(c)}</code>${copyBtn(c)}</div>`).join("");
  return `<div class="install-box"><div class="tabs" role="tablist" aria-label="How to install">${tl}</div>${panels}
    <p class="install-note">Shows what it will do and asks first. Undo with <code>denonomods remove ${esc(m.id)}</code>.</p></div>`;
};

const figure = (m) => {
  if (m.site.figure === "spring") {
    return `<figure class="figure"><figcaption>FIG. 1 · preset "Lively", 360 ms, 25% bounce</figcaption>
      <svg viewBox="0 0 344 250" aria-hidden="true"><line x1="0" y1="70" x2="344" y2="70" stroke="var(--border)" stroke-dasharray="4 4"/><line x1="0" y1="230" x2="344" y2="230" stroke="var(--border-strong)"/><path d="M0 230 C40 230 60 40 110 52 C150 62 170 82 205 74 C235 67 250 68 280 70 L344 70" stroke="var(--brand)" stroke-width="3" fill="none"/><path d="M0 230 C70 230 120 74 344 70" stroke="var(--border-strong)" stroke-width="2" fill="none" stroke-dasharray="3 5"/></svg>
      <div class="legend"><span>— spring</span><span>- - ease-out (stock)</span></div></figure>`;
  }
  const rows = [["name", m.name], ["category", `[${m.category}]`], ["kind", m.kind], ...(m.pluginId ? [["plugin", m.pluginId]] : []), ["requires", (m.requires || []).join(", ") || "nothing extra"]];
  return `<figure class="figure"><figcaption>$ denonomods info ${esc(m.id)}</figcaption>
    <pre>${rows.map(([k, v]) => `<span>${k.padEnd(10)}</span>${esc(v)}`).join("\n")}</pre>
    <div class="legend"><span>${esc(m.platform)}</span><span>${esc(m.label)}</span></div></figure>`;
};

const meta = (m) => {
  const rows = [["kind", esc(m.kind)]];
  if (m.pluginId) rows.push(["plugin id", esc(m.pluginId)]);
  rows.push(["requires", esc((m.requires || []).join(", ") || "nothing extra")]);
  rows.push(["installs to", esc(GOES_TO[m.kind] || "see its README")]);
  rows.push(["source", m.repo ? `<a href="${esc(m.repo)}" rel="noopener">${esc(m.repo.replace(/^https:\/\/github\.com\/[^/]+\//, ""))} ↗</a>` : `<a href="${LIB_REPO}/tree/main/mods/${esc(m.id)}">bundled in denonomods ↗</a>`]);
  if (m.license) rows.push(["license", esc(m.license)]);
  return `<dl class="meta">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
};

const related = (m) => {
  const want = m.site.related || [];
  const pool = [...want.map((id) => mods.find((x) => x.id === id)).filter(Boolean),
    ...mods.filter((x) => x.category === m.category), ...mods];
  const out = [];
  for (const x of pool) if (x.id !== m.id && !out.includes(x)) out.push(x);
  return out.slice(0, 3);
};

const detail = (m) => {
  const features = m.site.features?.length
    ? m.site.features.map(([h, p]) => `<div class="feature"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")
    : `<div class="feature"><h3>What it is</h3><p>${esc(m.summary)}</p></div>`;
  const notes = [m.notes, m.afterInstall, m.removeNotes].filter(Boolean);
  return page({
    title: `${m.name} · DENONOMODZ`,
    description: m.summary,
    path: m.url,
    og: ogFor(m.id),
    body: `
${nav(true)}
<main>
<section class="detail-head"><div class="wrap">
  <div class="detail-intro">
    <p class="crumbs"><a href="/#mods">mods</a> <i>/</i> <a href="/#${esc(m.category)}" data-jump="${esc(m.category)}">${esc(m.category)}</a> <i>/</i> <b>${esc(m.id)}</b></p>
    <h1>${esc(m.name)}</h1>
    <p class="lead">${esc(m.site.lead || m.summary)}</p>
    ${tags(m)}
  </div>
  ${installTabs(m)}
</div></section>
<section class="media"><div class="wrap">
  <div class="media-main">${preview(m, true)}</div>
  ${figure(m)}
</div></section>
<section class="body"><div class="wrap">
  <div class="features"><h2 class="h2">What it changes</h2>${features}
    ${notes.length ? `<div class="feature"><h3>Good to know</h3>${notes.map((n) => `<p>${esc(n)}</p>`).join("")}</div>` : ""}</div>
  ${meta(m)}
</div></section>
<section class="more"><div class="wrap">
  <div class="section-head"><h2 class="h2">Goes well with</h2><a class="link" href="/#mods">All ${mods.length} mods →</a></div>
  <div class="grid">${related(m).map(card).join("")}</div>
</div></section>
</main>
${footer}`,
  });
};

// ---- write ---------------------------------------------------------------------------------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(SITE, "public"), DIST, { recursive: true });
writeFileSync(join(DIST, "index.html"), landing);
for (const m of mods) {
  mkdirSync(join(DIST, "mods", m.id), { recursive: true });
  writeFileSync(join(DIST, "mods", m.id, "index.html"), detail(m));
}
writeFileSync(join(DIST, "404.html"), page({ title: "Not found · DENONOMODZ", description: "That page isn't here.", path: "/404", og: "/og/default.png",
  body: `${nav(true)}<main class="body" style="min-height:60vh"><div class="wrap"><div class="features"><h1 class="h2">That page isn't here.</h1><p class="lede">Try <a class="link" href="/#mods">all the mods →</a></p></div></div></main>${footer}` }));
writeFileSync(join(DIST, "mods.json"), JSON.stringify(mods.map(({ id, name, category, kind, summary, url, cmd }) => ({ id, name, category, kind, summary, url, cmd })), null, 2));
console.log(`built ${mods.length} mods → ${DIST}${host ? ` (urls on ${host})` : ""}`);
