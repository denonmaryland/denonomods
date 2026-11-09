# DENONOMODZ site

The landing page for the mod library: direction A ("Greyscale · Landing") from the DENONOMODZ Paper file.
Plain HTML, CSS and a few lines of JS; there is no framework and nothing to install.

```sh
node site/build.mjs          # writes site/dist from mods/*/mod.json + site/content/*.json
node site/og.mjs             # (local only, needs chromium) re-renders the OG cards into site/public/og/
python3 -m http.server -d site/dist 4321   # look at it
```

- **A new mod shows up by itself**: every `mods/<id>/mod.json` gets a card and a page at `/mods/<id>/`.
  `site/content/<id>.json` is optional and adds a label, preview image (`site/public/media/`),
  lead line, features, license and related mods. Without it the page uses the mod's summary and a pixel
  monogram for a preview.
- **OG images** are committed PNGs. A mod without one uses `og/default.png` until `og.mjs` is run again.
- **Themes**: the chip in the nav cycles mono-grey (default), mono-amber and mono-ice. It's stored per
  browser.
- **Fonts**: Geist and JetBrains Mono (variable woff2, latin), self-hosted under the SIL Open Font
  License (see `public/fonts/LICENSE-*.txt`).
- **Deploy**: `vercel.json` at the repo root builds with `node site/build.mjs` and serves `site/dist`.
  `.vercelignore` uploads only `site/` and the `mod.json` files, never the bundled mod files.
- It's an independent project: every page carries "Made for Omarchy & Herdr. Not affiliated with or
  endorsed by Omarchy." and links to omarchy.org. Don't use Omarchy's logo or name in the wordmark.
- Preview images are cropped from the mods' own repos to keep out private material (a personal X profile,
  company branding, dictation history). Check every frame before adding a new one.
