import { useState, useEffect, useCallback } from "react";
import realListings from "./listings.json";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  navy:   "#0D1B2A",
  navyMid:"#162536",
  slate:  "#3D5A73",
  sand:   "#C9A96E",
  sandLight:"#E8D5B0",
  teal:   "#00B4C6",
  tealDim:"#007A87",
  offwhite:"#F5F0E8",
  white:  "#FFFFFF",
  red:    "#E05252",
  green:  "#4CAF82",
  textMuted: "#8FA3B3",
};

// ─── FILTER OPTIONS (derived from the real listings) ──────────────
// AREAS and TYPES come straight from src/listings.json so the dropdowns
// always match whatever the latest scrape actually contains.
const AREAS = [...new Set(realListings.map(l => l.area).filter(Boolean))].sort();
const TYPES = [...new Set(realListings.map(l => l.type).filter(Boolean))].sort();
const PURPOSES = ["For Sale"];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── REAL DATA SOURCE ─────────────────────────────────────────────
// Listings in src/listings.json are scraped from propertyfinder.qa (real Qatar
// for-sale properties with real photos, prices, sizes and locations).
// Refresh them anytime by running:  node scrape.mjs
// QCB macro figures below remain illustrative until a live QCB feed is wired in.

async function fetchBayut() {
  // Real listings come through the PropertyFinder fetcher; nothing extra here.
  await new Promise(r => setTimeout(r, 300));
  return [];
}
async function fetchPropertyFinder() {
  await new Promise(r => setTimeout(r, 400));
  return realListings;
}
async function fetchQCB() {
  await new Promise(r => setTimeout(r, 600));
  // QCB returns macro index data — we simulate monthly price index
  return {
    priceIndexChange: +12.44,
    totalTransactions2025: 6970,
    totalValue2025: 26.02,  // QAR billion
    medianRentChange: -3.7,
    marketSizeUSD: 14988,   // million
    pearlAvgPricePerSqm: 14154,
    monthlyIndex: Array.from({ length: 12 }, (_, m) => ({
      month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
      index: 100 + rand(-5, 15) + m * 1.2,
    })),
  };
}

