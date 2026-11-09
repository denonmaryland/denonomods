# Shared helpers for the denonomods CLI and its kinds. Sourced, not run.
# shellcheck shell=bash

: "${DM_ROOT:?DM_ROOT must point at the denonomods checkout}"

DM_MODS="${DM_MODS:-$DM_ROOT/mods}"
DM_KINDS="$DM_ROOT/kinds"
DM_STATE="${XDG_STATE_HOME:-$HOME/.local/state}/denonomods"
DM_DATA="${XDG_DATA_HOME:-$HOME/.local/share}/denonomods"
DM_STATE_FILE="$DM_STATE/installed.json"
DM_CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
DM_HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
DM_CATEGORIES=(omarchy herdr claude-code hermes other)
DM_YES="${DM_YES:-0}"

say() { printf '%s\n' "$*"; }
warn() { printf 'denonomods: %s\n' "$*" >&2; }
die() { warn "$*"; exit 1; }

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  c_dim=$'\e[2m' c_bold=$'\e[1m' c_ok=$'\e[32m' c_off=$'\e[0m'
else
  c_dim="" c_bold="" c_ok="" c_off=""
fi

valid_id() { [[ "$1" =~ ^[a-z0-9][a-z0-9-]*$ ]]; }
mod_dir() { printf '%s/%s' "$DM_MODS" "$1"; }
mod_file() { printf '%s/%s/mod.json' "$DM_MODS" "$1"; }
mod_exists() { valid_id "$1" && [[ -f "$(mod_file "$1")" ]]; }
need_mod() { mod_exists "$1" || die "no mod called '$1' (see: denonomods list)"; }

# mod_get <id> <jq path>  -> the value, or nothing. Arrays print one item per line.
mod_get() {
  jq -r "($2) // empty | if type == \"array\" then .[] else . end" "$(mod_file "$1")"
}

all_mods() {
  local f
  for f in "$DM_MODS"/*/mod.json; do
    [[ -f "$f" ]] && basename "$(dirname "$f")"
  done
}

in_list() {
  local needle="$1"; shift
  local x
  for x in "$@"; do [[ "$x" == "$needle" ]] && return 0; done
  return 1
}

# ~/something or a plain path relative to $HOME -> absolute path.
home_path() {
  local p="$1"
  case "$p" in
    "~") printf '%s' "$HOME" ;;
    "~/"*) printf '%s/%s' "$HOME" "${p#\~/}" ;;
    /*) printf '%s' "$p" ;;
    *) printf '%s/%s' "$HOME" "$p" ;;
  esac
}

confirm() {
  [[ "$DM_YES" == 1 ]] && return 0
  [[ -t 0 ]] || die "not running in a terminal; pass --yes to go ahead"
  local answer=""
  read -r -p "$1 [y/N] " answer || answer=""
  [[ "$answer" == [yY]* ]]
}

# --- install record ---------------------------------------------------------
# ~/.local/state/denonomods/installed.json: {"mods": {"<id>": {...}}}

state_read() {
  if [[ -f "$DM_STATE_FILE" ]]; then cat "$DM_STATE_FILE"; else printf '{"mods":{}}'; fi
}
state_has() { state_read | jq -e --arg id "$1" '.mods[$id] != null' >/dev/null; }
state_get() { state_read | jq -r --arg id "$1" ".mods[\$id]$2 // empty"; }

state_write() {
  mkdir -p "$DM_STATE"
  local tmp
  tmp="$(mktemp "$DM_STATE/.installed.XXXXXX")"
  if state_read | jq "$@" >"$tmp"; then mv "$tmp" "$DM_STATE_FILE"; else rm -f "$tmp"; return 1; fi
}

# state_set <id> <kind> <how> [target] [backup]
state_set() {
  state_write --arg id "$1" --arg kind "$2" --arg how "$3" --arg target "${4:-}" --arg backup "${5:-}" \
    --arg at "$(date -Iseconds)" --arg version "$(mod_get "$1" .version)" \
    '.mods[$id] = {kind: $kind, how: $how, target: $target, backup: $backup, version: $version, installedAt: $at}'
}
state_del() { state_write --arg id "$1" 'del(.mods[$id])'; }

# backup_path <path> <id>  -> copies the path into a fresh backup folder and prints the copy's path.
backup_path() {
  local src="$1" id="$2" dir
  [[ -e "$src" || -L "$src" ]] || return 0
  mkdir -p "$DM_STATE/backups"
  dir="$(mktemp -d "$DM_STATE/backups/$(date +%Y%m%d-%H%M%S)-$id-XXXX")"
  cp -a "$src" "$dir/"
  printf '%s/%s' "$dir" "$(basename "$src")"
}

# Every mod lists the commands it needs in "requires".
check_requires() {
  local id="$1" cmd missing=()
  while IFS= read -r cmd; do
    [[ -n "$cmd" ]] || continue
    command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
  done < <(mod_get "$id" .requires)
  ((${#missing[@]} == 0)) || die "$id needs: ${missing[*]}"
}

# Run one kind function for one mod in its own bash process, so kinds can't clash and
# `set -e` holds inside it even when the caller tests the result (bash drops -e inside
# functions called from `if`/`||`, but not across processes).
kind_call() {
  local fn="$1" id="$2" kind
  kind="$(mod_get "$id" .kind)"
  [[ -f "$DM_KINDS/$kind.sh" ]] || die "$id: unknown kind '$kind'"
  DM_ROOT="$DM_ROOT" DM_MODS="$DM_MODS" DM_YES="$DM_YES" \
    "$BASH" -euo pipefail -c '
      source "$DM_ROOT/lib/common.sh"
      source "$DM_KINDS/$1.sh"
      declare -F "$2" >/dev/null || die "kind $1 has no $2"
      "$2" "$3"
    ' denonomods "$kind" "$fn" "$id"
}
