# kind: omarchy-plugin — an Omarchy shell plugin, through Omarchy's own `omarchy plugin` commands.
#   "source": {"git": "<url>"}       -> omarchy plugin add/update/remove
#   "source": {"bundled": "<dir>"}   -> copied to ~/.config/omarchy/plugins/<pluginId>, then enabled
# Omarchy validates the plugin, refuses id clashes and keeps a backup when it removes one.
# shellcheck shell=bash
source "$DM_ROOT/lib/copy.sh"
KIND_SUMMARY="Omarchy shell plugin, managed with 'omarchy plugin'"

plugin_id() {
  local pid; pid="$(mod_get "$1" .pluginId)"
  [[ "$pid" =~ ^[A-Za-z0-9._-]+$ && "$pid" != .* ]] || die "$1: needs a valid \"pluginId\""
  printf '%s' "$pid"
}
plugin_url() { mod_get "$1" .source.git; }
plugin_dir() { printf '%s/.config/omarchy/plugins/%s' "$HOME" "$(plugin_id "$1")"; }
restart_hint() { say "Run 'omarchy restart shell' to load it."; }

kind_where() { printf '%s (plugin %s)' "$(plugin_dir "$1")" "$(plugin_id "$1")"; }
kind_target() { plugin_dir "$1"; }

kind_detect() {
  local pid; pid="$(plugin_id "$1")"
  command omarchy plugin list --json 2>/dev/null | jq -e --arg id "$pid" 'any(.[]?; .id == $id)' >/dev/null
}

kind_install() {
  local id="$1" pid url
  pid="$(plugin_id "$id")"; url="$(plugin_url "$id")"
  if [[ -n "$url" ]]; then
    if kind_detect "$id"; then
      state_set "$id" omarchy-plugin adopted "$(plugin_dir "$id")" ""
      say "$pid is already installed; denonomods now tracks it (update with: denonomods update $id)"
      return 0
    fi
    command omarchy plugin add "$url" --enable --yes
    state_set "$id" omarchy-plugin git "$(plugin_dir "$id")" ""
  else
    command omarchy plugin validate "$(bundled_src "$id")" >/dev/null || die "$id: Omarchy rejected the bundled plugin"
    copy_install "$id" omarchy-plugin "$(plugin_dir "$id")"
    command omarchy plugin enable "$pid"
  fi
  say "${c_ok}Installed${c_off} $pid"
  restart_hint
}

kind_update() {
  local id="$1"
  if [[ -n "$(plugin_url "$id")" ]]; then
    command omarchy plugin update "$(plugin_id "$id")" --yes
  else
    copy_install "$id" omarchy-plugin "$(plugin_dir "$id")"
  fi
  restart_hint
}

kind_remove() {
  local id="$1" pid
  pid="$(plugin_id "$id")"
  state_has "$id" || die "$id isn't tracked by denonomods; leaving it alone"
  if kind_detect "$id"; then command omarchy plugin remove "$pid" --yes; fi
  state_del "$id"
  restart_hint
}

kind_check() {
  local id="$1" url
  url="$(plugin_url "$id")"
  [[ -n "$(mod_get "$id" .pluginId)" ]] || { echo "missing pluginId"; return 1; }
  if [[ -z "$url" ]]; then
    [[ -f "$(bundled_src "$id")/manifest.json" ]] || { echo "bundled plugin has no manifest.json"; return 1; }
    [[ "$(jq -r .id "$(bundled_src "$id")/manifest.json")" == "$(mod_get "$id" .pluginId)" ]] \
      || { echo "pluginId doesn't match the bundled manifest.json id"; return 1; }
  elif [[ "$url" != https://* ]]; then
    echo "git source should be an https:// URL"; return 1
  fi
}
