# Metadata Scrubber

A privacy tool that reads and strips hidden metadata (GPS, device, timestamps, authorship) from images and PDFs. Everything runs in your browser. No file ever leaves your device.

## Supported formats

- JPEG (lossless EXIF strip)
- PNG (chunk-level metadata strip; pixels preserved byte-for-byte)
- HEIC (converted to a clean JPEG)
- PDF (info dictionary and XMP stream cleared; visual content untouched)

## Setup

```bash
npm install
npm audit --audit-level=high
```

If audit reports HIGH/CRITICAL vulnerabilities, remediate before proceeding.

## Development

```bash
npm run dev        # start Vite dev server at http://localhost:5173
npm test           # run Vitest suite
npm run build      # build production bundle to dist/
```

## Manual verification checklist

The automated test suite covers pure logic, scrubber round-trips, and component behavior. Before shipping, run this checklist against a real browser:

- [ ] **JPEG round-trip:** drop a real geotagged iPhone JPEG (transferred as-JPEG, not HEIC). GPS callout appears with coordinates. Click "Remove metadata and download." The downloaded `<name>-cleaned.jpg` opens in Preview at the same pixel dimensions. Drop the cleaned file back into the app. The report reads "No hidden metadata found."
- [ ] **PDF round-trip:** drop a Word-authored PDF. Report shows Author and Producer. Scrub. Re-drop the cleaned PDF. Report is empty. Open the cleaned PDF in Preview and verify the page count and content are unchanged.
- [ ] **HEIC round-trip:** drop an iPhone HEIC. Report shows the metadata plus the "HEIC will be converted to a clean JPEG" note. Scrub. The downloaded file is `<name>-cleaned.jpg`. Re-drop it. Report is empty.
- [ ] **PNG round-trip:** drop a PNG that contains metadata (e.g., a Photoshop export with author). Scrub. The downloaded PNG opens correctly and re-scanning shows an empty report.
- [ ] **Oversized file:** drop a file larger than 25 MB. Error banner reads "This file is over 25 MB. Try a smaller one."
- [ ] **Unsupported file:** drop a `.gif` or `.txt`. Error banner reads "Sorry, we only support JPEG, PNG, HEIC, and PDF right now."
- [ ] **Corrupt file:** rename a `.txt` to `.jpg` and drop it (magic byte check catches this -- should get the unsupported message).
- [ ] **Empty-state file:** drop an already-scrubbed JPEG. Report reads "No hidden metadata found. This file is already clean." The scrub button is not shown.
- [ ] **Network verification:** open the browser Network tab. Perform a full scrub-and-download run. Confirm zero requests carry file contents. The only requests should be the page/asset loads at start (and, if you click the "View on Google Maps" link, its navigation -- that's an explicit user action).
- [ ] **Reduced motion:** enable `prefers-reduced-motion` at the OS level. Confirm transforms are disabled but opacity/color transitions still occur.
- [ ] **Keyboard-only:** navigate the entire flow with keyboard (Tab, Enter, Space). Drop zone activates via Enter/Space, scrub button activates via Enter/Space, dismiss/reset all reachable.
- [ ] **Focus management:** after scrub completes, focus moves to the "Done. Your file is clean." heading. After an error, focus moves to the error dismiss button.

## Privacy

- CSP `connect-src 'self'` in `index.html`: the browser blocks any accidental file transmission.
- Zero analytics libraries. No tracking scripts.
- The "View on Google Maps" link is a plain `<a target="_blank" rel="noopener">`. It navigates to Google Maps only when the user chooses to click.

## Deploy

Any static host:

```bash
npm run build
# then upload dist/ to Netlify, Vercel, GitHub Pages, or a static bucket.
```

Because the app is fully client-side with a strict CSP, it also works when opened directly as a local file after `npm run build`.
