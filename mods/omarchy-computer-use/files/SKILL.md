---
name: omarchy-computer-use
description: >
  Operate desktop apps on this Omarchy/Hyprland (Wayland) machine as an agent:
  read app UIs, click buttons, fill fields, toggle controls, focus windows,
  take screenshots, send keys. Use whenever a task needs computer use / GUI
  automation here, since Codex Computer Use and other X11-only tools do not
  work on Hyprland. Routes each job to agent-desktop (AT-SPI), hyprctl, grim,
  wtype or ydotool.
---

# Computer use on Omarchy (Hyprland, Wayland)

`agent-desktop` (installed in `~/.local/bin`) reads app UIs through the AT-SPI
accessibility tree and acts on elements by ref, without moving the pointer or
stealing focus. Hyprland is not GNOME, so it only covers part of the job.
Fill the gaps with the native tools below.

Before first use in a session run `agent-desktop skills get desktop` and
`agent-desktop skills get platform`, then `agent-desktop status`.

## Who does what

| Job | Tool |
|---|---|
| See an app's UI, find elements | `agent-desktop snapshot --app <name> -i --compact`, `find`, `get`, `wait` |
| Click a button, check a box, expand, select (by ref) | `agent-desktop click/check/toggle/expand/select @ref` (headless, no pointer) |
| Type into a GTK/Qt text field | `agent-desktop type @ref "text"` |
| Type into a Chromium/Electron web field | Not possible headless (`POLICY_DENIED`, no EditableText). `agent-desktop click @ref` on the field, focus the window with hyprctl, confirm `hyprctl activewindow -j` is that window, then `wtype "text"`. Read the value back with `agent-desktop find --role textfield`. Restore the user's previous window afterwards (verified 2026-11-02) |
| Key presses / shortcuts | `wtype` (e.g. `wtype -M ctrl l -m ctrl`). `agent-desktop press` needs GNOME and fails here |
| Focus a window | `hyprctl clients -j` for the address, then `hyprctl dispatch 'hl.dsp.focus({ window = "address:0x..." })'` |
| Move/resize/close windows | `hyprctl dispatch` (Lua `hl.dsp.*` syntax). agent-desktop window control is X11-only |
| Screenshot | `grim out.png` (whole screen) or `grim -g "$(slurp)"`. agent-desktop's screenshot opens a portal consent dialog every time |
| Real pointer click (last resort) | `hyprctl dispatch 'hl.dsp.cursor.move({ x = X, y = Y })'` then `ydotool click 0xC0`. Logical coords |
| Clipboard | `agent-desktop clipboard-get/set` or `wl-copy`/`wl-paste` |
| Launch an app | `agent-desktop launch` or `omarchy launch ...` |

## Rules

- Prefer refs over pixels. Loop: snapshot, act on a ref, snapshot again to verify.
  A ref belongs to its snapshot; on `STALE_REF` take a new snapshot.
- Several windows give `AMBIGUOUS_TARGET`; pick one with `--window-id` from
  `list-windows --app <name>`.
- `--app` takes the name `list-apps` prints (e.g. `brave`, `quickshell`).
- Anything that takes focus, sends keys or moves the pointer is visible to the
  user and shares their screen. Ask before taking over the keyboard or mouse,
  and check what is focused before `wtype`/`ydotool`: keys go to whatever has
  focus.
- Never send Ctrl+Alt+F-key chords (they switch the kernel VT). If it happens:
  `ydotool key 29:1 56:1 59:1 59:0 56:0 29:0`.
- Snapshots, clipboard and screenshots contain private content. Keep them out of
  shared notes, commits and logs.

## When an app is missing from `list-apps`

The `a11y-keepalive` user service keeps the AT-SPI switch
(`org.a11y.Status.IsEnabled`) on. Without it Chromium, Electron and Qt apps
expose nothing on Hyprland.

1. `systemctl --user is-active a11y-keepalive` and
   `busctl --user get-property org.a11y.Bus /org/a11y/bus org.a11y.Status IsEnabled`
   should give `active` and `b true`.
2. Apps read the switch when they start. An app that was running before the
   service started stays invisible until it is restarted. Ask the user before
   restarting their apps.
3. Qt apps also need `QT_ACCESSIBILITY=1` in their environment.
4. Chromium/Electron trees fill in late: pass `--timeout-ms 8000` to `snapshot`.
5. The terminal's text cannot be read or typed via AT-SPI. Use the shell instead.
