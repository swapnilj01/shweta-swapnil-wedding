# Shweta weds Swapnil - Wedding Invite Website

A mobile-first, GitHub Pages-ready wedding invitation website with:

- Modern South Indian wedding inspired design
- Direct use of the couple photo in a decorative arch frame
- Scroll-based parallax layers
- Floating petals, glowing lights, floral garlands, diya details, and reveal animations
- Countdown timer to 23 December 2026, 8 PM IST
- Google Maps and RSVP email links
- Original no-vocal romantic instrumental background loop

## Files

```text
index.html
styles.css
script.js
assets/couple.jpg
assets/couple.webp
assets/photo-glow.webp
assets/romantic-instrumental.wav
```

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload all files from this folder to the repository root.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`, then save.
6. GitHub will publish the invite URL in a few minutes.

## Music note

The page is configured to autoplay the original instrumental background music. Many mobile browsers block audible autoplay unless the visitor has interacted with the page before. The site retries automatically on page load, scroll, touch, pointer, keyboard, and visibility changes, and includes a small music control as a fallback.

## Quick edits

- Names, date, venue, map link, and RSVP are in `index.html`.
- Colors, fonts, parallax styling, and animations are in `styles.css`.
- Countdown, flower petals, parallax movement, reveal effects, and music behavior are in `script.js`.
