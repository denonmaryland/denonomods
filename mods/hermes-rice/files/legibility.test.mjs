// Legibility pass: contrast levels, minimum sizes, sentence-case labels.
// The fixture copies Hermes' real :root text levels (94/74/54/36% of --ui-base)
// and the exact utility classes the native components use, so a passing run
// means the plugin's overrides beat the native rules, not a toy stylesheet.
// Playwright: set PLAYWRIGHT to its index.mjs (e.g. Hermes' bundled copy) or install it where Node finds it.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const file = process.argv[2] || new URL('./plugin.js', import.meta.url);
const code = readFileSync(file, 'utf8')
  .replace(/^import .*from '@hermes\/plugin-sdk';?\s*$/m, 'const host=window.sdk;')
  .replace(/^import .*from 'react\/jsx-runtime';?\s*$/m, 'const jsx=window.jsx;')
  .replace('export default', 'window.ricePlugin =');

// Current Omarchy skin values (~/.hermes/skins/omarchy.yaml).
const BG = '#102624', BASE = '#dce8db';

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setContent(`<style>
  @layer base { :root {
    --ui-base: ${BASE}; --ui-accent: #9bc8b9; --theme-primary: #9bc8b9; --ui-stroke-tertiary: #5e706a;
    --ui-text-primary: color-mix(in srgb, var(--ui-base) 94%, transparent);
    --ui-text-secondary: color-mix(in srgb, var(--ui-base) 74%, transparent);
    --ui-text-tertiary: color-mix(in srgb, var(--ui-base) 54%, transparent);
    --ui-text-quaternary: color-mix(in srgb, var(--ui-base) 36%, transparent);
    --muted-foreground: var(--ui-text-tertiary);
    --conversation-text-base-size: 0.8125rem; --conversation-tool-base-size: 0.6875rem;
    --conversation-text-font-size: var(--conversation-text-base-size);
    --conversation-tool-font-size: var(--conversation-tool-base-size);
  } }
  body{margin:0;background:${BG};color:var(--ui-text-primary);font:14px system-ui}
  .text-\\[0\\.625rem\\]{font-size:.625rem}.text-\\[0\\.64rem\\]{font-size:.64rem}.text-\\[0\\.6875rem\\]{font-size:.6875rem}
  .text-xs{font-size:.75rem}.text-\\[0\\.8125rem\\]{font-size:.8125rem}.h-7{height:1.75rem}.h-5{height:1.25rem}
  .uppercase{text-transform:uppercase}.tracking-\\[0\\.16em\\]{letter-spacing:.16em}.font-semibold{font-weight:600}
  .text-\\(--ui-text-tertiary\\){color:var(--ui-text-tertiary)}.text-\\(--ui-text-quaternary\\){color:var(--ui-text-quaternary)}
  .text-\\(--theme-primary\\){color:var(--theme-primary)}
  [data-contrib-shell]{display:flex;flex-direction:column;height:100vh}[data-tree-split]{display:flex;flex:1;min-height:0}
  [data-tree-group]{display:flex;flex-direction:column;flex:1;min-width:0}[data-tree-group="side"]{flex:0 0 268px}
  [data-slot='composer-rich-input']{position:relative;min-height:20px}
  [data-slot='composer-rich-input']:is(:empty,[data-empty])::before{content:attr(data-placeholder);color:var(--ui-text-tertiary) !important}
  footer{display:flex;align-items:stretch}
  </style>
  <div data-contrib-shell><div data-tree-split="root">
   <section data-tree-group="side"><div data-panel-header></div>
    <div data-tour="sessions-sidebar">
     <button data-slot="sidebar-menu-button" class="h-7 text-[0.8125rem]" data-nav>New session</button>
     <input class="text-xs" placeholder="Search sessions…" data-search>
     <span class="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-(--theme-primary)" data-section-label>Sessions</span>
     <div class="row-hover" data-row><span class="text-[0.8125rem]" data-row-title>Evaluate Hermes</span><span class="text-[0.625rem] text-(--ui-text-tertiary)" data-row-meta>51m</span></div>
     <span class="text-[0.6875rem] text-(--ui-text-quaternary)" data-hint>Shift-click a chat to pin</span>
    </div>
   </section>
   <section data-tree-group="main">
    <div data-panel-header><div data-zone-tabstrip><div data-tree-tab="workspace" data-active="true"><div class="pane-tab-content"><span class="text-[0.6875rem]" data-tab-label>Evaluate Hermes</span></div></div></div></div>
    <div data-chat-surface>
     <div data-slot="aui_assistant-message-content"><p style="font-size:var(--conversation-text-font-size)" data-body>Reply body</p>
      <div data-slot="tool-block" data-tool-row style="font-size:var(--conversation-tool-font-size)" class="text-(--ui-text-tertiary)" data-tool>Ran 3 commands</div></div>
     <div data-slot="composer-root"><div data-slot="composer-surface">
      <div data-slot="composer-rich-input" data-empty data-placeholder="What should we tackle?" data-composer-input></div>
      <button class="text-xs text-(--ui-text-tertiary)" aria-label="Effort Med" data-pill>Med</button>
     </div></div>
    </div>
   </section>
  </div>
  <footer data-slot="statusbar" class="h-5 text-(--ui-text-tertiary)"><span class="text-[0.6875rem] text-(--ui-text-tertiary)" data-status>Backend ready</span></footer></div>`);

  await page.evaluate(() => {
    const atom = v => ({ value: v, l: new Set(), get() { return this.value }, subscribe(f) { this.l.add(f); f(this.value); return () => this.l.delete(f) }, set(n) { this.value = n; for (const f of this.l) f(n) } });
    window.sdk = { state: { busy: atom(false), activeSessionId: atom('a'), focusedSessionId: atom('a') } };
    window.disposers = []; window.jsx = (t, p) => ({ t, p });
    window.ctx = { onDispose: f => window.disposers.push(f), register: () => () => {} };
  });

  const read = () => page.evaluate(() => {
    const q = s => document.querySelector(s); const cs = s => getComputedStyle(q(s));
    const alpha = c => { const m = c.match(/\/\s*([\d.]+)\)$/) || c.match(/rgba\([^)]*,\s*([\d.]+)\)$/); return m ? +(+m[1]).toFixed(2) : 1 };
    return {
      primaryAlpha: alpha(cs('[data-body]').color), rowAlpha: alpha(cs('[data-row]').color), tabAlpha: alpha(cs('[data-tab-label]').color),
      tertiaryAlpha: alpha(cs('[data-tool]').color), quaternaryAlpha: alpha(cs('[data-hint]').color),
      tool: cs('[data-tool]').fontSize, body: cs('[data-body]').fontSize,
      navFont: cs('[data-nav]').fontSize, navHeight: q('[data-nav]').getBoundingClientRect().height,
      rowTitle: cs('[data-row-title]').fontSize, rowMeta: cs('[data-row-meta]').fontSize, search: cs('[data-search]').fontSize,
      label: { size: cs('[data-section-label]').fontSize, transform: cs('[data-section-label]').textTransform, spacing: cs('[data-section-label]').letterSpacing },
      tab: cs('[data-tab-label]').fontSize,
      statusHeight: q('footer').getBoundingClientRect().height, status: cs('[data-status]').fontSize, statusAlpha: alpha(cs('[data-status]').color),
      pill: cs('[data-pill]').fontSize, pillAlpha: alpha(cs('[data-pill]').color),
      placeholderAlpha: alpha(getComputedStyle(q('[data-composer-input]'), '::before').color),
      font: cs('body').fontFamily, base: getComputedStyle(document.documentElement).getPropertyValue('--ui-base').trim(),
    };
  });
  const before = await read();

  await page.addScriptTag({ type: 'module', content: code + '\nwindow.ricePlugin.register(window.ctx);' });
  await page.waitForFunction(() => document.querySelector('[data-rice-shell-zone]'), {}, { timeout: 2000 });
  const after = await read();

  // 1. Contrast: same theme color, less transparency.
  assert.equal(after.primaryAlpha, 1, 'primary text is the full theme color');
  assert.equal(after.rowAlpha, 1, 'session rows full strength');
  assert.equal(after.tabAlpha, 1, 'active tab full strength');
  assert.equal(after.tertiaryAlpha, 0.7, 'tertiary text 54% → 70%');
  assert.equal(after.quaternaryAlpha, 0.5, 'quaternary text 36% → 50%');
  assert.equal(after.base, before.base, 'theme base color untouched');
  assert.equal(after.font, before.font, 'typeface untouched');
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] };
  const over = (a, fg, bg) => '#' + [1, 3, 5].map(i => Math.round(a * parseInt(fg.slice(i, i + 2), 16) + (1 - a) * parseInt(bg.slice(i, i + 2), 16)).toString(16).padStart(2, '0')).join('');
  const ratio = a => { const f = lum(over(a, BASE, BG)), b = lum(BG); return (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05) };
  assert.ok(ratio(after.tertiaryAlpha) >= 4.5, `tool/secondary text meets 4.5:1 (got ${ratio(after.tertiaryAlpha).toFixed(1)})`);
  assert.ok(ratio(after.quaternaryAlpha) >= 3, `hints/labels meet 3:1 (got ${ratio(after.quaternaryAlpha).toFixed(1)})`);
  console.log(`PASS contrast: tertiary ${ratio(before.tertiaryAlpha).toFixed(1)}:1 → ${ratio(after.tertiaryAlpha).toFixed(1)}:1, quaternary ${ratio(before.quaternaryAlpha).toFixed(1)}:1 → ${ratio(after.quaternaryAlpha).toFixed(1)}:1; theme color and font unchanged`);

  // 2. Sizes: floor of 12px, readable rows, body text left alone.
  // Fixture root is 16px; live sizes scale with Hermes' UI Scale because the plugin uses rem.
  assert.equal(after.tool, '12px'); assert.ok(parseFloat(after.tool) < parseFloat(after.body), 'tool rows stay one step under reply text');
  assert.equal(after.body, before.body, 'reply text size untouched');
  assert.equal(after.navFont, '14px'); assert.equal(after.navHeight, 32);
  assert.equal(after.rowTitle, '14px'); assert.ok(await page.locator('[data-row]').evaluate(e => e.getBoundingClientRect().height) >= 32, 'session rows 2rem tall'); assert.equal(after.rowMeta, '12px'); assert.equal(after.search, '13px');
  assert.equal(after.tab, '13px'); assert.equal(after.pill, '13px');
  assert.equal(after.status, '13px'); assert.equal(after.statusHeight, 28, 'status bar grows with its text');
  // Same sizes must follow Hermes' UI Scale (root font-size), not stay fixed px.
  await page.evaluate(() => document.documentElement.style.fontSize = '17.6px');
  const scaled = await read();
  assert.equal(scaled.rowTitle, '15.4px'); assert.equal(scaled.tab, '14.3px'); assert.equal(scaled.tool, '13.2px');
  await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
  console.log('PASS sizes (rem, at 100% scale): tool rows 11→12px, sidebar rows 13→14px in 32px rows, meta 10→12px, tabs 11→13px, pickers 12→13px, status bar 11→13px; reply text size untouched');

  // 3. Hierarchy: interactive chrome brighter, placeholders stay placeholders, labels sentence case.
  assert.equal(after.statusAlpha, 1, 'status bar full strength, like Herdr');
  assert.equal(after.pillAlpha, 0.9, 'model/effort pickers use secondary level');
  assert.equal(after.placeholderAlpha, 0.5, 'composer placeholder stays dimmer than real text');
  assert.deepEqual(after.label, { size: '13px', transform: 'none', spacing: 'normal' });
  console.log('PASS hierarchy: body/rows/active tab/status 100%, pickers 90%, placeholder 50%, section labels 13px sentence case');

  // 4. Disposal restores native values exactly.
  await page.evaluate(() => { for (const f of window.disposers.reverse()) f() });
  assert.deepEqual(await read(), before, 'disabling the plugin restores every native value');
  assert.deepEqual(errors, []);
  console.log('PASS disposal: every measured value returns to native');
} finally { await browser.close() }
