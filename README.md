# Tabloom

A fresh, calm new tab that blooms every time you open it. Tabloom is an ultra-lightweight, customizable Chrome extension (Manifest V3) powered by your real browser history, bookmarks, and open tabs.

## Features

- **Personalized Start Page:** Quick access to Bookmarks, Open Tabs, Most Visited sites, and Last Session tabs.
- **Customizable Appearance:** Themes, ambient canvas particles, custom wallpapers, glass blur, and adjustable grid layouts.
- **Privacy-Focused & Fast:** Runs client-side within your browser, storing your preferences locally.

## Development

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Build the Chrome extension
pnpm build
```

## Load in Chrome

1. Run `pnpm build` to compile the extension into the `dist/` directory.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. In the top-right corner, toggle on **Developer mode**.
4. Click the **Load unpacked** button in the top-left corner.
5. In the file picker, select the project's `dist/` directory.
6. Open a new tab to see Tabloom in action!
