# kind: hermes-skill — a Hermes agent skill folder, copied to ~/.hermes/skills/<target>/.
# shellcheck shell=bash
source "$DM_ROOT/lib/copy.sh"
KIND_SUMMARY="Hermes skill, copied into ${DM_HERMES_HOME/#$HOME/\~}/skills/"

dest_of() { printf '%s/skills/%s' "$DM_HERMES_HOME" "$(target_name "$1")"; }
kind_where() { dest_of "$1"; }
kind_target() { dest_of "$1"; }
kind_detect() { [[ -f "$(dest_of "$1")/SKILL.md" ]]; }
kind_install() { copy_install "$1" hermes-skill "$(dest_of "$1")"; }
kind_update() { kind_install "$1"; }
kind_remove() { copy_remove "$1" "$(dest_of "$1")"; }
kind_check() { [[ -f "$(bundled_src "$1")/SKILL.md" ]] || { echo "missing SKILL.md"; return 1; }; }
