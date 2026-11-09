#!/usr/bin/env bash
# DENONOMODS tests. Everything runs in a throwaway sandbox: HOME, every XDG folder,
# CLAUDE_CONFIG_DIR and HERMES_HOME point into a temp dir, and `omarchy` and `git` are
# stand-ins, so nothing touches the real desktop. A temp HOME alone is not enough
# here: an inherited XDG_* or HERMES_HOME would still point at live config.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
real_home="$HOME"
real_snapshot() {
  find "$real_home/.local/state/denonomods" "$real_home/.claude/skills" "$real_home/.hermes/desktop-plugins" \
    "$real_home/.hermes/skills" "$real_home/.config/omarchy/plugins" -maxdepth 2 -printf '%p %T@\n' 2>/dev/null | sort || true
}
before="$(real_snapshot)"
sandbox="$(mktemp -d)"
trap 'rm -rf "$sandbox"' EXIT

export HOME="$sandbox/home"
export XDG_CONFIG_HOME="$HOME/.config" XDG_STATE_HOME="$HOME/.local/state" \
  XDG_DATA_HOME="$HOME/.local/share" XDG_CACHE_HOME="$HOME/.cache"
export CLAUDE_CONFIG_DIR="$HOME/.claude" HERMES_HOME="$HOME/.hermes"
export NO_COLOR=1
unset DM_MODS DM_YES
mkdir -p "$HOME" "$sandbox/bin" "$sandbox/fixtures"

# --- stand-in omarchy: a fake plugin list in $HOME/omarchy-plugins.json -------------
cat >"$sandbox/bin/omarchy" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
db="$HOME/omarchy-plugins.json"; [[ -f "$db" ]] || echo '[]' >"$db"
echo "omarchy $*" >>"$HOME/omarchy.log"
[[ "$1" == plugin ]] || exit 2
case "$2" in
  list) cat "$db" ;;
  add) id="$(basename "$3" .git)"; id="${id#omarchy-}"; id="test.$id"
       jq --arg id "$id" '. + [{id: $id}]' "$db" >"$db.t" && mv "$db.t" "$db" ;;
  enable) jq --arg id "$3" 'if any(.[]; .id == $id) then . else . + [{id: $id}] end' "$db" >"$db.t" && mv "$db.t" "$db" ;;
  remove) jq --arg id "$3" 'map(select(.id != $id))' "$db" >"$db.t" && mv "$db.t" "$db" ;;
  update) : ;;
  validate) [[ -f "$3/manifest.json" ]] ;;
  *) exit 2 ;;
esac
EOF
# --- stand-in git: "clones" the fixture folder named after the URL's last part --------
cat >"$sandbox/bin/git" <<EOF
#!/usr/bin/env bash
set -euo pipefail
echo "git \$*" >>"\$HOME/git.log"
if [[ "\$1" == clone ]]; then
  url="\${@: -2:1}"; dest="\${@: -1}"
  cp -a "$sandbox/fixtures/\$(basename "\$url")" "\$dest"
  mkdir -p "\$dest/.git"; echo "\$url" >"\$dest/.git/url"
elif [[ "\$1" == -C && "\$3" == remote ]]; then cat "\$2/.git/url"
elif [[ "\$1" == -C && "\$3" == pull ]]; then :
else exec /usr/bin/git "\$@"
fi
EOF
chmod +x "$sandbox/bin/omarchy" "$sandbox/bin/git"
export PATH="$sandbox/bin:$PATH"
# This desktop exports an `omarchy` shell function; exported functions beat PATH in child
# shells, so they'd skip the stand-ins and run the real thing. Plant a decoy to prove
# denonomods goes through PATH (`command omarchy`), then the stand-in catches every call.
omarchy() { echo "decoy $*" >>"$HOME/decoy.log"; }
git() { echo "decoy git $*" >>"$HOME/decoy.log"; }
export -f omarchy git

