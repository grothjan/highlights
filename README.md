# Highlights

A minimalist browser extension for highlighting quotes while you read — and
reviewing them afterwards in a compact panel you can copy from.

Works on all Chromium-based browsers (Chrome, Brave, Edge, Vivaldi, Arc, …).
No accounts, no sync, no tracking. Highlights are ephemeral by design: they
live only in the tab you're reading.

## What it does

- **Activate per page** — click the toolbar icon to switch the extension on
  for the current tab (`ON` badge). Click again to remove all highlights and
  switch off.
- **Select to mark** — selecting text opens a small popup: your two
  most-recent colors as circles, a `···` circle for the full pastel palette,
  and `Cancel`.
- **Click a highlight** — same popup, plus `Remove`. Picking another swatch
  recolors the highlight.
- **Review your notes** — the page's context menu gets a `Highlights` entry
  that toggles a side panel listing all highlighted quotes in document
  order. Select and copy individual quotes by hand, or use `Copy all` to get
  them as a markdown bullet list. `Clear all` wipes the page clean.
- **Unobtrusive** — popup and panel follow your system's light/dark mode;
  the six pastel colors keep the underlying text readable.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` in your browser
   (`brave://extensions`, `edge://extensions`, … — same page everywhere).
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the `highlights` folder.
5. Pin the extension to your toolbar for one-click activation.

## Usage

1. Click the **toolbar icon** on the page you want to annotate.
2. **Select text** → click a color circle to highlight, or the `···` circle
   for the full palette.
3. **Click a highlight** to change its color or `Remove` it.
4. **Right-click the page** → `Highlights` to open the notes panel.
5. When done, `Copy all`, paste into your notes app, then `Clear all`.

The context-menu entry is greyed out on pages where the extension isn't
active — activate via the toolbar icon first.

## Notes

- Highlights are **not persisted**: reloading the page removes them. Copy
  what you want to keep into your notes app.
- Everything runs locally in the tab; the extension only activates where
  you explicitly switch it on.
