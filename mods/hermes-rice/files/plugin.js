import { host } from '@hermes/plugin-sdk';
import { jsx } from 'react/jsx-runtime';

// Geometry and state only: no theme variables, fonts, wallpaper, or app files changed.
const CSS = `
html[data-hermes-rice] [data-tree-group]:not([data-pane-host]):not([data-composer-owner]) {
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}
html[data-hermes-rice] [data-pane-host],
html[data-hermes-rice] [data-panel-header] { border-radius: 0; }
/* Flat shell: the Hyprland window is the card. Nothing inside it is boxed. */
html[data-hermes-rice] [data-tree-tab]:not([data-vertical]) { max-width: 22rem; }
html[data-hermes-rice] [data-tree-tab]:not([data-vertical]) .pane-tab-content .uppercase {
  text-transform: none;
  letter-spacing: normal;
}
/* Layout variables only; no theme/palette or font changes. */
html[data-hermes-rice] [data-chat-surface],
html[data-hermes-rice] [data-composer-owner] {
  --composer-width: 56rem;
  --composer-shell-pad-block-end: 16px;
}
html[data-hermes-rice] [data-slot="bots-roster"] > div { padding-inline: 10px; }
html[data-hermes-rice] [data-slot="bots-roster"] [data-roster-key],
html[data-hermes-rice] [data-slot="bots-roster"] [data-slot="row-button"][draggable="true"] {
  border-radius: 10px;
  padding: 10px;
}
html[data-hermes-rice] [data-slot="bots-section-heading"] { margin-block: 5px; }
html[data-hermes-rice] [data-rice-refresh] {
  width: fit-content;
  justify-self: start;
  justify-content: flex-start;
  padding: 4px 8px;
  color: var(--ui-text-tertiary);
}
html[data-hermes-rice] [data-rice-quiet-rail] {
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  border-radius: 7px;
}
html[data-hermes-rice] [data-rice-quiet-rail] .pane-tab-content { display: none; }
html[data-hermes-rice] [data-rice-quiet-rail]::before {
  content: '◷';
  writing-mode: horizontal-tb;
  font-size: 16px;
}
html[data-hermes-rice] [data-tour="sessions-sidebar"] [data-slot="sidebar-menu-button"],
html[data-hermes-rice] [data-tour="sessions-sidebar"] .row-hover { border-radius: 9px; }
html[data-hermes-rice] [data-tour="sessions-sidebar"] .row-hover[data-working="true"] {
  box-shadow: inset 2px 0 0 var(--ui-accent);
}
html[data-hermes-rice] footer[data-slot="statusbar"] {
  margin: 0;
  border-radius: 0;
  border-top-width: 0;
  box-shadow: none;
}
html[data-hermes-rice] [data-slot="composer-surface"] {
  position: relative;
  border-radius: 18px;
  box-shadow: none;
}
html[data-hermes-rice] [data-slot="composer-surface"]:focus-within {
  outline: none;
  border-color: color-mix(in srgb, var(--ui-accent) 45%, var(--ui-stroke-secondary));
}
html[data-hermes-rice] [data-slot="tool-block"][data-tool-row]:not([data-tool-open]) {
  width: fit-content;
  max-width: 100%;
  border-radius: 6px;
  padding: 2px 0;
  box-shadow: none;
}
html[data-hermes-rice] [data-slot="tool-block"][data-tool-row][data-tool-open],
html[data-hermes-rice] [data-slot="tool-approval-card"],
html[data-hermes-rice] [data-slot="aui_assistant-message-content"] [role="alert"] {
  border-radius: 12px;
}
html[data-hermes-rice] [data-slot="tool-approval-card"] {
  outline: 1px solid var(--ui-yellow, var(--ui-accent));
  outline-offset: 2px;
}
html[data-hermes-rice] [data-slot="aui_assistant-message-content"] pre {
  border-radius: 12px;
}
html[data-hermes-rice] [data-rice-composer]::after {
  content: '';
  position: absolute;
  pointer-events: none;
  left: 12px;
  right: 12px;
  top: 0;
  height: 2px;
  border-radius: 999px;
  opacity: 0;
}
html[data-hermes-rice][data-rice-activity="working"] [data-rice-composer]::after {
  opacity: .7;
  background: linear-gradient(90deg, transparent, var(--ui-accent), transparent);
  background-size: 45% 100%;
  background-repeat: no-repeat;
  animation: hermes-rice-travel 2.4s ease-in-out infinite;
}
html[data-hermes-rice][data-rice-activity="waiting"] [data-rice-composer]::after {
  opacity: .8;
  background: var(--ui-yellow, var(--ui-accent));
}
html[data-hermes-rice][data-rice-activity="complete"] [data-rice-composer]::after {
  background: var(--ui-accent);
  animation: hermes-rice-land 1.1s ease-out both;
}
html[data-hermes-rice][data-rice-activity="error"] [data-rice-composer]::after {
  opacity: .8;
  background: var(--ui-red, var(--ui-accent));
}
html[data-hermes-rice] [data-rice-indicator] {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 4px;
  border-radius: 0;
  color: var(--ui-text-tertiary);
  box-shadow: none;
  white-space: nowrap;
}
html[data-hermes-rice] [data-rice-indicator]::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
html[data-hermes-rice][data-rice-activity="working"] [data-rice-indicator] { color: var(--ui-accent); }
html[data-hermes-rice][data-rice-activity="waiting"] [data-rice-indicator] { color: var(--ui-yellow, var(--ui-accent)); }
html[data-hermes-rice][data-rice-activity="error"] [data-rice-indicator] { color: var(--ui-red, var(--ui-accent)); }
@keyframes hermes-rice-travel { 0% { background-position: -85% 0; } 100% { background-position: 185% 0; } }
@keyframes hermes-rice-land { 0% { opacity: .8; } 100% { opacity: 0; } }
/* ── Legibility ────────────────────────────────────────────────────────────
   Same Omarchy color (--ui-base), less transparency. Hermes defines its text
   levels once on :root as 94/74/54/36% of --ui-base; html[data-hermes-rice]
   outranks that, so every native consumer inherits the brighter levels. */
html[data-hermes-rice] {
  /* Herdr model: what you read or click is the full theme color; only metadata is dimmed. */
  --ui-text-primary: var(--ui-base);
  --ui-text-secondary: color-mix(in srgb, var(--ui-base) 90%, transparent);
  --ui-text-tertiary: color-mix(in srgb, var(--ui-base) 70%, transparent);
  --ui-text-quaternary: color-mix(in srgb, var(--ui-base) 50%, transparent);
  /* Tool/activity rows: 0.6875 → 0.75rem, one step under reply text. Everything below is rem so
     Hermes' UI Scale setting still applies. Reply text size is left native. */
  --conversation-tool-base-size: 0.75rem;
}
/* Placeholders stay clearly placeholders once tertiary is brighter. */
html[data-hermes-rice] [data-slot='composer-rich-input']:is(:empty, [data-empty])::before {
  color: var(--ui-text-quaternary) !important;
}
/* 12px floor for tiny utility sizes in navigation chrome (kbd chips keep their fixed boxes). */
html[data-hermes-rice] :is([data-tour="sessions-sidebar"], [data-slot="bots-roster"], [data-rice-shell-zone])
  :is([class~="text-[0.625rem]"], [class~="text-[0.64rem]"], [class~="text-[0.6875rem]"], [class~="text-[0.7rem]"]):not(kbd, kbd *) {
  font-size: 0.75rem;
}
/* Sidebar rows and navigation: 14px in 32px rows (the list measures rows after paint). */
html[data-hermes-rice] :is([data-tour="sessions-sidebar"], [data-slot="bots-roster"]) [data-slot="sidebar-menu-button"] {
  height: 2rem; min-height: 2rem; font-size: 0.875rem;
}
html[data-hermes-rice] [data-tour="sessions-sidebar"] .row-hover { min-height: 2rem; }
html[data-hermes-rice] :is([data-tour="sessions-sidebar"], [data-slot="bots-roster"]) :is(.row-hover, [data-slot="row-button"]) [class~="text-[0.8125rem]"] {
  font-size: 0.875rem;
}
html[data-hermes-rice] :is([data-tour="sessions-sidebar"], [data-slot="bots-roster"]) input { font-size: 0.8125rem; }
/* Row names are what you click: full strength, like Herdr. Metadata keeps its dimmer level. */
html[data-hermes-rice] :is([data-tour="sessions-sidebar"] .row-hover, [data-slot="bots-roster"] [data-slot="row-button"]) { color: var(--ui-text-primary); }
/* Section labels: tiny spaced capitals → 13px sentence case, still in the theme accent. */
html[data-hermes-rice] [class~="uppercase"][class~="tracking-[0.16em]"],
html[data-hermes-rice] :is([data-tour="sessions-sidebar"], [data-slot="bots-roster"], [data-rice-shell-zone]) [class~="uppercase"][class~="tracking-[0.16em]"][class] {
  font-size: 0.8125rem; text-transform: none; letter-spacing: normal; font-weight: 500;
}
/* Tabs. */
html[data-hermes-rice] [data-tree-tab]:not([data-vertical]) .pane-tab-content { color: var(--ui-text-secondary); }
html[data-hermes-rice] [data-tree-tab]:not([data-vertical]):is([data-active="true"], [aria-selected="true"]) .pane-tab-content { color: var(--ui-text-primary); }
html[data-hermes-rice] [data-tree-tab]:not([data-vertical]) .pane-tab-content,
html[data-hermes-rice] [data-tree-tab]:not([data-vertical]) .pane-tab-content
  :is([class~="text-xs"], [class~="text-[0.625rem]"], [class~="text-[0.6875rem]"]) {
  font-size: 0.8125rem;
}
/* Composer model / effort pickers: interactive, so secondary rather than tertiary. */
html[data-hermes-rice] [data-slot="composer-root"] button[class~="text-xs"] {
  font-size: 0.8125rem; color: var(--ui-text-secondary);
}
html[data-hermes-rice] [data-slot="composer-root"] button[class~="text-xs"]:hover { color: var(--ui-text-primary); }
/* Status bar: full-strength 13px text, 1.25 → 1.75rem tall. */
html[data-hermes-rice] footer[data-slot="statusbar"] {
  height: 1.75rem; min-height: 1.75rem; font-size: 0.8125rem; color: var(--ui-text-primary);
}
html[data-hermes-rice] footer[data-slot="statusbar"] :is([class~="text-xs"], [class~="text-[0.625rem]"], [class~="text-[0.6875rem]"]) {
  font-size: 0.8125rem;
}
html[data-hermes-rice] footer[data-slot="statusbar"] [class~="text-(--ui-text-tertiary)"] { color: var(--ui-text-primary); }

@media (prefers-reduced-motion: reduce) {
 html[data-hermes-rice] [data-rice-composer]::after { animation: none !important; }
}
/* The sidebar is the shell, not another card. Pane hosts may be portaled. */
html[data-hermes-rice] [data-tree-group][data-rice-shell-zone]:not([data-pane-host]):not([data-composer-owner]) {
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}
html[data-hermes-rice] [data-rice-shell-zone][data-pane-host],
html[data-hermes-rice] [data-rice-shell-zone] [data-panel-header] {
  border-radius: 0;
}

/* A: one app rail, native contextual sidebar, native conversation header. */
html[data-hermes-rice][data-rice-rail-enabled] [data-rice-workspace] { margin-left: 60px; }
html[data-hermes-rice] [data-rice-rail] {
  position: fixed; left: 7px; top: 44px; bottom: calc(1.75rem + 8px); width: 46px;
  z-index: 25; display: flex; flex-direction: column; align-items: center;
  gap: 7px; padding-block: 5px; overflow-y: auto; scrollbar-width: none;
  -webkit-app-region: no-drag; color: var(--ui-text-tertiary);
}
html[data-hermes-rice] [data-rice-rail] button {
  appearance: none; display: grid; place-items: center; flex: 0 0 36px;
  width: 36px; height: 36px; padding: 0; border: 0; border-radius: 9px;
  background: transparent; color: inherit; cursor: pointer; -webkit-app-region: no-drag;
}
html[data-hermes-rice] [data-rice-rail] button:hover { color: var(--ui-text-primary); background: var(--ui-control-hover-background); }
html[data-hermes-rice] [data-rice-rail] button[aria-pressed="true"] { color: var(--ui-accent); background: var(--ui-control-active-background); }
html[data-hermes-rice] [data-rice-rail] button:focus-visible { outline: 1px solid var(--ui-accent); outline-offset: 2px; }
html[data-hermes-rice] [data-rice-rail] svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
html[data-hermes-rice] [data-rice-rail-separator] { width: 18px; margin-block: 6px; border-top: 1px solid var(--ui-stroke-tertiary); }
html[data-hermes-rice] [data-rice-rail-spacer] { flex: 1; min-height: 16px; }
html[data-hermes-rice] [data-tour="sessions-sidebar"] [data-tour="sidebar-nav-capabilities"] { color: var(--ui-text-tertiary); }
html[data-hermes-rice] [data-slot="tool-block"][data-tool-group] [data-tool-summary] { padding-block: 5px; }
@media (max-width: 900px) {
 html[data-hermes-rice] [data-rice-rail] { display: none; }
 html[data-hermes-rice][data-rice-rail-enabled] [data-rice-workspace] { margin-left: 0; }
}

`;