pass=0 fail=0
ok() { pass=$((pass + 1)); printf '  ok   %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf '  FAIL %s\n' "$1"; [[ -z "${2:-}" ]] || printf '%s\n' "$2" | sed 's/^/       /'; }
dm() { "$repo/denonomods" "$@" </dev/null 2>&1; }
expect_ok() { local name="$1"; shift; local out; if out="$("$@")"; then ok "$name"; else bad "$name" "$out"; fi; }
expect_fail() { local name="$1"; shift; local out; if out="$("$@")"; then bad "$name (should have failed)" "$out"; else ok "$name"; fi; }
contains() { [[ "$1" == *"$2"* ]]; }

echo "library"
expect_ok "every mod in the library passes check" dm check
out="$(dm list)"
contains "$out" "8 mods" && ok "list shows all 8 mods" || bad "list shows all 8 mods" "$out"
for cat in omarchy herdr claude-code hermes; do
  contains "$out" "$cat" && ok "list has a $cat section" || bad "list has a $cat section" "$out"
done
expect_fail "unknown mod is an error" dm info no-such-mod
expect_fail "path-like names are refused" dm info ../mods
expect_fail "install without a terminal or --yes refuses" dm install omarchy-computer-use
[[ ! -e "$CLAUDE_CONFIG_DIR/skills/omarchy-computer-use" ]] && ok "...and changed nothing" || bad "...and changed nothing"

echo "claude-skill (bundled copy)"
skill="$CLAUDE_CONFIG_DIR/skills/omarchy-computer-use"
mkdir -p "$skill"; echo "my own older version" >"$skill/SKILL.md"
expect_ok "install over an existing copy" dm install omarchy-computer-use --yes
diff -rq "$repo/mods/omarchy-computer-use/files" "$skill" >/dev/null && ok "files match the library" || bad "files match the library"
backup="$(jq -r '.mods["omarchy-computer-use"].backup' "$XDG_STATE_HOME/denonomods/installed.json")"
[[ "$(cat "$backup/SKILL.md")" == "my own older version" ]] && ok "the old copy was backed up" || bad "the old copy was backed up"
out="$(dm install omarchy-computer-use --yes)"
contains "$out" "up to date" && ok "reinstall says it's up to date" || bad "reinstall says it's up to date" "$out"
contains "$(dm status)" "omarchy-computer-use" && ok "status lists it" || bad "status lists it"
expect_ok "remove" dm remove omarchy-computer-use --yes
[[ "$(cat "$skill/SKILL.md")" == "my own older version" ]] && ok "remove put the old copy back" || bad "remove put the old copy back"
expect_fail "remove refuses what it didn't install" dm remove omarchy-computer-use --yes

echo "adopt"
mkdir -p "$skill"; echo "already here" >"$skill/SKILL.md"
expect_ok "adopt a mod that's already on the machine" dm adopt omarchy-computer-use
[[ "$(cat "$skill/SKILL.md")" == "already here" ]] && ok "adopt changed nothing" || bad "adopt changed nothing"
contains "$(dm list)" "● omarchy-computer-use" && ok "adopted mod shows as tracked" || bad "adopted mod shows as tracked"
expect_ok "remove an adopted mod" dm remove omarchy-computer-use --yes
[[ ! -e "$skill" ]] && ok "...removes it" || bad "...removes it"
expect_fail "adopt refuses a mod that isn't there" dm adopt omarchy-computer-use

echo "hermes-desktop-plugin"
expect_fail "needs a Hermes home" dm install hermes-rice --yes
mkdir -p "$HERMES_HOME"
expect_ok "installs once Hermes exists" dm install hermes-rice --yes
[[ -f "$HERMES_HOME/desktop-plugins/hermes-rice/plugin.js" ]] && ok "plugin.js is in place" || bad "plugin.js is in place"
expect_ok "remove" dm remove hermes-rice --yes
[[ ! -e "$HERMES_HOME/desktop-plugins/hermes-rice" ]] && ok "fresh install removes cleanly" || bad "fresh install removes cleanly"

echo "omarchy-plugin (git, through the omarchy CLI)"
expect_ok "install" dm install tricky-tiles --yes
contains "$(cat "$HOME/omarchy.log")" "plugin add https://github.com/denonmaryland/omarchy-tricky-tiles --enable --yes" \
  && ok "used omarchy plugin add --enable" || bad "used omarchy plugin add --enable" "$(cat "$HOME/omarchy.log")"
echo '[{"id":"io.github.denonmaryland.theme-studio"}]' >"$HOME/omarchy-plugins.json"
: >"$HOME/omarchy.log"
out="$(dm install theme-studio --yes)"
contains "$out" "now tracks it" && ok "an already-installed plugin is adopted" || bad "an already-installed plugin is adopted" "$out"
! grep -q "plugin add" "$HOME/omarchy.log" && ok "...without re-adding it" || bad "...without re-adding it"
expect_ok "update" dm update theme-studio --yes
grep -q "plugin update io.github.denonmaryland.theme-studio --yes" "$HOME/omarchy.log" && ok "used omarchy plugin update" || bad "used omarchy plugin update"
expect_ok "remove" dm remove theme-studio --yes
grep -q "plugin remove io.github.denonmaryland.theme-studio --yes" "$HOME/omarchy.log" && ok "used omarchy plugin remove" || bad "used omarchy plugin remove"
expect_fail "untracked plugin isn't removed" dm remove hello-lock --yes

echo "repo-installer (fixture mods)"
mods="$sandbox/mods"; mkdir -p "$mods"
mkdir -p "$sandbox/fixtures/good" "$sandbox/fixtures/broken" "$sandbox/fixtures/stdin"
printf '#!/usr/bin/env bash\nmkdir -p "$HOME/.config/good" && echo installed >"$HOME/.config/good/done"\n' >"$sandbox/fixtures/good/install.sh"
chmod +x "$sandbox/fixtures/good/install.sh"
fixture() { # id, extra jq
  mkdir -p "$mods/$1"
  jq -n --arg id "$1" "{id: \$id, name: \$id, category: \"other\", kind: \"repo-installer\", summary: \"fixture\",
    source: {git: (\"https://example.invalid/\" + \$id)}, detect: (\"~/.config/\" + \$id), removeNotes: \"by hand\"} + ($2)" >"$mods/$1/mod.json"
}
fixture good '{install: ["./install.sh"]}'
fixture broken '{install: ["false", "touch \"$HOME/should-not-exist\""]}'
fixture stdin '{install: ["if read -r -t 1 line; then echo \"STOLE:$line\"; fi", "true"]}'
export DM_MODS="$mods"
expect_ok "fixture mods pass check" dm check
expect_ok "install runs the mod's own installer" dm install good --yes
[[ -f "$HOME/.config/good/done" ]] && ok "installer ran in the checkout" || bad "installer ran in the checkout"
contains "$(dm list)" "● good" && ok "list marks it installed" || bad "list marks it installed" "$(dm list)"
out="$(dm remove good --yes)" && bad "remove without an uninstaller refuses" "$out" || { contains "$out" "by hand" && ok "remove without an uninstaller refuses and says how" || bad "remove ... says how" "$out"; }
expect_fail "a failing step fails the install" dm install broken --yes
[[ ! -e "$HOME/should-not-exist" ]] && ok "...and stops before the next step" || bad "...and stops before the next step"
out="$(dm install stdin --yes)"
! contains "$out" "STOLE:true" && ok "steps don't read the step list as input" || bad "steps don't read the step list as input" "$out"

echo "shell functions"
[[ ! -e "$HOME/decoy.log" ]] && ok "exported omarchy/git functions are never called" || bad "exported omarchy/git functions are never called" "$(cat "$HOME/decoy.log")"

echo "new"
expect_ok "scaffold a Claude skill" dm new claude-code my-helper --kind claude-skill
expect_ok "scaffold an Omarchy plugin" dm new omarchy my-widget --kind omarchy-plugin
expect_ok "scaffold a Hermes plugin" dm new hermes my-look --kind hermes-desktop-plugin
expect_ok "scaffolded mods pass check" dm check
expect_fail "unknown category is refused" dm new games x --kind claude-skill
expect_fail "existing id is refused" dm new claude-code my-helper --kind claude-skill
unset DM_MODS

echo "sandbox"
[[ "$(HOME="$real_home" real_snapshot)" == "$before" ]] && ok "nothing in the real home changed" || bad "nothing in the real home changed"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
((fail == 0))
