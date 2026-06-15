// Scrapes real Qatar property listings from propertyfinder.qa and writes src/listings.json
// Run: node scrape.mjs
// No API key needed — reads the server-rendered __NEXT_DATA__ JSON embedded in each search page.

import { writeFileSync } from "fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// category_id 1 = Buy (for sale). property_type_id: 35 Villa, 5 Land, 22 Townhouse, 1 Apartment, 20 Penthouse.
const TYPES = [
  { id: 35, label: "Villa" },
  { id: 5, label: "Land" },
  { id: 22, label: "Townhouse" },
  { id: 1, label: "Apartment" },
  { id: 20, label: "Penthouse" },
];
const PAGES_PER_TYPE = 2;

function extractNextData(html) {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  return JSON.parse(m[1]);
}

function mapListing(item, typeLabel, src) {
  const p = item.property;
  if (!p || !p.price) return null;
  const img = p.images && p.images[0] ? p.images[0].medium || p.images[0].small : null;
  const size = typeof p.size === "object" ? (p.size.value || 0) : (p.size || 0);
  const price = p.price.value || 0;
  const ppa = typeof p.price_per_area === "object" ? p.price_per_area.value : p.price_per_area;
  return {
    id: `${src}-${p.id}`,
    source: src,
    title: p.title || `${typeLabel} in ${p.location?.name || "Qatar"}`,
    type: p.property_type || typeLabel,
    area: p.location?.path_name?.split(",")[0]?.trim() || p.location?.name || "Doha",
    beds: p.bedrooms_value ?? (parseInt(p.bedrooms) || 0),
    baths: p.bathrooms_value ?? (parseInt(p.bathrooms) || 1),
    size,
    purpose: "For Sale",
    price,
    pricePerSqm: size ? Math.round(price / size) : (Math.round(ppa) || 0),
    furnished: /furnished/i.test(p.furnished || "") && !/unfurnished/i.test(p.furnished || ""),
    verified: !!p.is_verified,
    listedDate: p.listed_date ? new Date(p.listed_date).toLocaleDateString("en-QA") : "",
    agent: p.agent?.name || "Agent",
    img: img || "",
    url: p.share_url || "",
  };
}

async function fetchType(t) {
  const out = [];
  for (let page = 1; page <= PAGES_PER_TYPE; page++) {
    const url = `https://www.propertyfinder.qa/en/search?c=1&t=${t.id}&fu=0&ob=mr&page=${page}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
      const html = await res.text();
      const data = extractNextData(html);
      const listings = data?.props?.pageProps?.searchResult?.listings || [];
      for (const item of listings) {
        const m = mapListing(item, t.label, "PropertyFinder");
        // Drop listings with a hidden/placeholder price (real Qatar sales are well above this).
        if (m && m.price >= 50000 && m.img) out.push(m);
      }
      console.log(`  ${t.label} page ${page}: ${listings.length} raw`);
    } catch (e) {
      console.log(`  ${t.label} page ${page}: ERROR ${e.message}`);
    }
  }
  return out;
}

async function main() {
  let all = [];
  for (const t of TYPES) {
    console.log(`Fetching ${t.label}…`);
    all = all.concat(await fetchType(t));
  }
  // De-dupe by id
  const seen = new Set();
  all = all.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
  writeFileSync(
    new URL("./src/listings.json", import.meta.url),
    JSON.stringify(all, null, 2)
  );
  console.log(`\nWrote ${all.length} real listings to src/listings.json`);
}

main();
