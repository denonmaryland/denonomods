# Folder-copy installs for bundled mods (skills, Hermes plugins, ...). Sourced by kinds.
# shellcheck shell=bash

# The bundled folder inside the mod, from "source": {"bundled": "files"}.
bundled_src() {
  local rel
  rel="$(mod_get "$1" .source.bundled)"
  [[ -n "$rel" ]] || die "$1: this kind needs \"source\": {\"bundled\": \"<folder>\"}"
  [[ "$rel" != *..* && "$rel" != /* ]] || die "$1: bundled folder must stay inside the mod"
  printf '%s/%s' "$(mod_dir "$1")" "$rel"
}

# The folder name it installs as: "target" in mod.json, else the mod id.
target_name() {
  local name
  name="$(mod_get "$1" .target)"
  name="${name:-$1}"
  [[ "$name" =~ ^[A-Za-z0-9._-]+$ && "$name" != .* ]] || die "$1: bad target name '$name'"
  printf '%s' "$name"
}

same_tree() { diff -rq -- "$1" "$2" >/dev/null 2>&1; }

# copy_install <id> <kind> <dest>
copy_install() {
  local id="$1" kind="$2" dest="$3" src backup="" parent stage
  src="$(bundled_src "$id")"
  [[ -d "$src" ]] || die "$id: bundled folder $src is missing"
  if [[ -e "$dest" || -L "$dest" ]]; then
    if same_tree "$src" "$dest"; then
      state_has "$id" || state_set "$id" "$kind" copy "$dest" ""
      say "$id is already installed and up to date at $dest"
      return 0
    fi
    # Keep the first "before" copy across reinstalls so remove can put it back.
    backup="$(state_get "$id" .backup)"
    if ! state_has "$id"; then backup="$(backup_path "$dest" "$id")"; say "Backed up the existing copy to $backup"; fi
  fi
  parent="$(dirname "$dest")"
  mkdir -p "$parent"
  stage="$(mktemp -d "$parent/.denonomods-$id-XXXX")"
  cp -a "$src/." "$stage/"
  rm -rf -- "$dest"
  mv "$stage" "$dest"
  state_set "$id" "$kind" copy "$dest" "$backup"
  say "${c_ok}Installed${c_off} $id -> $dest"
}

# copy_remove <id> <dest>
copy_remove() {
  local id="$1" dest="$2" recorded backup removed
  recorded="$(state_get "$id" .target)"
  [[ "$recorded" == "$dest" ]] || die "$id wasn't installed by denonomods at $dest; leaving it alone"
  backup="$(state_get "$id" .backup)"
  if [[ -e "$dest" ]]; then
    removed="$(backup_path "$dest" "$id")"
    rm -rf -- "$dest"
    say "Removed $id (a copy is kept at $removed)"
  fi
  if [[ -n "$backup" && -e "$backup" ]]; then
    cp -a "$backup" "$dest"
    say "Put back the version that was there before: $dest"
  fi
  state_del "$id"
}
