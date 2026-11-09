#!/usr/bin/env bash
# Put `denonomods` on your PATH: a link in ~/.local/bin pointing at this checkout.
#   ./install.sh            link it
#   ./install.sh --remove   take the link away again
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bin="$HOME/.local/bin"
link="$bin/denonomods"

for need in jq git; do command -v "$need" >/dev/null || { echo "denonomods needs $need" >&2; exit 1; }; done

if [[ "${1:-}" == --remove ]]; then
  if [[ -L "$link" && "$(readlink -f "$link")" == "$here/denonomods" ]]; then rm "$link"; echo "Removed $link"
  else echo "No denonomods link of ours at $link"; fi
  exit 0
fi

if [[ -e "$link" && ! -L "$link" ]]; then echo "$link exists and isn't a link; leaving it alone" >&2; exit 1; fi
mkdir -p "$bin"
ln -sfn "$here/denonomods" "$link"
echo "Linked $link -> $here/denonomods"
case ":$PATH:" in *":$bin:"*) ;; *) echo "Add $bin to your PATH to run it as 'denonomods'." ;; esac
echo "Try: denonomods list"
