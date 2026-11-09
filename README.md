# DENONOMODS

**Mods for the desktop you live in.** DeNon's mod library: one command to find, install, update and
remove the mods I make for Omarchy, Herdr (Project Pals), Claude Code, Hermes and whatever comes next.

Browse them at **[denonomods.vercel.app](https://denonomods.vercel.app)**.

```
$ denonomods list

omarchy
  ● tricky-tiles           Tricky Tiles — Spring physics for switching windows and workspaces…
  ○ theme-studio           Theme Studio — Browse, apply, rotate and install Omarchy themes from the bar…
  ◐ hello-lock             Hello Lock — A lock screen that greets you…
  ○ softly                 Softly — Tap a key, speak, tap again: local Whisper dictation…
  ○ pebble-shell           Pebble Shell — The whole DeNon desktop…
herdr
  ○ project-pals           Project Pals — A Herdr layout that turns your coding agents into a crew…
claude-code
  ○ omarchy-computer-use   Omarchy Computer Use — Teaches Claude Code to drive desktop apps on Hyprland…
hermes
  ○ hermes-rice            Hermes Rice — A flat-shell look for the Hermes desktop app…
```

● installed by denonomods · ◐ on this machine but not tracked · ○ not installed

Made for Omarchy & Herdr. Not affiliated with or endorsed by [Omarchy](https://omarchy.org).

## Get it

```sh
git clone https://github.com/denonmaryland/denonomods ~/Projects/denonomods
~/Projects/denonomods/install.sh      # links `denonomods` into ~/.local/bin
```

Needs `bash`, `jq` and `git` (all on Omarchy already). Each mod lists anything else it needs.

## Use it

| Command | What it does |
|---|---|
| `denonomods list [category]` | Every mod, with what's on this machine |
| `denonomods info <mod>` | What a mod is, where it goes, what it needs |
| `denonomods install <mod>...` | Install mods. Shows what it will do and asks first |
| `denonomods update [<mod>...]` | Update mods (default: every one it installed) |
| `denonomods remove <mod>...` | Remove mods it installed. Asks first |
| `denonomods adopt <mod>...` | Start tracking a mod that's already installed, without changing it |
| `denonomods status` | What denonomods has installed |
| `denonomods new <category> <id> --kind <kind>` | Start a new mod from a template |
| `denonomods check` | Validate every mod in the library |
| `denonomods kinds` | The kinds of mod it knows how to install |

`--yes` skips the question (scripts need it, since there's no terminal to ask).

## The mods

| Mod | Category | Installs with |
|---|---|---|
| [Tricky Tiles](https://github.com/denonmaryland/omarchy-tricky-tiles) | omarchy | `omarchy plugin add` |
| [Theme Studio](https://github.com/denonmaryland/omarchy-theme-studio) | omarchy | `omarchy plugin add` |
| [Hello Lock](https://github.com/denonmaryland/hello-lock) | omarchy | `omarchy plugin add` (takes over the lock screen) |
| [Softly](https://github.com/denonmaryland/omarchy-softly) | omarchy | `omarchy plugin add` (dictation needs Voxtype) |
| [Pebble Shell](https://github.com/denonmaryland/omarchy-dotfiles) | omarchy | its own `install.sh`: the whole desktop, asks again first |
| [Project Pals](https://github.com/denonmaryland/project-pals) | herdr | its own `install.sh` |
| Omarchy Computer Use | claude-code | copied to `~/.claude/skills/` (bundled here) |
| Hermes Rice | hermes | copied to `~/.hermes/desktop-plugins/` (bundled here) |

Mods with their own repo stay there: the library points at them and installs them the way their
README says. Small mods with no repo of their own live in `mods/<id>/files/`.

## Kinds

A mod's `kind` says how it's installed. Each kind is one file in `kinds/`.

| Kind | Where it goes | Install / remove |
|---|---|---|
| `omarchy-plugin` | `~/.config/omarchy/plugins/<pluginId>` | `omarchy plugin add/enable/update/remove` (Omarchy validates it and keeps a backup on remove) |
| `repo-installer` | wherever the mod's own installer puts it | clones to `~/.local/share/denonomods/src/<id>`, runs its `install` steps; removes only with `uninstall` steps |
| `claude-skill` | `~/.claude/skills/<target>` | folder copy |
| `hermes-desktop-plugin` | `~/.hermes/desktop-plugins/<target>` | folder copy; Hermes hot-loads it |
| `hermes-skill` | `~/.hermes/skills/<target>` | folder copy |

`CLAUDE_CONFIG_DIR` and `HERMES_HOME` are honoured if set.

## Safety

- Install, update and remove say what they'll do and ask first.
- Anything a folder-copy install replaces is backed up to `~/.local/state/denonomods/backups/`
  first, and `remove` puts that earlier copy back.
- It only removes what it installed or adopted. A mod with no uninstaller isn't guessed at: it
  tells you how to undo it by hand.
- It never edits Omarchy's packaged files.
- What it installed is recorded in `~/.local/state/denonomods/installed.json`.

## Add a mod

```sh
denonomods new claude-code my-helper --kind claude-skill   # or omarchy-plugin, hermes-desktop-plugin, ...
$EDITOR mods/my-helper/mod.json mods/my-helper/files/SKILL.md
denonomods check
```

`mod.json` (comments are just for this example):

```jsonc
{
  "id": "my-helper",                      // same as the folder name
  "name": "My Helper",
  "category": "claude-code",              // omarchy | herdr | claude-code | hermes | other
  "kind": "claude-skill",                 // see `denonomods kinds`
  "summary": "One line: what it does for you",
  "source": { "bundled": "files" },       // or { "git": "https://github.com/..." }
  "requires": ["some-command"],           // commands it needs on PATH
  "notes": "Shown before installing"
}
```

Kind-specific fields: `pluginId` (omarchy-plugin); `target` (copy kinds, defaults to the id);
`install`, `update`, `uninstall`, `detect`, `removeNotes`, `afterInstall` (repo-installer).

A new kind of mod (a Herdr theme, a Hyprland snippet, a browser extension...) is a new file in
`kinds/` defining `kind_where`, `kind_target`, `kind_detect`, `kind_install`, `kind_update`,
`kind_remove` and `kind_check`. Copy one of the existing ones.

## Tests

```sh
tests/run.sh
```

Everything runs in a throwaway home with stand-in `omarchy` and `git`, and the last check
confirms nothing in the real home changed.

## The site

`site/` builds [denonomods.vercel.app](https://denonomods.vercel.app) from `mods/*/mod.json`: a card
and a page per mod, no framework. See [site/README.md](site/README.md).

```sh
node site/build.mjs                          # writes site/dist
python3 -m http.server -d site/dist 4321     # look at it
```

## Known limits

- Pebble Shell and Project Pals have no uninstaller, so `denonomods remove` refuses them and
  says where their backups are.
- Omarchy plugins are enabled in their default bar spot; move them with `omarchy bar move`.
- Installing from a git source gets what's on GitHub, which can be behind a local checkout.

## License

MIT, see [LICENSE](LICENSE). Mods with their own repo carry their own license.
The site's fonts (Geist, JetBrains Mono) are under the SIL Open Font License.
