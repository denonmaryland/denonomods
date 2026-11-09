# Hermes Rice — layout A, flat shell

Removable desktop presentation plugin. No Hermes source, Hyprland configuration, palette, font family, wallpaper, or background scene changes.

## Composition

- Flat shell: the Hyprland window is the only card. Rail, sidebar and conversation sit flush inside it, separated by Hermes' own 1px seams. No inner frame, outline, rounded zone corners or inset margins.
- A 60px application rail; the layout root (`data-rice-workspace`) only reserves that width.
- Sessions and Bots are separate first-class rail destinations. Their existing native panes occupy the same contextual sidebar position.
- Rail actions for Capabilities, Messaging, Artifacts, global Scheduled jobs, and Settings use the SDK's allowlisted native navigation.
- The conversation title lives in the tab only (Hermes' own zone header hiding is left in place). 56rem reading/composer width and restrained composer/tool geometry.
- No injected sidebar label; the highlighted rail icon shows Sessions vs Bots. Tabs keep the native active underline.
- Native activity disclosure, diffs, approvals, clarification, group chat, and bot status remain native. No global auto-collapse or CSS hiding of activity/approval controls.
- Standard chat activity indicators are cosmetic additions, not authoritative group-room approval state. Bot/group room pending actions and question controls remain visible in their native UI.

## Legibility

Hermes fades most chrome text: its text levels are 94/74/54/36% of the theme's `--ui-base`, and two-thirds of the UI uses the two faintest levels at 10–12px. Following Herdr's model, anything you read or click is drawn in the full theme color: primary text is `--ui-base` itself instead of 94%, and session rows, the active tab and the status bar use primary. Dimming is reserved for metadata: secondary 90% (inactive tabs, pickers), tertiary 70% (tool rows, timestamps), quaternary 50% (hints, placeholder). `--ui-base`, palette and fonts are untouched.

Sizes are rem, so Hermes' UI Scale still applies. At 100% they are:

| Area | Size |
|---|---|
| Tool/activity rows | 12px (13.2px with chat text scale), one step under reply text |
| Session rows | 14px text in 32px rows; navigation chrome has a 12px floor (kbd chips excluded) |
| Section labels | 13px sentence case, still in the theme accent |
| Tabs and model/effort pickers | 13px; pickers use the secondary level |
| Status bar | 13px at full strength, 28px tall |

The composer placeholder uses the quaternary level so it stays clearly dimmer than typed text.

Live check: no inline token overrides elsewhere, nothing clipped, rail ends 8px above the status bar.

## Bots integration

Mode follows `host.paneVisibility('hermes-bots:pane')`, not whether a populated roster happens to exist. The rail calls `host.revealPane('hermes-bots:pane')` or `host.revealPane('sessions')`. It does not set profiles, owners, group keys, draft text, or workspace scope itself.

Populated, loading, empty and error panes stay native. Bot rows, group rows, stored-session status dots, remote/source-qualified owners, native context menus and drag handlers are not replaced. Detached keep-alive hosts are mapped to their physical zone using `data-tree-group`.

Global Scheduled jobs opens `/cron`; the native conditional `hermes-bots:routines` pane remains available as Bot scheduled jobs. New bots/group creation and group-message delivery were not invoked as part of verification.

## Narrow windows and safety

At 900px or narrower the additional rail is hidden and its sidebar-nav preferences are withdrawn, restoring the native navigation/overlay controls. The public pane-reveal API does not guarantee narrow overlays, so this plugin does not imitate that behavior. Native Sessions/Bots tabs and collapse controls remain available.

The rail removes duplicate Messaging/Artifacts/Cron rows through reversible `sidebarNav.prefs`, never a persistent settings write. Capabilities is deliberately retained as the native path to the plugin off-switch.

## Disable / rollback

Disable **Hermes Rice — floating surfaces** in Settings → Plugins. All injected elements, styles, attributes, labels, subscriptions, observers, listeners, timers and nav preferences are disposed. Native navigation returns. Re-enable to restore layout A. `denonomods remove hermes-rice` deletes the plugin folder. No app restart is needed; files hot-load.

## Tests

```sh
node ~/.hermes/desktop-plugins/hermes-rice/test.mjs
node ~/.hermes/desktop-plugins/hermes-rice/a-layout.test.mjs
node ~/.hermes/desktop-plugins/hermes-rice/legibility.test.mjs
```

Uses Playwright (set `PLAYWRIGHT=/path/to/playwright/index.mjs` if Node can't find it, e.g. Hermes' bundled copy) plus `/usr/bin/chromium`. Tests cover theme/font/transparency invariance, shared frame, responsive width, tool/composer geometry, activity transitions, mode switching, native node/draft identity, loading/error/groups/approvals, allowlisted routing, arrow/Home/End keyboard focus, detached keep-alive hosts, narrow fallback, desktop re-entry and disposal. SDK calls in those browser tests are fixtures.

Flat-shell live check: workspace radius/right/bottom margins 0, no outline pseudo-element, every layout zone radius 0, no injected label, conversation header display none, rail reservation 60px, thread 896px, Sessions → Bots → Sessions restored with drafts and owner unchanged. Earlier layout-A live check: both public pane APIs and `ctx.runAction` exist. Actual rail clicks switched Sessions → Bots → Sessions, restored the original mode, and preserved the original draft nodes/text and focused owner. The probe was removed after verification; there is no runtime diagnostic server dependency. Native mode changes update synchronously because animation frames can be suspended while an Electron window is on another workspace.

No fresh live aesthetic screenshot was claimed when another app was foreground. Future Hermes versions can change DOM hooks; preserve the SDK state/action boundary and re-check selectors after updates.
