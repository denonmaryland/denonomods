# kind: hermes-desktop-plugin — a Hermes desktop plugin, copied to ~/.hermes/desktop-plugins/<target>/.
# Hermes hot-loads these files; turn it on or off in Hermes under Settings → Plugins.
# shellcheck shell=bash
source "$DM_ROOT/lib/copy.sh"
KIND_SUMMARY="Hermes desktop plugin, copied into ${DM_HERMES_HOME/#$HOME/\~}/desktop-plugins/"

dest_of() { printf '%s/desktop-plugins/%s' "$DM_HERMES_HOME" "$(target_name "$1")"; }
kind_where() { dest_of "$1"; }
kind_target() { dest_of "$1"; }
kind_detect() { [[ -f "$(dest_of "$1")/plugin.js" ]]; }
kind_install() {
  [[ -d "$DM_HERMES_HOME" ]] || die "no Hermes home at $DM_HERMES_HOME (open Hermes once first)"
  copy_install "$1" hermes-desktop-plugin "$(dest_of "$1")"
  say "Hermes hot-loads it; switch it on or off in Hermes under Settings → Plugins."
}
kind_update() { kind_install "$1"; }
kind_remove() { copy_remove "$1" "$(dest_of "$1")"; }
kind_check() { [[ -f "$(bundled_src "$1")/plugin.js" ]] || { echo "missing plugin.js"; return 1; }; }