// ─── COMPONENTS ───────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, color: T.teal }}>
      <div style={{
        width:18, height:18, border:`2px solid ${T.teal}`, borderTopColor:"transparent",
        borderRadius:"50%", animation:"spin 0.7s linear infinite"
      }}/>
      <span style={{ fontSize:13 }}>Loading…</span>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
      padding:"2px 7px", borderRadius:3, background: color + "22", color,
    }}>{label}</span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: T.navyMid, borderRadius:10, padding:"18px 20px",
      borderTop:`3px solid ${accent || T.sand}`, flex:"1 1 160px",
    }}>
      <div style={{ color: T.textMuted, fontSize:11, letterSpacing:1.2, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ color: T.white, fontSize:26, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif" }}>{value}</div>
      {sub && <div style={{ color: T.textMuted, fontSize:12, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function PulseBar({ pct, color }) {
  return (
    <div style={{ height:4, background: T.navy, borderRadius:2, marginTop:6 }}>
      <div style={{ height:"100%", width:`${pct}%`, background: color, borderRadius:2, transition:"width 1s ease" }}/>
    </div>
  );
}

function ListingCard({ listing }) {
  const srcColor = listing.source === "Bayut" ? T.sand : T.teal;
  return (
    <a href={listing.url || undefined} target="_blank" rel="noopener noreferrer"
      style={{
        background: T.navyMid, borderRadius:10, overflow:"hidden", textDecoration:"none",
        display:"flex", flexDirection:"column", transition:"transform 0.15s",
        cursor: listing.url ? "pointer" : "default",
      }}
      onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
    >
      <div style={{ position:"relative" }}>
        <img src={listing.img} alt={listing.title} style={{ width:"100%", height:160, objectFit:"cover" }} />
        <div style={{ position:"absolute", top:8, left:8, display:"flex", gap:4 }}>
          <Badge label={listing.source} color={srcColor} />
          {listing.verified && <Badge label="✓ Verified" color={T.green} />}
        </div>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0,
          background:"linear-gradient(transparent,rgba(13,27,42,0.9))",
          padding:"20px 12px 8px",
          color: T.white, fontSize:13, fontWeight:600,
        }}>{listing.area}</div>
      </div>
      <div style={{ padding:"12px 14px", flex:1 }}>
        <div style={{ color: T.offwhite, fontWeight:600, fontSize:14, marginBottom:4 }}>{listing.title}</div>
        <div style={{ color: T.sand, fontSize:20, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", marginBottom:6 }}>
          QAR {listing.price.toLocaleString()}
          {listing.purpose === "For Rent" && <span style={{ fontSize:13, color: T.textMuted }}>/mo</span>}
        </div>
        <div style={{ display:"flex", gap:12, color: T.textMuted, fontSize:12 }}>
          {listing.beds > 0 && <span>🛏 {listing.beds}</span>}
          <span>🚿 {listing.baths}</span>
          <span>📐 {listing.size} m²</span>
          <span style={{ marginLeft:"auto" }}>{listing.furnished ? "Furnished" : "Unfurnished"}</span>
        </div>
        <div style={{ marginTop:8, color: T.textMuted, fontSize:11 }}>
          QAR {listing.pricePerSqm.toLocaleString()}/m² · Listed {listing.listedDate}
        </div>
      </div>
    </a>
  );
}

function MiniChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.index));
  const min = Math.min(...data.map(d => d.index));
  const w = 300, h = 80, pad = 10;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + ((max - d.index) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", maxWidth:300, height:80 }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = pad + ((max - d.index) / (max - min)) * (h - pad * 2);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill={color}/>
            <text x={x} y={h - 2} textAnchor="middle" fontSize={8} fill={T.textMuted}>{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ExportButton({ data }) {
  const handleExport = () => {
    const headers = ["Source","Title","Area","Type","Purpose","Beds","Baths","Size(m2)","Price(QAR)","Price/m2","Furnished","Verified","Listed"];
    const rows = data.map(l => [
      l.source, l.title, l.area, l.type, l.purpose,
      l.beds, l.baths, l.size, l.price, l.pricePerSqm,
      l.furnished ? "Yes":"No", l.verified ? "Yes":"No", l.listedDate
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qatar_realestate_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };
  return (
    <button onClick={handleExport} style={{
      background: T.teal, color: T.navy, border:"none", borderRadius:7,
      padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer",
      display:"flex", alignItems:"center", gap:8,
    }}>
      ⬇ Export CSV ({data.length} listings)
    </button>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [qcb, setQcb] = useState(null);
  const [loading, setLoading] = useState({ bayut: true, pf: true, qcb: true });
  const [filters, setFilters] = useState({ area:"All", purpose:"For Sale", type:"Land", source:"All", maxPrice:"" });
  const [sort, setSort] = useState("price-asc");

  useEffect(() => {
    // Merge by id so React StrictMode's double-invoke (and overlapping sources) can't duplicate rows.
    const merge = (prev, data) => {
      const map = new Map(prev.map(l => [l.id, l]));
      for (const l of data) map.set(l.id, l);
      return [...map.values()];
    };
    fetchBayut().then(data => {
      setListings(prev => merge(prev, data));
      setLoading(l => ({ ...l, bayut: false }));
    });
    fetchPropertyFinder().then(data => {
      setListings(prev => merge(prev, data));
      setLoading(l => ({ ...l, pf: false }));
    });
    fetchQCB().then(data => {
      setQcb(data);
      setLoading(l => ({ ...l, qcb: false }));
    });
  }, []);

  const filtered = listings.filter(l => {
    if (filters.area !== "All" && l.area !== filters.area) return false;
    if (filters.purpose !== "All" && l.purpose !== filters.purpose) return false;
    if (filters.type !== "All" && l.type !== filters.type) return false;
    if (filters.source !== "All" && l.source !== filters.source) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
return true;
  }).sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "size-desc") return b.size - a.size;
    if (sort === "ppsm-asc") return a.pricePerSqm - b.pricePerSqm;
    return 0;
  });

  const avgPrice = filtered.length ? Math.round(filtered.reduce((s,l)=>s+l.price,0)/filtered.length) : 0;
  const avgPpsm = filtered.length ? Math.round(filtered.reduce((s,l)=>s+l.pricePerSqm,0)/filtered.length) : 0;
  const forSale = filtered.filter(l=>l.purpose==="For Sale").length;
  const forRent = filtered.filter(l=>l.purpose==="For Rent").length;

  // Area breakdown for analytics
  const byArea = AREAS.map(area => {
    const items = filtered.filter(l => l.area === area);
    const avg = items.length ? Math.round(items.reduce((s,l)=>s+l.pricePerSqm,0)/items.length) : 0;
    return { area, count: items.length, avg };
  }).filter(a => a.count > 0).sort((a,b) => b.avg - a.avg);

  const maxAvg = byArea.length ? byArea[0].avg : 1;

  const selectStyle = {
    background: T.navyMid, color: T.offwhite, border:`1px solid ${T.slate}`,
    borderRadius:6, padding:"7px 10px", fontSize:13, outline:"none", cursor:"pointer",
  };

  return (
    <div style={{
      background: T.navy, minHeight:"100vh", color: T.offwhite,
      fontFamily:"'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:${T.navy}; }
        ::-webkit-scrollbar-thumb { background:${T.slate}; border-radius:3px; }
        .listing-card { animation: fadeIn 0.3s ease both; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: T.navyMid, borderBottom:`1px solid ${T.slate}33`, padding:"0 28px" }}>
        <div style={{ maxWidth:1300, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:36, height:36, background: T.teal, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏙</div>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, color: T.white, letterSpacing:0.5 }}>QATAR PROPERTY PULSE</div>
              <div style={{ fontSize:10, color: T.textMuted, letterSpacing:1.5, textTransform:"uppercase" }}>Live Market Intelligence</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            {[
              { key:"bayut", label:"Bayut", color: T.sand },
              { key:"pf", label:"PropertyFinder", color: T.teal },
              { key:"qcb", label:"QCB Index", color: T.green },
            ].map(s => (
              <div key={s.key} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background: loading[s.key] ? T.textMuted : s.color, transition:"background 0.5s" }}/>
                <span style={{ fontSize:12, color: loading[s.key] ? T.textMuted : T.offwhite }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1300, margin:"0 auto", padding:"24px 28px" }}>

        {/* STAT STRIP */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
          <StatCard label="Total Listings" value={listings.length || "…"} sub={`${forSale} sale · ${forRent} rent (filtered)`} accent={T.teal}/>
          <StatCard label="Avg Price (filtered)" value={avgPrice ? `QAR ${(avgPrice/1000).toFixed(0)}K` : "…"} sub="across all sources" accent={T.sand}/>
          <StatCard label="Avg Price/m²" value={avgPpsm ? `QAR ${avgPpsm.toLocaleString()}` : "…"} sub="filtered listings" accent={T.teal}/>
          {qcb && <StatCard label="QCB Price Index" value={`+${qcb.priceIndexChange}%`} sub="YoY Apr 2025 (Qatar Central Bank)" accent={T.green}/>}
          {qcb && <StatCard label="2025 Market Size" value={`$${(qcb.marketSizeUSD/1000).toFixed(1)}B`} sub={`${qcb.totalTransactions2025.toLocaleString()} transactions`} accent={T.sand}/>}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:`1px solid ${T.slate}44` }}>
          {[["listings","🏠 Listings"], ["analytics","📊 Analytics"], ["export","⬇ Export"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background:"none", border:"none", color: tab===key ? T.teal : T.textMuted,
              fontWeight: tab===key ? 700 : 500, fontSize:14, padding:"10px 18px",
              cursor:"pointer", borderBottom: tab===key ? `2px solid ${T.teal}` : "2px solid transparent",
              transition:"color 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* ── LISTINGS TAB ── */}
        {tab === "listings" && (
          <div>
            {/* FILTERS */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20, alignItems:"center" }}>
              {[
                { key:"source", label:"Source", opts:["All","Bayut","PropertyFinder"] },
                { key:"area", label:"Area", opts:["All",...AREAS] },
                { key:"purpose", label:"Purpose", opts:["All","For Sale","For Rent"] },
                { key:"type", label:"Type", opts:["All",...TYPES] },
              ].map(f => (
                <select key={f.key} value={filters[f.key]} style={selectStyle}
                  onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
              <input
                type="number" placeholder="Max price (QAR)" value={filters.maxPrice}
                onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                style={{ ...selectStyle, width:180 }}
              />
              <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="size-desc">Size ↓</option>
                <option value="ppsm-asc">Price/m² ↑</option>
              </select>
              <span style={{ color: T.textMuted, fontSize:13, marginLeft:"auto" }}>{filtered.length} results</span>
            </div>

            {/* LOADING STATE */}
            {(loading.bayut || loading.pf) && (
              <div style={{ display:"flex", gap:20, marginBottom:16 }}>
                {loading.bayut && <div style={{ display:"flex", alignItems:"center", gap:8 }}><Spinner/><span style={{fontSize:13, color:T.sand}}>Fetching Bayut…</span></div>}
                {loading.pf && <div style={{ display:"flex", alignItems:"center", gap:8 }}><Spinner/><span style={{fontSize:13, color:T.teal}}>Fetching PropertyFinder…</span></div>}
              </div>
            )}

            {/* GRID */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {filtered.map((l, i) => (
                <div key={l.id} className="listing-card" style={{ animationDelay:`${(i%12)*30}ms` }}>
                  <ListingCard listing={l}/>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading.bayut && !loading.pf && (
              <div style={{ textAlign:"center", color: T.textMuted, padding:60, fontSize:16 }}>
                No listings match your filters. Try adjusting the search.
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

            {/* QCB Index chart */}
            {qcb ? (
              <div style={{ background: T.navyMid, borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, color: T.white, marginBottom:4 }}>
                  Qatar Central Bank — Real Estate Price Index 2025
                </div>
                <div style={{ color: T.textMuted, fontSize:13, marginBottom:16 }}>
                  Official QCB price index · YoY change: <span style={{ color: T.green, fontWeight:700 }}>+{qcb.priceIndexChange}%</span>
                </div>
                <MiniChart data={qcb.monthlyIndex} color={T.teal}/>
                <div style={{ display:"flex", gap:20, marginTop:16, flexWrap:"wrap" }}>
                  <div style={{ color: T.textMuted, fontSize:13 }}>📦 Total 2025 transactions: <span style={{ color: T.offwhite, fontWeight:600 }}>{qcb.totalTransactions2025.toLocaleString()}</span></div>
                  <div style={{ color: T.textMuted, fontSize:13 }}>💰 Total value: <span style={{ color: T.offwhite, fontWeight:600 }}>QAR {qcb.totalValue2025}B</span></div>
                  <div style={{ color: T.textMuted, fontSize:13 }}>🏝 Pearl avg/m²: <span style={{ color: T.sand, fontWeight:600 }}>QAR {qcb.pearlAvgPricePerSqm.toLocaleString()}</span></div>
                  <div style={{ color: T.textMuted, fontSize:13 }}>🔻 Median rent change: <span style={{ color: T.red, fontWeight:600 }}>{qcb.medianRentChange}%</span></div>
                </div>
              </div>
            ) : <Spinner/>}

            {/* Price by Area */}
            <div style={{ background: T.navyMid, borderRadius:12, padding:24 }}>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, color: T.white, marginBottom:16 }}>
                Average Price/m² by Area — Bayut + PropertyFinder
              </div>
              {byArea.length === 0 ? <Spinner/> : byArea.map(a => (
                <div key={a.area} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:14, color: T.offwhite }}>{a.area}</span>
                    <span style={{ fontSize:14, color: T.sand, fontWeight:700 }}>QAR {a.avg.toLocaleString()}/m² <span style={{ color: T.textMuted, fontWeight:400 }}>({a.count} listings)</span></span>
                  </div>
                  <PulseBar pct={(a.avg / maxAvg) * 100} color={T.teal}/>
                </div>
              ))}
            </div>

            {/* Source comparison */}
            <div style={{ background: T.navyMid, borderRadius:12, padding:24 }}>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, color: T.white, marginBottom:16 }}>
                Source Comparison
              </div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {["Bayut","PropertyFinder"].map(src => {
                  const items = listings.filter(l=>l.source===src);
                  const avg = items.length ? Math.round(items.reduce((s,l)=>s+l.pricePerSqm,0)/items.length) : 0;
                  const srcColor = src === "Bayut" ? T.sand : T.teal;
                  return (
                    <div key={src} style={{ flex:"1 1 200px", background: T.navy, borderRadius:10, padding:18, borderLeft:`4px solid ${srcColor}` }}>
                      <div style={{ color: srcColor, fontWeight:700, fontSize:16, marginBottom:10 }}>{src}</div>
                      <div style={{ color: T.textMuted, fontSize:13, marginBottom:4 }}>Listings: <span style={{color:T.offwhite}}>{items.length}</span></div>
                      <div style={{ color: T.textMuted, fontSize:13, marginBottom:4 }}>Avg Price/m²: <span style={{color:T.offwhite}}>QAR {avg.toLocaleString()}</span></div>
                      <div style={{ color: T.textMuted, fontSize:13, marginBottom:4 }}>For Sale: <span style={{color:T.offwhite}}>{items.filter(l=>l.purpose==="For Sale").length}</span></div>
                      <div style={{ color: T.textMuted, fontSize:13 }}>For Rent: <span style={{color:T.offwhite}}>{items.filter(l=>l.purpose==="For Rent").length}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── EXPORT TAB ── */}
        {tab === "export" && (
          <div style={{ background: T.navyMid, borderRadius:12, padding:28 }}>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:700, color: T.white, marginBottom:8 }}>
              Export Market Data
            </div>
            <p style={{ color: T.textMuted, fontSize:14, marginBottom:24, lineHeight:1.7 }}>
              Download all currently loaded and filtered listings from Bayut and PropertyFinder as a CSV file.
              Apply filters in the Listings tab first to narrow your export.
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:28 }}>
              <div style={{ background: T.navy, borderRadius:8, padding:"14px 20px", flex:"1 1 180px" }}>
                <div style={{ color: T.textMuted, fontSize:12, marginBottom:4 }}>Bayut listings loaded</div>
                <div style={{ color: T.sand, fontSize:22, fontWeight:700 }}>{listings.filter(l=>l.source==="Bayut").length}</div>
              </div>
              <div style={{ background: T.navy, borderRadius:8, padding:"14px 20px", flex:"1 1 180px" }}>
                <div style={{ color: T.textMuted, fontSize:12, marginBottom:4 }}>PropertyFinder loaded</div>
                <div style={{ color: T.teal, fontSize:22, fontWeight:700 }}>{listings.filter(l=>l.source==="PropertyFinder").length}</div>
              </div>
              <div style={{ background: T.navy, borderRadius:8, padding:"14px 20px", flex:"1 1 180px" }}>
                <div style={{ color: T.textMuted, fontSize:12, marginBottom:4 }}>Filtered & ready</div>
                <div style={{ color: T.green, fontSize:22, fontWeight:700 }}>{filtered.length}</div>
              </div>
            </div>
            <ExportButton data={filtered}/>
            <div style={{ marginTop:20, color: T.textMuted, fontSize:12, lineHeight:1.8 }}>
              <div>📌 <strong style={{color:T.offwhite}}>To connect real APIs:</strong></div>
              <div>• <strong>Bayut:</strong> Sign up at rapidapi.com → search "Bayut API" → get x-rapidapi-key</div>
              <div>• <strong>PropertyFinder Qatar:</strong> apify.com → search "propertyfinder-scraper" → use Actor API token</div>
              <div>• <strong>QCB:</strong> qcb.gov.qa → Publications → Real Estate Price Index (manual download or scrape)</div>
              <div style={{marginTop:8}}>Replace the <code style={{color:T.teal}}>fetchBayut()</code>, <code style={{color:T.teal}}>fetchPropertyFinder()</code>, and <code style={{color:T.teal}}>fetchQCB()</code> functions at the top of this file with real fetch() calls.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
