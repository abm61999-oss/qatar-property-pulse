# Qatar Property Pulse

A React dashboard for exploring the Qatar **for-sale** real estate market — real listings
from **PropertyFinder Qatar** with photos, prices, sizes and locations, plus macro context
from the Qatar Central Bank (QCB).

![Listings, analytics and export tabs over real Qatar property data]

## Features

- Live listing grid of real Qatar properties (villas, land, townhouses, apartments, penthouses)
- Filter by area, type, and max price; sort by price, size, or price/m²
- Each card links through to the original PropertyFinder listing
- Analytics tab: QCB price index chart and average price/m² by area
- CSV export of the currently filtered listings

## Getting Started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (default http://localhost:5173).

## Data

Listings live in [`src/listings.json`](src/listings.json) and are **real** properties scraped
from propertyfinder.qa — no API key or subscription required. Refresh them anytime:

```bash
node scrape.mjs
```

`scrape.mjs` reads the server-rendered listing data embedded in PropertyFinder's public
search pages (category = Buy) across villas, land, townhouses, apartments and penthouses,
normalises each record, drops hidden-price entries, and writes `src/listings.json`.

The QCB figures in the Analytics tab are illustrative until a live QCB feed is connected.

## Project Structure

| File | Purpose |
|---|---|
| `src/App.jsx` | The whole dashboard (data wiring, filters, components) |
| `src/listings.json` | Real Qatar for-sale listings (regenerate with `scrape.mjs`) |
| `scrape.mjs` | Scraper that refreshes the listings |
| `vite.config.js`, `index.html` | Vite + React setup |
