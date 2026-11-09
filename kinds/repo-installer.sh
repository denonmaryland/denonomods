# kind: repo-installer — a mod that ships its own installer in its own git repo.
# denonomods keeps a checkout in ~/.local/share/denonomods/src/<id> and runs the mod's steps there.
#   "source":    {"git": "<https url>"}
#   "install":   ["./install.sh"]         steps run in the checkout, in order
#   "update":    [...]                     optional; defaults to the install steps
#   "uninstall": [...]                     optional; without it, "removeNotes" says how
#   "detect":    "~/.config/..."           a path that exists once it's installed
# shellcheck shell=bash
KIND_SUMMARY="Runs the mod's own installer from its git repo"

checkout_of() { printf '%s/src/%s' "$DM_DATA" "$1"; }

kind_where() { printf '%s, then: %s' "$(mod_get "$1" .source.git)" "$(mod_get "$1" '.install | join(" && ")')"; }
kind_target() { checkout_of "$1"; }

kind_detect() {
  local p; p="$(mod_get "$1" .detect)"
  [[ -n "$p" && -e "$(home_path "$p")" ]]
}

fetch() {
  local id="$1" url co
  url="$(mod_get "$id" .source.git)"; co="$(checkout_of "$id")"
  if [[ -d "$co/.git" ]]; then
    [[ "$(command git -C "$co" remote get-url origin)" == "$url" ]] || die "$co points somewhere other than $url"
    say "Pulling $url"
    command git -C "$co" pull --ff-only --quiet
  else
    say "Cloning $url"
    mkdir -p "$(dirname "$co")"
    GIT_TERMINAL_PROMPT=0 command git clone --quiet -- "$url" "$co"
  fi
}

# run_steps <id> <install|update|uninstall>. Steps come in on fd 9 so each step keeps the
# terminal as its stdin (installers that ask "Continue?" still can).
run_steps() {
  local id="$1" which="$2" co step
  co="$(checkout_of "$id")"
  while IFS= read -r -u 9 step; do
    [[ -n "$step" ]] || continue
    say "${c_dim}\$ $step${c_off}"
    (cd "$co" && bash -c "$step") || die "$id: step failed: $step"
  done 9< <(mod_get "$id" ".$which")
}

has_steps() { [[ -n "$(mod_get "$1" ".$2")" ]]; }

kind_install() {
  local id="$1"
  has_steps "$id" install || die "$id has no install steps"
  fetch "$id"
  run_steps "$id" install
  state_set "$id" repo-installer repo "$(checkout_of "$id")" ""
  say "${c_ok}Installed${c_off} $id"
  local after; after="$(mod_get "$id" .afterInstall)"
  [[ -z "$after" ]] || say "$after"
}

kind_update() {
  local id="$1"
  fetch "$id"
  if has_steps "$id" update; then run_steps "$id" update; else run_steps "$id" install; fi
  state_set "$id" repo-installer repo "$(checkout_of "$id")" ""
}

kind_remove() {
  local id="$1" notes
  if has_steps "$id" uninstall; then
    [[ -d "$(checkout_of "$id")" ]] || fetch "$id"
    run_steps "$id" uninstall
    state_del "$id"
    return 0
  fi
  notes="$(mod_get "$id" .removeNotes)"
  die "$id has no uninstaller, so denonomods won't guess. ${notes:-See its README.}"
}

kind_check() {
  local id="$1" url
  url="$(mod_get "$id" .source.git)"
  [[ "$url" == https://* ]] || { echo "needs \"source\": {\"git\": \"https://...\"}"; return 1; }
  [[ -n "$(mod_get "$id" .install)" ]] || { echo "needs \"install\" steps"; return 1; }
  [[ -n "$(mod_get "$id" .detect)" ]] || { echo "needs a \"detect\" path"; return 1; }
  [[ -n "$(mod_get "$id" .uninstall)$(mod_get "$id" .removeNotes)" ]] || { echo "needs \"uninstall\" steps or \"removeNotes\""; return 1; }
}
