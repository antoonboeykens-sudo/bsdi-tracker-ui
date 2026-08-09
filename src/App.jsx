import React, { useState, useMemo, useEffect } from "react";
import { Search, Calendar, ExternalLink, X, FileText, Handshake, FileSignature, Megaphone, Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const TYPE_META = {
  MoU:          { color: "#3E6259", icon: FileSignature, label: "MoU" },
  LOI:          { color: "#8A6D3B", icon: FileText,       label: "LOI" },
  Contract:     { color: "#7A3B3B", icon: Handshake,      label: "Contract" },
  Partnership:  { color: "#38546B", icon: Handshake,      label: "Partnership" },
  Announcement: { color: "#5B5560", icon: Megaphone,      label: "Announcement" },
  Other:        { color: "#5B5560", icon: FileText,       label: "Other" },
};

function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.Other;
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [activePreset, setActivePreset] = useState(null); // tracks which quick-filter button is active, for highlighting

  function applyPreset(days, label) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
    setActivePreset(label);
  }

  function clearDatePreset() {
    setDateFrom("");
    setDateTo("");
    setActivePreset(null);
  }

  useEffect(() => {
    async function fetchData() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setError("Missing Supabase configuration (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/announcements?select=*&order=event_date.desc.nullslast`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status}`);
        }
        const rows = await res.json();
        setData(rows);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const members = useMemo(
    () => ["All", ...new Set(data.map((d) => d.member_name))].sort(),
    [data]
  );

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        if (memberFilter !== "All" && item.member_name !== memberFilter) return false;
        if (typeFilter !== "All" && item.agreement_type !== typeFilter) return false;
        if (dateFrom && item.event_date && item.event_date < dateFrom) return false;
        if (dateTo && item.event_date && item.event_date > dateTo) return false;
        if (query) {
          const q = query.toLowerCase();
          const hay = `${item.member_name} ${item.partner_name} ${item.title}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.event_date || "").localeCompare(a.event_date || ""));
  }, [data, query, typeFilter, dateFrom, dateTo, memberFilter]);

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
        background: "#F0EEE8",
        minHeight: "100vh",
        color: "#22252B",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .row-hover:hover { background: #E4E1D8 !important; cursor: pointer; }
        ::placeholder { color: #8B8878; }
      `}</style>

      <div
        style={{
          borderBottom: "2px solid #22252B",
          padding: "28px 32px 20px",
          background: "#22252B",
          color: "#F0EEE8",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: "#9A9686", marginBottom: 6 }}>
              BSDI · AGORIA
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em" }}>
              International Partnership Tracker
            </h1>
          </div>
          <div className="mono" style={{ fontSize: 12, color: "#9A9686", textAlign: "right" }}>
            {loading ? "Loading…" : `${filtered.length} of ${data.length} records shown`}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          padding: "18px 32px",
          borderBottom: "1px solid #D8D4C8",
          background: "#F6F4EE",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #D8D4C8", borderRadius: 6, padding: "8px 12px", flex: "1 1 220px" }}>
          <Search size={15} color="#8B8878" />
          <input
            type="text"
            placeholder="Search member, partner, or title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13.5, width: "100%", background: "transparent" }}
          />
        </div>

        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          style={{ border: "1px solid #D8D4C8", borderRadius: 6, padding: "8px 10px", fontSize: 13.5, background: "#fff", minWidth: 160 }}
        >
          {members.map((m) => (
            <option key={m} value={m}>
              {m === "All" ? "All members" : m}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ border: "1px solid #D8D4C8", borderRadius: 6, padding: "8px 10px", fontSize: 13.5, background: "#fff", minWidth: 140 }}
        >
          <option value="All">All types</option>
          {Object.keys(TYPE_META).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[
            { label: "7d", days: 7, title: "Last 7 days" },
            { label: "30d", days: 30, title: "Last 30 days" },
            { label: "90d", days: 90, title: "Last 90 days" },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days, p.label)}
              title={p.title}
              style={{
                border: activePreset === p.label ? "1px solid #38546B" : "1px solid #D8D4C8",
                background: activePreset === p.label ? "#38546B" : "#fff",
                color: activePreset === p.label ? "#fff" : "#3E3B36",
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} color="#8B8878" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setActivePreset(null); }}
            style={{ border: "1px solid #D8D4C8", borderRadius: 6, padding: "7px 9px", fontSize: 13 }}
          />
          <span style={{ color: "#8B8878", fontSize: 13 }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setActivePreset(null); }}
            style={{ border: "1px solid #D8D4C8", borderRadius: 6, padding: "7px 9px", fontSize: 13 }}
          />
        </div>

        {(query || memberFilter !== "All" || typeFilter !== "All" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setQuery("");
              setMemberFilter("All");
              setTypeFilter("All");
              clearDatePreset();
            }}
            style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "#7A3B3B", fontSize: 13, cursor: "pointer" }}
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      <div style={{ padding: "0 32px 40px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "40px 0", color: "#5B5560" }}>
            <Loader2 size={18} className="mono" style={{ animation: "spin 1s linear infinite" }} />
            Loading announcements…
          </div>
        )}

        {error && (
          <div style={{ padding: "20px", marginTop: 18, border: "1px solid #C99", borderRadius: 8, background: "#FBEAEA", color: "#7A3B3B", fontSize: 14 }}>
            Couldn't load data: {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ marginTop: 18, border: "1px solid #D8D4C8", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
            <div
              className="mono"
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 1fr 130px 90px",
                padding: "10px 18px",
                fontSize: 11,
                letterSpacing: "0.06em",
                color: "#8B8878",
                borderBottom: "1px solid #D8D4C8",
                background: "#F6F4EE",
              }}
            >
              <div>DATE</div>
              <div>MEMBER</div>
              <div>PARTNER</div>
              <div>TYPE</div>
              <div>CONF.</div>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: "40px 18px", textAlign: "center", color: "#8B8878", fontSize: 14 }}>
                No records match these filters.
              </div>
            )}

            {filtered.map((item) => {
              const meta = typeMeta(item.agreement_type);
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className="row-hover"
                  onClick={() => setSelected(item)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 1fr 130px 90px",
                    padding: "13px 18px",
                    fontSize: 13.5,
                    borderBottom: "1px solid #EDEAE0",
                    alignItems: "center",
                  }}
                >
                  <div className="mono" style={{ color: "#5B5560", fontSize: 12.5 }}>
                    {item.event_date || "—"}
                  </div>
                  <div style={{ fontWeight: 500 }}>{item.member_name}</div>
                  <div style={{ color: "#3E3B36" }}>
                    {item.partner_name}
                    {item.partner_country && <span style={{ color: "#8B8878" }}> · {item.partner_country}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon size={13} color={meta.color} />
                    <span style={{ color: meta.color, fontSize: 12.5, fontWeight: 500 }}>{meta.label}</span>
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      color: item.confidence === "high" ? "#3E6259" : item.confidence === "medium" ? "#8A6D3B" : "#8B8878",
                    }}
                  >
                    {(item.confidence || "").toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(34,37,43,0.4)", display: "flex", justifyContent: "flex-end", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, maxWidth: "90vw", background: "#FDFCF9", height: "100%", padding: 28, borderLeft: "1px solid #D8D4C8", overflowY: "auto" }}
          >
            <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#8B8878", marginBottom: 16 }}>
              <X size={18} />
            </button>
            <div className="mono" style={{ fontSize: 11, color: typeMeta(selected.agreement_type).color, letterSpacing: "0.06em", marginBottom: 8 }}>
              {typeMeta(selected.agreement_type).label.toUpperCase()} · {selected.event_date || "date unknown"}
            </div>
            <h2 style={{ fontSize: 19, margin: "0 0 16px", lineHeight: 1.3 }}>{selected.title}</h2>

            <div style={{ fontSize: 13.5, color: "#5B5560", marginBottom: 4 }}>Member</div>
            <div style={{ fontSize: 15, marginBottom: 14 }}>{selected.member_name}</div>

            <div style={{ fontSize: 13.5, color: "#5B5560", marginBottom: 4 }}>Partner</div>
            <div style={{ fontSize: 15, marginBottom: 14 }}>
              {selected.partner_name} {selected.partner_country && `(${selected.partner_country})`}
            </div>

            {selected.summary && (
              <>
                <div style={{ fontSize: 13.5, color: "#5B5560", marginBottom: 4 }}>Summary</div>
                <div style={{ fontSize: 14, marginBottom: 14, lineHeight: 1.5 }}>{selected.summary}</div>
              </>
            )}

            <div style={{ fontSize: 13.5, color: "#5B5560", marginBottom: 4 }}>Source</div>
            <a href={selected.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "#38546B", display: "flex", alignItems: "center", gap: 5 }}>
              {selected.source_name || selected.source_url} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
