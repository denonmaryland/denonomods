// Playwright: set PLAYWRIGHT to its index.mjs (e.g. Hermes' bundled copy) or install it where Node finds it.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
import { tmpdir } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const path = process.argv[2] || new URL('./plugin.js', import.meta.url);
assert.ok(existsSync(path), 'Rice plugin must exist before its behavior can pass');
const code = readFileSync(path, 'utf8');
const browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
try {
 const page = await browser.newPage({viewport:{width:1600,height:800}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(`<style>
 :root{--ui-accent:#d8a86e;--ui-stroke-secondary:#524132;--ui-stroke-tertiary:#40372f;--ui-text-tertiary:#b6a38c;--ui-base:#eee0c6;--ui-text-primary:color-mix(in srgb, var(--ui-base) 94%, transparent);--ui-text-secondary:#cebd9f;--ui-yellow:#deb66c;--ui-red:#f08080;--ui-surface-background:rgba(34,29,24,.82);--shadow-md:0 4px 8px #0003;--shadow-sm:0 2px 4px #0002;}
 body{margin:0;font-family:monospace;background:transparent;color:var(--ui-text-primary)}
 [data-contrib-shell]{display:flex;flex-direction:column;width:100%;height:680px}[data-tree-split]{display:flex;flex:1;min-height:0;min-width:0}[data-tree-group]{min-width:0;display:flex;flex-direction:column;flex:1;overflow:hidden;background:var(--ui-surface-background)}[data-pane-host]{position:absolute;left:0;top:0;width:1px;height:1px}
 [data-tree-group="sessions"]{flex:0 0 260px}[data-slot="aui_thread-content"]{width:100%;max-width:var(--composer-width,100%);margin-inline:auto;box-sizing:border-box}[data-panel-header]{height:36px;flex-shrink:0}[data-chat-surface]{flex:1;min-height:0;overflow:auto}[data-slot="composer-surface"]{height:80px;border:1px solid var(--ui-stroke-secondary)}
 </style><main data-contrib-shell><div data-tree-split="root"><section data-tree-group="sessions"><header data-panel-header>Sessions</header><div data-slot="sidebar" data-tour="sessions-sidebar"><div class="row-hover" data-working="true">Working session</div></div></section><section data-tree-group><header data-panel-header><button data-tree-tab aria-selected="true">Chat</button></header><div data-chat-surface><div data-slot="aui_thread-content"><div data-slot="aui_assistant-message-content"><div data-slot="tool-block" data-tool-row><button>Read file</button></div><pre>Code</pre></div></div></div><div data-slot="composer-root"><div data-slot="composer-surface"><textarea aria-label="Composer"></textarea></div></div></section><div data-tree-group data-pane-host></div></div><footer data-slot="statusbar"></footer></main>`);
 await page.evaluate(()=>{
  const atom=value=>({value,listeners:new Set(),get(){return this.value},subscribe(fn){this.listeners.add(fn);fn(this.value);return()=>this.listeners.delete(fn)},set(v){this.value=v;for(const fn of this.listeners)fn(v)}});
  window.sdk={state:{busy:atom(false),activeSessionId:atom('one'),focusedSessionId:atom('one')}};
  window.disposers=[];window.ctx={onDispose:fn=>window.disposers.push(fn),register(){return()=>{}},setTimeout(fn,ms){const t=setTimeout(fn,ms);window.disposers.push(()=>clearTimeout(t));return()=>clearTimeout(t)}};
  window.jsx=(tag,props)=>({tag,props});
  window.before={color:(c=>{const m=c.match(/[\d.]+/g).map(Number).slice(0,3);return (c.startsWith('color(')?m.map(v=>Math.round(v*255)):m).join(',')})(getComputedStyle(document.body).color),font:getComputedStyle(document.body).fontFamily,background:getComputedStyle(document.body).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--ui-accent')};
 });
 const executable = code.replace(/^import .*from '@hermes\/plugin-sdk';?\s*$/m,'const host=window.sdk;').replace(/^import .*from 'react\/jsx-runtime';?\s*$/m,'const jsx=window.jsx;').replace('export default','window.ricePlugin =');
 await page.addScriptTag({type:'module',content:executable+'\nwindow.ricePlugin.register(window.ctx);'});
 await page.waitForFunction(()=>document.documentElement.hasAttribute('data-hermes-rice'));
 await page.evaluate(()=>{
  const now={color:(c=>{const m=c.match(/[\d.]+/g).map(Number).slice(0,3);return (c.startsWith('color(')?m.map(v=>Math.round(v*255)):m).join(',')})(getComputedStyle(document.body).color),font:getComputedStyle(document.body).fontFamily,background:getComputedStyle(document.body).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--ui-accent')};
  if(JSON.stringify(now)!==JSON.stringify(window.before))throw Error('Theme or font changed '+JSON.stringify([window.before,now]));
  if(document.documentElement.scrollWidth>innerWidth)throw Error('Horizontal overflow');
  const sidebar=document.querySelector('[data-tour="sessions-sidebar"]').closest('[data-tree-group]');
  if(getComputedStyle(sidebar).margin!=='0px'||getComputedStyle(sidebar).borderRadius!=='0px'||getComputedStyle(sidebar).boxShadow!=='none')throw Error('Sidebar must join outer shell, not float as a card');
  const footer=document.querySelector('footer[data-slot="statusbar"]');
  if(getComputedStyle(footer).margin!=='0px'||getComputedStyle(footer).borderRadius!=='0px'||getComputedStyle(footer).boxShadow!=='none')throw Error('Statusbar must form the continuous shell bottom');
  const host=document.querySelector('[data-pane-host]');if(getComputedStyle(host).margin!=='0px')throw Error('Keep-alive host affected');
  if(parseFloat(getComputedStyle(document.querySelector('[data-slot="composer-surface"]')).borderRadius)<12)throw Error('Composer not rounded');
 });
 assert.equal(await page.locator('[data-tree-group]:has([data-chat-surface])').evaluate(el=>getComputedStyle(el).margin),'0px');
 assert.equal(await page.locator('[data-tree-group]:has([data-chat-surface])').evaluate(el=>getComputedStyle(el).boxShadow),'none');
 assert.equal(await page.locator('[data-rice-workspace]').count(),1);
 assert.equal(await page.locator('[data-rice-workspace]').evaluate(el=>el.contains(document.querySelector('[data-tour="sessions-sidebar"]'))&&el.contains(document.querySelector('[data-chat-surface]'))),true);
 const flat=await page.locator('[data-rice-workspace]').evaluate(el=>({radius:getComputedStyle(el).borderRadius,right:getComputedStyle(el).marginRight,bottom:getComputedStyle(el).marginBottom,outline:getComputedStyle(el,'::after').content}));
 assert.deepEqual(flat,{radius:'0px',right:'0px',bottom:'0px',outline:'none'},'flat shell: no inner card outline, radius or inset');
 console.log('PASS: flat shell — sidebar and conversation sit flush in the window, no inner card');
 console.log('PASS: real Chromium CSS application preserves palette, font, transparency and anchored hosts');
 await page.evaluate(()=>{const el=document.querySelector('[data-tour="sessions-sidebar"]');el.removeAttribute('data-tour');el.dataset.slot='bots-roster';el.closest('[data-tree-group]').removeAttribute('data-rice-shell-zone');window.sdk.state.busy.set(false)});
 await page.waitForFunction(()=>document.querySelector('[data-slot="bots-roster"]').closest('[data-tree-group]').hasAttribute('data-rice-shell-zone'),{},{timeout:1500});
 console.log('PASS: current Bots sidebar joins the shell, not just the legacy Sessions sidebar');
 assert.equal(await page.locator('[data-slot="aui_thread-content"]').evaluate(el=>Math.round(el.getBoundingClientRect().width)),896);
 assert.equal(await page.locator('[data-tool-row]').evaluate(el=>getComputedStyle(el).boxShadow),'none');
 await page.locator('textarea').focus();
 assert.equal(await page.locator('[data-slot="composer-surface"]').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 await page.evaluate(()=>{
  const bot=document.createElement('button');bot.dataset.rosterKey='fixture';bot.textContent='Hermes';document.querySelector('[data-slot="bots-roster"]').append(bot);
  const rail=document.createElement('div');rail.dataset.treeTab='hermes-bots:routines';rail.dataset.vertical='true';rail.innerHTML='<div class="pane-tab-content"><span>Scheduled Jobs</span></div>';document.querySelector('[data-panel-header]').append(rail);
  const refresh=document.createElement('button');refresh.textContent='Refresh gateway groups';document.querySelector('[data-slot="bots-roster"]').parentElement.prepend(refresh);
 });
 await page.waitForFunction(()=>document.querySelector('[data-rice-quiet-rail]'));
 assert.equal(await page.locator('[data-roster-key]').evaluate(el=>getComputedStyle(el).borderRadius),'10px');
 assert.equal(await page.locator('[data-rice-quiet-rail] .pane-tab-content').evaluate(el=>getComputedStyle(el).display),'none');
 assert.equal(await page.locator('[data-rice-quiet-rail]').getAttribute('aria-label'),'Bot scheduled jobs');
 assert.equal(await page.locator('[data-rice-refresh]').count(),1);
 await page.evaluate(()=>{document.querySelector('[data-rice-quiet-rail]').removeAttribute('data-vertical');window.sdk.state.busy.set(false)});
 await page.waitForFunction(()=>!document.querySelector('[data-rice-quiet-rail]'),{},{timeout:1500});
 assert.notEqual(await page.locator('[data-tree-tab="hermes-bots:routines"] .pane-tab-content').evaluate(el=>getComputedStyle(el).display),'none');
 await page.evaluate(()=>{document.querySelector('[data-tree-tab="hermes-bots:routines"]').setAttribute('data-vertical','true');window.sdk.state.busy.set(false)});
 await page.waitForFunction(()=>document.querySelector('[data-rice-quiet-rail]'));
 console.log('PASS: narrower reading column, single composer boundary, quiet tools/sidebar/rail');
 await page.evaluate(()=>window.sdk.state.busy.set(true));
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='working');
 await page.evaluate(()=>{const n=document.createElement('div');n.dataset.slot='tool-approval-card';document.querySelector('[data-chat-surface]').append(n)});
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='waiting');
 assert.equal(await page.locator('[data-slot="tool-approval-card"]').evaluate(el=>getComputedStyle(el).outlineColor),'rgb(222, 182, 108)');
 await page.evaluate(()=>document.querySelector('[data-slot="tool-approval-card"]').remove());
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='working');
 await page.evaluate(()=>window.sdk.state.busy.set(false));
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='complete');
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='idle');
 console.log('PASS: working → approval → working → completion → idle follows real subscribed state');
 await page.evaluate(()=>{const e=document.createElement('div');e.setAttribute('role','alert');document.querySelector('[data-slot="aui_assistant-message-content"]').append(e)});
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='error');
 await page.emulateMedia({reducedMotion:'reduce'});
 const animation=await page.locator('[data-slot="composer-surface"]').evaluate(el=>getComputedStyle(el,'::after').animationName);
 assert.equal(animation,'none');
 await page.screenshot({path:`${tmpdir()}/hermes-rice-test-layout.png`});
 await page.evaluate(()=>{for(const f of window.disposers.reverse())f()});
 assert.equal(await page.locator('html[data-hermes-rice]').count(),0);
 assert.equal(await page.locator('#hermes-rice-styles').count(),0);
 assert.equal(await page.locator('[data-rice-quiet-rail], [data-rice-refresh], [data-rice-workspace]').count(),0);
 assert.equal(await page.locator('[data-tree-tab="hermes-bots:routines"]').getAttribute('aria-label'),null);
 assert.equal(await page.evaluate(()=>window.sdk.state.busy.listeners.size),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: error state, reduced motion, and complete unload cleanup');
 await page.evaluate(()=>{window.disposers=[];window.ricePlugin.register(window.ctx);document.documentElement.style.setProperty('--ui-accent','#8fbcbb');window.sdk.state.busy.set(true)});
 await page.waitForFunction(()=>document.documentElement.dataset.riceActivity==='working');
 await page.locator('textarea').focus();
 assert.equal(await page.locator('[data-slot="composer-surface"]').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 assert.match(await page.locator('[data-slot="composer-surface"]').evaluate(el=>getComputedStyle(el).borderTopColor),/color|rgb/);
 await page.setViewportSize({width:640,height:800});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.evaluate(()=>{for(const f of window.disposers.reverse())f()});
 console.log('PASS: re-enable, live theme-token changes, and narrow-window layout');
 console.log('7 browser checks passed; fixture screenshot is test evidence, not the live app.');
} finally {await browser.close()}