export default {
  id: 'hermes-rice',
  name: 'Hermes Rice — flat shell',
  register(ctx) {
    const root = document.documentElement;
    const style = document.createElement('style');
    style.id = 'hermes-rice-styles';
    style.textContent = CSS;
    document.head.append(style);
    root.setAttribute('data-hermes-rice', '');
    let disposed = false;
    let frame = 0;
    let completedTimer = 0;
    let completionUntil = 0;
    let previousBusy = Boolean(host.state.busy.get());
    let session = (host.state.focusedSessionId || host.state.activeSessionId)?.get();
    const labels = {idle:'Rice',working:'Working',waiting:'Needs you',complete:'Done',error:'Error'};
    const visible = el => Boolean(el && el.getClientRects().length && !el.closest('[data-pane-hidden], [hidden], [inert]'));
    const injectedLabels = [];
    const hasPaneAPI = typeof host.revealPane === 'function' && typeof host.paneVisibility === 'function';
    const botsVisibility = hasPaneAPI ? host.paneVisibility('hermes-bots:pane') : null;
    const sessionsVisibility = hasPaneAPI ? host.paneVisibility('sessions') : null;
    const desktopMedia = window.matchMedia('(min-width: 901px)');
    let navPrefsDispose = null;
    let lastSidebarZone = null;
    const rail = hasPaneAPI ? document.createElement('nav') : null;
    const railItems = [
      { id: 'sessions', label: 'Sessions', pane: 'sessions', icon: '<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3Z"/>' },
      { id: 'bots', label: 'Bots', pane: 'hermes-bots:pane', icon: '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8M1 12v4M23 12v4"/>' },
      { id: 'capabilities', label: 'Capabilities', action: 'nav.capabilities', route: '/capabilities', icon: '<path d="M4 7h6m7 0h3M4 17h3m7 0h6"/><circle cx="13" cy="7" r="3"/><circle cx="10" cy="17" r="3"/>' },
      { id: 'messaging', label: 'Messaging', action: 'nav.messaging', route: '/messaging', icon: '<path d="m3 5 18 7-18 7 4-7Z M7 12h14"/>' },
      { id: 'artifacts', label: 'Artifacts', action: 'nav.artifacts', route: '/artifacts', icon: '<path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>' },
      { id: 'cron', label: 'Scheduled jobs', action: 'nav.cron', route: '/cron', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
      { id: 'settings', label: 'Settings', action: 'nav.settings', route: '/settings', icon: '<path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 3 3-1 2 3 3-2 3 1 3-3-1-3 2-2-2-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>' }
    ];
    if (rail) {
      rail.setAttribute('data-rice-rail', '');
      rail.setAttribute('aria-label', 'Hermes application');
      for (const [index, item] of railItems.entries()) {
        if (index === 2 || item.id === 'settings') {
          const separator = document.createElement('div');
          separator.setAttribute(item.id === 'settings' ? 'data-rice-rail-spacer' : 'data-rice-rail-separator', '');
          separator.setAttribute('aria-hidden', 'true');
          rail.append(separator);
        }
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.riceDestination = item.id;
        button.setAttribute('aria-label', item.label); button.title = item.label;
        button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg>`;
        button.addEventListener('click', () => {
          if (item.pane) {
            host.revealPane(item.pane);
            const current = location.hash.slice(1).split('?')[0];
            if (railItems.some(entry => entry.route === current)) host.navigate?.('/');
          } else if (typeof ctx.runAction === 'function') {
            const result = ctx.runAction(item.action);
            if (result && result.ok === false) host.notify?.({kind: 'error', message: `Could not open ${item.label}: ${result.reason || 'unavailable'}`});
          } else {
            host.navigate?.(item.route);
          }
          // Mode changes must not wait on RAF in an occluded desktop window.
          update();
        });
        rail.append(button);
      }
      rail.addEventListener('keydown', event => {
        const buttons = [...rail.querySelectorAll('button')];
        const current = buttons.indexOf(document.activeElement);
        if (current < 0 || !['ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
      });
      document.body.append(rail);
      root.setAttribute('data-rice-rail-enabled', '');
    }

    const update = () => {
      if (disposed) return;
      // Visibility is native pane state, not the presence of a populated roster.
      const botsMode = botsVisibility ? Boolean(botsVisibility.get()) : [...document.querySelectorAll('[data-pane-host="hermes-bots:pane"], [data-slot="bots-roster"]')].some(visible);
      root.dataset.riceMode = botsMode ? 'bots' : 'sessions';
      if (rail) {
        if (!rail.isConnected) document.body.append(rail);
        const path = location.hash.slice(1).split('?')[0];
        const routeItem = railItems.find(item => item.route === path);
        const selected = routeItem?.id || (botsMode ? 'bots' : 'sessions');
        for (const button of rail.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.riceDestination === selected));
        if (desktopMedia.matches && !navPrefsDispose) {
          // Capabilities is intentionally never hidden: it hosts the off-switch.
          navPrefsDispose = ctx.register({id:'rail-nav-prefs',area:'sidebarNav.prefs',data:{hide:['messaging','artifacts','cron']}});
        } else if (!desktopMedia.matches && navPrefsDispose) {
          navPrefsDispose(); navPrefsDispose = null;
        }
      }
      const shellZones = new Set();
      const selectors = botsMode ? '[data-pane-host="hermes-bots:pane"], [data-slot="bots-roster"]' : '[data-tour="sessions-sidebar"], [data-pane-host="sessions"]';
      const sidebar = [...document.querySelectorAll(selectors)].find(visible);
      const sidebarHost = sidebar?.closest('[data-tree-group]');
      const physicalZones = [...document.querySelectorAll('[data-tree-group]:not([data-pane-host]):not([data-composer-owner])')];
      let sidebarZone = sidebarHost ? physicalZones.find(zone => zone.getAttribute('data-tree-group') === sidebarHost.getAttribute('data-tree-group')) : null;
      if (!sidebarZone) {
        const tab = [...document.querySelectorAll(`[data-tree-tab="${botsMode ? 'hermes-bots:pane' : 'sessions'}"]`)].find(visible);
        sidebarZone = tab?.closest('[data-tree-group]');
      }
      if (sidebarZone) lastSidebarZone = sidebarZone;
      else if (lastSidebarZone?.isConnected && visible(lastSidebarZone)) sidebarZone = lastSidebarZone;
      const shell = document.querySelector('[data-contrib-shell]');
      let frameRoot = null;
      for (let parent = sidebarZone?.parentElement; parent && parent !== shell; parent = parent.parentElement) {
        if (parent.matches('[data-tree-split]')) frameRoot = parent;
      }
      frameRoot ||= [...document.querySelectorAll('[data-contrib-shell] [data-tree-split]')].find(visible);
      for (const old of document.querySelectorAll('[data-rice-workspace]')) if (old !== frameRoot) old.removeAttribute('data-rice-workspace');
      if (frameRoot) {
        frameRoot.setAttribute('data-rice-workspace', '');
        // Align the first rail icon with the sidebar's first row, below the native titlebar.
        const header = sidebarZone?.querySelector('[data-panel-header]');
        const top = header ? header.getBoundingClientRect().bottom : frameRoot.getBoundingClientRect().top;
        if (rail) rail.style.top = `${Math.round(top + 6)}px`;
      }
      if (sidebarHost) shellZones.add(sidebarHost);
      if (sidebarZone) shellZones.add(sidebarZone);
      for (const zone of document.querySelectorAll('[data-rice-shell-zone]')) if (!shellZones.has(zone)) zone.removeAttribute('data-rice-shell-zone');
      for (const zone of shellZones) zone.setAttribute('data-rice-shell-zone', '');
      for (const old of document.querySelectorAll('[data-rice-refresh]')) {
        if (old.textContent?.trim() !== 'Refresh gateway groups') old.removeAttribute('data-rice-refresh');
      }
      for (const button of sidebarHost?.querySelectorAll('button') || []) {
        if (button.textContent?.trim() === 'Refresh gateway groups') button.setAttribute('data-rice-refresh', '');
      }
      for (const old of document.querySelectorAll('[data-rice-quiet-rail]')) {
        if (!old.matches('[data-tree-tab="hermes-bots:routines"][data-vertical]')) old.removeAttribute('data-rice-quiet-rail');
      }
      for (const tab of document.querySelectorAll('[data-tree-tab="hermes-bots:routines"][data-vertical]')) {
        tab.setAttribute('data-rice-quiet-rail', '');
        for (const name of ['aria-label', 'title']) {
          if (!tab.hasAttribute(name)) {
            tab.setAttribute(name, 'Bot scheduled jobs');
            injectedLabels.push([tab, name, 'Bot scheduled jobs']);
          }
        }
      }
      const currentSession = (host.state.focusedSessionId || host.state.activeSessionId)?.get();
      const busy = Boolean(host.state.busy.get());
      if (currentSession !== session) {
        session = currentSession;
        previousBusy = busy;
        completionUntil = 0;
      }
      const surfaces = [...document.querySelectorAll('[data-chat-surface]')].filter(visible);
      const active = surfaces.find(el => !el.hasAttribute('data-chat-unfocused'));
      const area = active || document.querySelector('[data-contrib-shell]') || document.body;
      const approval = [...area.querySelectorAll('[data-slot="tool-approval-card"]')].some(visible);
      const replies = [...area.querySelectorAll('[data-slot="aui_assistant-message-content"]')].filter(visible);
      const last = replies.at(-1);
      const error = !busy && Boolean(last && [...last.querySelectorAll('[role="alert"]')].some(visible));
      if (previousBusy && !busy && !approval && !error) {
        completionUntil = Date.now() + 1100;
        clearTimeout(completedTimer);
        completedTimer = setTimeout(update, 1150);
      }
      if (busy || approval || error) completionUntil = 0;
      previousBusy = busy;
      const activity = approval ? 'waiting' : busy ? 'working' : error ? 'error' : Date.now() < completionUntil ? 'complete' : 'idle';
      root.dataset.riceActivity = activity;
      const composers = [...document.querySelectorAll('[data-slot="composer-surface"]')].filter(visible);
      for (const el of document.querySelectorAll('[data-rice-composer]')) {
        if (!composers.includes(el)) el.removeAttribute('data-rice-composer');
      }
      for (const el of composers) {
        const surface = el.closest('[data-chat-surface]');
        const selected = surface ? surface === active : composers.length === 1;
        el.toggleAttribute('data-rice-composer', selected);
      }
      for (const chip of document.querySelectorAll('[data-rice-indicator]')) {
        if (chip.textContent !== labels[activity]) chip.textContent = labels[activity];
        chip.setAttribute('aria-label', `Hermes Rice: ${labels[activity]}`);
      }
    };
    const schedule = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(() => {frame = 0; update();});
    };
    const unsubs = [host.state.busy.subscribe(schedule)];
    const sessionAtom = host.state.focusedSessionId || host.state.activeSessionId;
    if (sessionAtom) unsubs.push(sessionAtom.subscribe(schedule));
    if (botsVisibility) unsubs.push(botsVisibility.subscribe(schedule));
    if (sessionsVisibility) unsubs.push(sessionsVisibility.subscribe(schedule));
    const onViewportChange = () => schedule();
    desktopMedia.addEventListener('change', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('hashchange', onViewportChange);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['data-chat-unfocused','data-pane-hidden','hidden','inert','data-tool-open','data-vertical']});
    ctx.register({
      id:'activity', area:'statusBar.right', order:190,
      render:() => jsx('span', {'data-rice-indicator':'', title:'Hermes Rice · flat shell · disable in Settings → Plugins', children:'Rice'})
    });
    ctx.onDispose(() => {
      disposed = true;
      observer.disconnect();
      rail?.remove();
      navPrefsDispose?.();
      desktopMedia.removeEventListener('change', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('hashchange', onViewportChange);
      root.removeAttribute('data-rice-rail-enabled');
      delete root.dataset.riceMode;
      unsubs.forEach(fn=>fn());
      cancelAnimationFrame(frame);
      clearTimeout(completedTimer);
      style.remove();
      root.removeAttribute('data-hermes-rice');
      delete root.dataset.riceActivity;
      for (const el of document.querySelectorAll('[data-rice-composer]')) el.removeAttribute('data-rice-composer');
      for (const el of document.querySelectorAll('[data-rice-shell-zone]')) el.removeAttribute('data-rice-shell-zone');
      for (const el of document.querySelectorAll('[data-rice-refresh]')) el.removeAttribute('data-rice-refresh');
      for (const el of document.querySelectorAll('[data-rice-quiet-rail]')) el.removeAttribute('data-rice-quiet-rail');
      for (const [el, name, value] of injectedLabels) {
        if (el.getAttribute(name) === value) el.removeAttribute(name);
      }
      for (const el of document.querySelectorAll('[data-rice-workspace]')) el.removeAttribute('data-rice-workspace');
    });
    update();
  }
};
