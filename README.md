# Shweta weds Swapnil — wedding invitation

A mobile-first, GitHub Pages-ready wedding invitation. Celebrations run **23–24 December 2026**,
with the wedding at **11 PM on 23 December** at Greenland Resort, Patia, Bhubaneshwar.

This is the **bride-side** site; the groom-side one shares this codebase and swaps `config.json`.

- Scroll-driven gate-opening intro, floating petals, diyas, jasmine garlands and florals
- Countdown to the muhurta
- Horizontally scrollable photo gallery with captions, and a tap-to-zoom viewer
- Multi-day running order, per-venue maps, calendar download, RSVP by SMS or call
- Instrumental background music
- Works fully offline of any CDN — every library is vendored in `vendor/`

---

## Adding photos — the thing you'll do most

```sh
# 1. Drop photos (JPG / PNG / HEIC / HEIF / TIFF / WebP) into photos/originals/
# 2. Optimise them:
npm run photos
# 3. Write captions in photos/photos.json
```

That's it. Full details, including what's safe to edit and how to reorder or remove photos, are in
**[`photos/README.md`](photos/README.md)**.

The gallery section **hides itself while there are no photos**, so nothing looks broken to guests
while you're still adding them.

Name files meaningfully before dropping them in — `haldi-morning-01.jpg` becomes the caption key
`haldi-morning-01`, which beats hunting for `IMG_4821`.

Needs `cwebp` (`brew install webp`) and macOS's built-in `sips`.

---

## Two repos, one codebase

The bride-side and groom-side sites run **identical** `index.html`, `styles.css` and `script.js`.
Only two things differ:

| | |
|---|---|
| `config.json` | names, parents, schedule, venues, RSVP contact, best-compliments list |
| `photos/` | the pictures for that side |

This repo holds the **bride-side** config. To spin up the groom side: copy the repo, swap
`config.json`, drop in that side's photos, run `npm run build`, and update the three absolute
URLs described below.

Every value in `config.json` also exists as hardcoded fallback text in `index.html`, so if the
file fails to load the page still reads correctly — it just shows this side's defaults.

**Conventions worth knowing:**
- `venues[0]` is treated as the headline venue for the summary card, so put the main one first.
- With exactly one venue, its name becomes the section heading and is omitted from the card, so
  it isn't printed twice.
- `bestCompliments.names` currently holds placeholders (`Name 1`…). **Replace them** — if the list
  is empty the whole section removes itself.
- Schedule entries are grouped by their `date` field, so a multi-day running order renders with
  one heading per day.

After editing the schedule in `config.json`, run:

```sh
npm run calendar     # regenerates assets/*.ics — one VEVENT per event
```

## Before you publish — one required edit

Link previews on WhatsApp, iMessage and Facebook **ignore relative image paths**. So the two
absolute URLs near the top of `index.html` must point at your real address:

```html
<link rel="canonical" href="https://<username>.github.io/shweta-swapnil-wedding/" />
<meta property="og:url"   content="https://<username>.github.io/shweta-swapnil-wedding/" />
<meta property="og:image" content="https://<username>.github.io/shweta-swapnil-wedding/assets/og-cover.jpg" />
```

They're marked with a `SITE_URL` comment block so they're easy to find. This repo is already set
to `swapnilj01.github.io/shweta-swapnil-wedding`. **The groom-side repo needs all three changed**
to its own URL, or its shared link will show this site's picture.

Test the result at [WhatsApp's link preview debugger](https://developers.facebook.com/tools/debug/)
once the site is live.

## What is and isn't in this repo

**Your full-resolution originals are deliberately not committed.** `photos/originals/` is
gitignored, because those files are ~15 MB each straight off the camera (7008×4672) and git keeps
every version forever — committing them would bloat the repo past 150 MB with no way to shrink it
back. The site doesn't need them; it serves `photos/optimized/` (~4 MB), which *is* committed.

So keep `photos/originals/` backed up somewhere of your own (Google Photos, an external drive).
You only need it locally to re-run `npm run photos`.

The original 21.5 MB `romantic-instrumental.wav` has been removed — the site plays the 1.5 MB AAC
encode of the same music instead. The whole repo is now about 7 MB.

---

## Deploy to GitHub Pages

1. Create a repository and push everything in this folder to the root.
2. **Settings → Pages → Build and deployment → Deploy from a branch.**
3. Choose `main` and `/ (root)`, then save.
4. The URL appears in a few minutes. Put it in the `SITE_URL` block above and push again.

There is **no build step on deploy** — GitHub Pages serves these files as they are. `npm run photos`
runs on your Mac, and you commit its output. The `.nojekyll` file stops Jekyll from touching anything.

## Local preview

```sh
npm run serve      # then open http://localhost:8080
```

Open it over `http://`, not by double-clicking `index.html` — the gallery loads `photos.json` with
`fetch()`, which browsers block on `file://` URLs. On `file://` the gallery quietly disappears and
the rest of the page works fine.

---

## Files

```text
index.html              markup, meta tags, SITE_URL block
styles.css              all styling; fonts are custom properties in :root
script.js               countdown, scroll effects, gallery, lightbox, music
photos/
  originals/            <- you add photos here
  optimized/            generated WebP (committed; the site serves these)
  photos.json           <- you write captions here
  README.md             the photo workflow in detail
config.json             <- everything that differs between the two repos
tools/build-photos.mjs  the photo optimiser (no npm dependencies)
tools/build-calendar.mjs generates the .ics from config.json
vendor/                 Swiper + GSAP, checked in on purpose. See vendor/README.md
assets/                 couple photo, music, calendar file, icons, share image
```

## Making changes

| To change | Edit |
|---|---|
| Names, parents, schedule, venues, RSVP contact | `config.json` (then `npm run calendar`) |
| Best-compliments names | `bestCompliments.names` in `config.json` |
| Fonts | the four `--font-*` custom properties in `:root` in `styles.css` |
| Colours | the palette custom properties at the top of `styles.css` |
| Gallery heading | `gallery.heading` in `config.json` |
| Length of the opening gate scroll | `.gate-scene { height }` in `styles.css` |
| Countdown target | `countdownTarget` in `config.json` |

## Notes

- **Music.** Browsers block audible autoplay until the visitor interacts with the page, so the
  site retries on load, scroll, touch, pointer, keypress and tab-focus, and always offers the
  music toggle in the corner.
- **Accessibility.** Honours `prefers-reduced-motion` (petals and parallax off, content still
  appears), the photo viewer is keyboard navigable and closes on Esc, and photo captions double as
  alt text when you don't write a separate one.
- **Graceful degradation.** If `vendor/` ever fails to load, the page still renders and reads
  correctly — the gallery falls back to a native scroll-snap row and reveals fall back to
  IntersectionObserver. Nothing throws.
- **Privacy.** The photo optimiser strips all EXIF metadata, so GPS coordinates baked in by phone
  cameras never reach the published site.
