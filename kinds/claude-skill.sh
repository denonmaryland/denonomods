# kind: claude-skill — a Claude Code skill folder, copied to ~/.claude/skills/<target>/.
# shellcheck shell=bash
source "$DM_ROOT/lib/copy.sh"
KIND_SUMMARY="Claude Code skill, copied into ${DM_CLAUDE_HOME/#$HOME/\~}/skills/"

dest_of() { printf '%s/skills/%s' "$DM_CLAUDE_HOME" "$(target_name "$1")"; }
kind_where() { dest_of "$1"; }
kind_target() { dest_of "$1"; }
kind_detect() { [[ -f "$(dest_of "$1")/SKILL.md" ]]; }
kind_install() { copy_install "$1" claude-skill "$(dest_of "$1")"; say "New Claude Code sessions pick it up."; }
kind_update() { kind_install "$1"; }
kind_remove() { copy_remove "$1" "$(dest_of "$1")"; }
kind_check() {
  local src skill name
  src="$(bundled_src "$1")"; skill="$src/SKILL.md"
  [[ -f "$skill" ]] || { echo "missing $skill"; return 1; }
  name="$(sed -n '2,10s/^name:[[:space:]]*//p' "$skill" | head -1)"
  [[ "$name" == "$(target_name "$1")" ]] || { echo "SKILL.md name '$name' should match target '$(target_name "$1")'"; return 1; }
}
