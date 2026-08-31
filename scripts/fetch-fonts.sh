#!/usr/bin/env bash
# Downloads the app's five fonts into assets/fonts/, in the exact file
# format the app needs (see lib/fonts.ts and the OG image generator for
# where these files get used).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONTS_DIR="$ROOT_DIR/assets/fonts"
UA="Mozilla/5.0 (Windows NT 5.1)"

# name | query (Google's family param) | dir | regular filename | semibold filename
FAMILIES=(
  "Inter|Inter:wght@400;600|inter|Inter-Regular.ttf|Inter-SemiBold.ttf"
  "Roboto|Roboto:wght@400;600|roboto|Roboto-Regular.ttf|Roboto-SemiBold.ttf"
  "Open Sans|Open+Sans:wght@400;600|open-sans|OpenSans-Regular.ttf|OpenSans-SemiBold.ttf"
  "Montserrat|Montserrat:wght@400;600|montserrat|Montserrat-Regular.ttf|Montserrat-SemiBold.ttf"
)
# Playfair Display is downloaded separately, in italic (a style choice).
PLAYFAIR_QUERY="Playfair+Display:ital,wght@1,400;1,600"
PLAYFAIR_DIR="playfair-display"
PLAYFAIR_REGULAR="PlayfairDisplay-Italic.ttf"
PLAYFAIR_SEMIBOLD="PlayfairDisplay-SemiBoldItalic.ttf"

# Pulls the two font-file download links out of Google's response.
extract_urls() {
  grep -o 'url([^)]*)' | sed -E 's/url\(([^)]*)\)/\1/'
}

fetch_family() {
  local slug_dir="$1" query="$2" regular_file="$3" semibold_file="$4" repo_slug="$5"
  local dest="$FONTS_DIR/$slug_dir"
  mkdir -p "$dest"

  echo "Fetching $slug_dir..."
  local css urls url_400 url_600
  css="$(curl -sA "$UA" "https://fonts.googleapis.com/css2?family=${query}&display=swap")"
  urls="$(printf '%s' "$css" | extract_urls)"
  url_400="$(printf '%s\n' "$urls" | sed -n '1p')"
  url_600="$(printf '%s\n' "$urls" | sed -n '2p')"

  if [[ -z "$url_400" || -z "$url_600" ]]; then
    echo "  ERROR: could not find both font URLs for $slug_dir — got:" >&2
    printf '%s\n' "$css" >&2
    exit 1
  fi

  curl -sL "$url_400" -o "$dest/$regular_file"
  curl -sL "$url_600" -o "$dest/$semibold_file"
  curl -sL "https://raw.githubusercontent.com/google/fonts/main/ofl/${repo_slug}/OFL.txt" -o "$dest/OFL.txt"

  echo "  -> $dest/$regular_file, $dest/$semibold_file, $dest/OFL.txt"
}

for entry in "${FAMILIES[@]}"; do
  IFS='|' read -r _name query dir regular semibold <<<"$entry"
  # Used to find each font's license file.
  repo_slug="${dir//-/}"
  fetch_family "$dir" "$query" "$regular" "$semibold" "$repo_slug"
done

fetch_family "$PLAYFAIR_DIR" "$PLAYFAIR_QUERY" "$PLAYFAIR_REGULAR" "$PLAYFAIR_SEMIBOLD" "playfairdisplay"

echo
echo "Done. Verify static instances with:"
echo "  pip install fonttools"
echo "  for f in assets/fonts/*/*.ttf; do ttx -l \"\$f\" 2>/dev/null | grep -q fvar && echo \"VARIABLE (bad): \$f\"; done"
echo "(no output from that loop means every file passed)"
