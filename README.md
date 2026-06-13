# Qatar Property Pulse

A React dashboard for exploring the Qatar real estate market, aggregating listings from **Bayut** and **PropertyFinder** alongside macro data from the **Qatar Central Bank (QCB)**.

## Features

- Live listing grid with filters by area, type, purpose, and price
- Analytics tab with QCB price index chart and area-by-area price breakdown
- Source comparison between Bayut and PropertyFinder
- CSV export of filtered listings

## Getting Started

```bash
npm install
npm run dev
```

The dashboard runs on mock data by default. To connect real APIs, replace the `fetchBayut()`, `fetchPropertyFinder()`, and `fetchQCB()` functions in `App.jsx` with real fetch calls — see the comments in the file for endpoint details.

## Data Sources

| Source | Type | How to connect |
|---|---|---|
| Bayut | Listings | RapidAPI — search "Bayut API", get `x-rapidapi-key` |
| PropertyFinder | Listings | Apify — `dhrumil/propertyfinder-scraper` actor |
| QCB | Price index | qcb.gov.qa → Publications → Real Estate Price Index |
