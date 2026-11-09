# DENONOMODS

DeNon's mod library: a catalog (`mods/<id>/mod.json`) plus the `denonomods` CLI that installs
each mod according to its kind (`kinds/<kind>.sh`).

- Mods with their own repo stay there; add a catalog entry, don't copy their code in. Only small
  mods with no home of their own are bundled under `mods/<id>/files/`.
- Publishing (push, tag, release, production deploy) happens only with DeNon's own approval. The repo is
  public: never commit secrets, private paths, personal records or private screenshots.
- Before bundling a mod, read every file: no secrets, tokens, private app data or personal records.
- Run `tests/run.sh` after any change. It must stay sandboxed: it points HOME, every XDG folder,
  CLAUDE_CONFIG_DIR and HERMES_HOME at a temp dir and stubs `omarchy` and `git`. A temp HOME alone
  is not a sandbox here, and this desktop exports an `omarchy` shell function, so kinds call
  `command omarchy` / `command git`.
- Kinds run in their own bash process (`kind_call`), so `set -e` holds even when the caller
  tests the result. Keep it that way.
- Never edit Omarchy's packaged files; go through `omarchy plugin` commands.
- Commit as DeNon's git config identity.
