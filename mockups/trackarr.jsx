import { useState, useEffect, useRef } from "react";

const MOCK_MEDIA = [
  {
    id: 1, type: "movie", title: "Blade Runner 2049", year: 2017, rating: "R",
    poster: "https://image.tmdb.org/t/p/w200/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    quality: "Blu-Ray 2160p", size: "58.4 GB", runtime: "2h 44m",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "TrueHD Atmos", channels: "7.1", bitrate: "4500 kbps", isDefault: true, title: "English - Dolby TrueHD Atmos" },
      { id: 2, lang: "English", langCode: "eng", codec: "AC3", channels: "5.1", bitrate: "640 kbps", isDefault: false, title: "English - Dolby Digital 5.1 (Commentary)" },
      { id: 3, lang: "Spanish", langCode: "spa", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "Spanish - Dolby Digital 5.1" },
      { id: 4, lang: "French", langCode: "fra", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "French - Dolby Digital 5.1" },
      { id: 5, lang: "German", langCode: "deu", codec: "DTS", channels: "5.1", bitrate: "768 kbps", isDefault: false, title: "German - DTS 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "PGS", forced: false, isDefault: true, title: "English (Full)" },
      { id: 2, lang: "English", langCode: "eng", format: "PGS", forced: true, isDefault: false, title: "English (Forced)" },
      { id: 3, lang: "English", langCode: "eng", format: "SRT", forced: false, isDefault: false, title: "English SDH" },
      { id: 4, lang: "Spanish", langCode: "spa", format: "PGS", forced: false, isDefault: false, title: "Spanish" },
      { id: 5, lang: "French", langCode: "fra", format: "PGS", forced: false, isDefault: false, title: "French" },
      { id: 6, lang: "German", langCode: "deu", format: "PGS", forced: false, isDefault: false, title: "German" },
      { id: 7, lang: "Japanese", langCode: "jpn", format: "PGS", forced: false, isDefault: false, title: "Japanese" },
    ]
  },
  {
    id: 2, type: "movie", title: "Dune: Part Two", year: 2024, rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w200/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg",
    quality: "Remux 2160p", size: "72.1 GB", runtime: "2h 46m",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "TrueHD Atmos", channels: "7.1", bitrate: "5200 kbps", isDefault: true, title: "English - Dolby TrueHD Atmos" },
      { id: 2, lang: "English", langCode: "eng", codec: "AAC", channels: "2.0", bitrate: "256 kbps", isDefault: false, title: "English - AAC Stereo (Commentary)" },
      { id: 3, lang: "Spanish", langCode: "spa", codec: "EAC3", channels: "5.1", bitrate: "640 kbps", isDefault: false, title: "Spanish - Dolby Digital Plus 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "PGS", forced: false, isDefault: true, title: "English (Full)" },
      { id: 2, lang: "English", langCode: "eng", format: "PGS", forced: true, isDefault: false, title: "English (Forced)" },
      { id: 3, lang: "Spanish", langCode: "spa", format: "PGS", forced: false, isDefault: false, title: "Spanish" },
      { id: 4, lang: "French", langCode: "fra", format: "SRT", forced: false, isDefault: false, title: "French" },
    ]
  },
  {
    id: 3, type: "show", title: "Severance", year: 2022, rating: "TV-MA",
    poster: "https://image.tmdb.org/t/p/w200/pFoSpPSsBXIVMYiVCTkzIuMOjSA.jpg",
    quality: "WEB-DL 2160p", size: "44.2 GB", runtime: "9 Episodes",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "EAC3 Atmos", channels: "5.1", bitrate: "768 kbps", isDefault: true, title: "English - Dolby Digital Plus Atmos" },
      { id: 2, lang: "Spanish", langCode: "spa", codec: "EAC3", channels: "5.1", bitrate: "384 kbps", isDefault: false, title: "Spanish - Dolby Digital Plus 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "SRT", forced: false, isDefault: true, title: "English (CC)" },
      { id: 2, lang: "English", langCode: "eng", format: "SRT", forced: true, isDefault: false, title: "English (Forced)" },
      { id: 3, lang: "Spanish", langCode: "spa", format: "SRT", forced: false, isDefault: false, title: "Spanish" },
    ]
  },
  {
    id: 4, type: "movie", title: "Interstellar", year: 2014, rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    quality: "Remux 2160p", size: "81.3 GB", runtime: "2h 49m",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "DTS-HD MA", channels: "5.1", bitrate: "4800 kbps", isDefault: true, title: "English - DTS-HD Master Audio 5.1" },
      { id: 2, lang: "English", langCode: "eng", codec: "AC3", channels: "2.0", bitrate: "192 kbps", isDefault: false, title: "English - Commentary" },
      { id: 3, lang: "French", langCode: "fra", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "French - Dolby Digital 5.1" },
      { id: 4, lang: "Spanish", langCode: "spa", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "Spanish - Dolby Digital 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "PGS", forced: false, isDefault: true, title: "English (Full)" },
      { id: 2, lang: "English", langCode: "eng", format: "PGS", forced: true, isDefault: false, title: "English (Forced)" },
      { id: 3, lang: "English", langCode: "eng", format: "SRT", forced: false, isDefault: false, title: "English SDH" },
      { id: 4, lang: "French", langCode: "fra", format: "PGS", forced: false, isDefault: false, title: "French" },
      { id: 5, lang: "Spanish", langCode: "spa", format: "PGS", forced: false, isDefault: false, title: "Spanish" },
      { id: 6, lang: "Portuguese", langCode: "por", format: "SRT", forced: false, isDefault: false, title: "Portuguese" },
    ]
  },
  {
    id: 5, type: "show", title: "Shogun", year: 2024, rating: "TV-MA",
    poster: "https://image.tmdb.org/t/p/w200/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    quality: "WEB-DL 2160p", size: "62.8 GB", runtime: "10 Episodes",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "Japanese", langCode: "jpn", codec: "EAC3 Atmos", channels: "5.1", bitrate: "768 kbps", isDefault: true, title: "Japanese - Dolby Digital Plus Atmos" },
      { id: 2, lang: "English", langCode: "eng", codec: "EAC3", channels: "5.1", bitrate: "640 kbps", isDefault: false, title: "English - Dolby Digital Plus 5.1 (Dub)" },
      { id: 3, lang: "Spanish", langCode: "spa", codec: "EAC3", channels: "5.1", bitrate: "384 kbps", isDefault: false, title: "Spanish - Dolby Digital Plus 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "SRT", forced: false, isDefault: true, title: "English (Full)" },
      { id: 2, lang: "English", langCode: "eng", format: "SRT", forced: true, isDefault: false, title: "English (Forced / Signs)" },
      { id: 3, lang: "Spanish", langCode: "spa", format: "SRT", forced: false, isDefault: false, title: "Spanish" },
      { id: 4, lang: "French", langCode: "fra", format: "SRT", forced: false, isDefault: false, title: "French" },
      { id: 5, lang: "Japanese", langCode: "jpn", format: "SRT", forced: false, isDefault: false, title: "Japanese" },
    ]
  },
  {
    id: 6, type: "movie", title: "The Batman", year: 2022, rating: "PG-13",
    poster: "https://image.tmdb.org/t/p/w200/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    quality: "Blu-Ray 2160p", size: "65.7 GB", runtime: "2h 56m",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "TrueHD Atmos", channels: "7.1", bitrate: "4900 kbps", isDefault: true, title: "English - Dolby TrueHD Atmos" },
      { id: 2, lang: "English", langCode: "eng", codec: "AC3", channels: "5.1", bitrate: "640 kbps", isDefault: false, title: "English - Director's Commentary" },
      { id: 3, lang: "Spanish", langCode: "spa", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "Spanish - Dolby Digital 5.1" },
      { id: 4, lang: "Portuguese", langCode: "por", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "Portuguese - Dolby Digital 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "PGS", forced: false, isDefault: true, title: "English (Full)" },
      { id: 2, lang: "English", langCode: "eng", format: "PGS", forced: true, isDefault: false, title: "English (Forced)" },
      { id: 3, lang: "Spanish", langCode: "spa", format: "PGS", forced: false, isDefault: false, title: "Spanish" },
      { id: 4, lang: "Portuguese", langCode: "por", format: "PGS", forced: false, isDefault: false, title: "Portuguese" },
      { id: 5, lang: "French", langCode: "fra", format: "SRT", forced: false, isDefault: false, title: "French" },
    ]
  },
  {
    id: 7, type: "show", title: "The Bear", year: 2022, rating: "TV-MA",
    poster: "https://image.tmdb.org/t/p/w200/sHFlJKMFnOTGnAMk6bB4JDAlHTm.jpg",
    quality: "WEB-DL 1080p", size: "28.4 GB", runtime: "28 Episodes",
    videoCodec: "H.264", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "EAC3", channels: "5.1", bitrate: "640 kbps", isDefault: true, title: "English - Dolby Digital Plus 5.1" },
      { id: 2, lang: "Spanish", langCode: "spa", codec: "AAC", channels: "2.0", bitrate: "192 kbps", isDefault: false, title: "Spanish - AAC Stereo" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "SRT", forced: false, isDefault: true, title: "English (CC)" },
      { id: 2, lang: "Spanish", langCode: "spa", format: "SRT", forced: false, isDefault: false, title: "Spanish" },
      { id: 3, lang: "French", langCode: "fra", format: "SRT", forced: false, isDefault: false, title: "French" },
    ]
  },
  {
    id: 8, type: "movie", title: "Oppenheimer", year: 2023, rating: "R",
    poster: "https://image.tmdb.org/t/p/w200/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    quality: "Remux 2160p", size: "79.6 GB", runtime: "3h 0m",
    videoCodec: "HEVC", container: "MKV",
    audioTracks: [
      { id: 1, lang: "English", langCode: "eng", codec: "TrueHD Atmos", channels: "7.1", bitrate: "5800 kbps", isDefault: true, title: "English - Dolby TrueHD Atmos" },
      { id: 2, lang: "English", langCode: "eng", codec: "AC3", channels: "5.1", bitrate: "640 kbps", isDefault: false, title: "English - Dolby Digital 5.1" },
      { id: 3, lang: "French", langCode: "fra", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "French - Dolby Digital 5.1" },
      { id: 4, lang: "Spanish", langCode: "spa", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "Spanish - Dolby Digital 5.1" },
      { id: 5, lang: "Italian", langCode: "ita", codec: "AC3", channels: "5.1", bitrate: "448 kbps", isDefault: false, title: "Italian - Dolby Digital 5.1" },
      { id: 6, lang: "German", langCode: "deu", codec: "DTS", channels: "5.1", bitrate: "768 kbps", isDefault: false, title: "German - DTS 5.1" },
    ],
    subtitleTracks: [
      { id: 1, lang: "English", langCode: "eng", format: "PGS", forced: false, isDefault: true, title: "English (Full)" },
      { id: 2, lang: "English", langCode: "eng", format: "PGS", forced: true, isDefault: false, title: "English (Forced)" },
      { id: 3, lang: "English", langCode: "eng", format: "SRT", forced: false, isDefault: false, title: "English SDH" },
      { id: 4, lang: "French", langCode: "fra", format: "PGS", forced: false, isDefault: false, title: "French" },
      { id: 5, lang: "Spanish", langCode: "spa", format: "PGS", forced: false, isDefault: false, title: "Spanish" },
      { id: 6, lang: "Italian", langCode: "ita", format: "PGS", forced: false, isDefault: false, title: "Italian" },
      { id: 7, lang: "German", langCode: "deu", format: "PGS", forced: false, isDefault: false, title: "German" },
      { id: 8, lang: "Japanese", langCode: "jpn", format: "PGS", forced: false, isDefault: false, title: "Japanese" },
    ]
  },
];

const FLAG_MAP = {
  eng: "🇬🇧", spa: "🇪🇸", fra: "🇫🇷", deu: "🇩🇪", jpn: "🇯🇵", por: "🇧🇷", ita: "🇮🇹",
};

// --- Icon Components ---
const IconFilm = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>
);
const IconTv = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
);
const IconAudio = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
);
const IconSubtitle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="5" y1="12" x2="11" y2="12"/><line x1="13" y1="12" x2="19" y2="12"/><line x1="5" y1="16" x2="8" y2="16"/><line x1="10" y1="16" x2="19" y2="16"/></svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const IconHDD = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
);

// --- Toast Notification ---
function Toast({ message, type, onDone }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 9999,
      background: type === "success" ? "#16a34a" : type === "danger" ? "#dc2626" : "#2563eb",
      color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", transform: visible ? "translateY(0)" : "translateY(20px)",
      opacity: visible ? 1 : 0, transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
    }}>{message}</div>
  );
}

// --- Confirmation Modal ---
function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1c1f26", border: "1px solid #2a2d36", borderRadius: 14, padding: "28px 32px",
        maxWidth: 420, width: "90%", fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#e8eaed", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2d36", background: "transparent",
            color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: danger ? "#dc2626" : "#3b82f6", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{danger ? "Remove" : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

// --- Track Row ---
function TrackRow({ track, type, isDefault, onSetDefault, onRemove, isLast }) {
  const [hovered, setHovered] = useState(false);
  const flag = FLAG_MAP[track.langCode] || "🏳️";
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: type === "audio" ? "44px 1fr 110px 80px 100px 90px" : "44px 1fr 80px 80px 80px 90px",
        alignItems: "center", padding: "0 20px", height: 48, fontSize: 13,
        background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.15s", fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span style={{ fontSize: 18 }}>{flag}</span>
      <span style={{ color: "#e8eaed", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
        {track.title}
      </span>
      {type === "audio" ? (
        <>
          <span style={{ color: "#6ee7b7", fontWeight: 600, fontSize: 11, letterSpacing: "0.04em" }}>{track.codec}</span>
          <span style={{ color: "#9ca3af" }}>{track.channels}</span>
          <span style={{ color: "#6b7280", fontSize: 12 }}>{track.bitrate}</span>
        </>
      ) : (
        <>
          <span style={{ color: "#93c5fd", fontWeight: 600, fontSize: 11, letterSpacing: "0.04em" }}>{track.format}</span>
          <span style={{ color: "#9ca3af" }}>{track.lang}</span>
          {track.forced ? (
            <span style={{
              background: "rgba(251,191,36,0.12)", color: "#fbbf24", padding: "2px 8px",
              borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", width: "fit-content",
            }}>FORCED</span>
          ) : <span />}
        </>
      )}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {isDefault ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "rgba(34,197,94,0.12)", color: "#22c55e",
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          }}><IconCheck /> DEFAULT</span>
        ) : (
          <button onClick={() => onSetDefault(track.id)} title="Set as default" style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#6b7280", borderRadius: 6, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hovered ? 1 : 0.4, transition: "all 0.15s",
          }}><IconCheck /></button>
        )}
        <button onClick={() => onRemove(track)} title="Remove track" style={{
          background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)",
          color: "#ef4444", borderRadius: 6, width: 30, height: 30, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hovered ? 1 : 0.3, transition: "all 0.15s",
        }}><IconTrash /></button>
      </div>
    </div>
  );
}

// --- Media Detail View ---
function MediaDetail({ media: initialMedia, onBack }) {
  const [media, setMedia] = useState(initialMedia);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState("audio");

  const setDefaultAudio = (id) => {
    setMedia(m => ({
      ...m,
      audioTracks: m.audioTracks.map(t => ({ ...t, isDefault: t.id === id }))
    }));
    setToast({ message: "Default audio track updated", type: "success" });
  };
  const setDefaultSub = (id) => {
    setMedia(m => ({
      ...m,
      subtitleTracks: m.subtitleTracks.map(t => ({ ...t, isDefault: t.id === id }))
    }));
    setToast({ message: "Default subtitle track updated", type: "success" });
  };
  const removeAudio = (track) => {
    setConfirm({
      title: "Remove Audio Track",
      message: `Remove "${track.title}" from this media file? This action cannot be undone.`,
      danger: true,
      onConfirm: () => {
        setMedia(m => ({ ...m, audioTracks: m.audioTracks.filter(t => t.id !== track.id) }));
        setToast({ message: `Removed: ${track.title}`, type: "danger" });
        setConfirm(null);
      }
    });
  };
  const removeSub = (track) => {
    setConfirm({
      title: "Remove Subtitle Track",
      message: `Remove "${track.title}" from this media file? This action cannot be undone.`,
      danger: true,
      onConfirm: () => {
        setMedia(m => ({ ...m, subtitleTracks: m.subtitleTracks.filter(t => t.id !== track.id) }));
        setToast({ message: `Removed: ${track.title}`, type: "danger" });
        setConfirm(null);
      }
    });
  };

  const posterFallback = (
    <div style={{
      width: 180, height: 270, borderRadius: 10, background: "#1c1f26",
      display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563",
    }}><IconFilm /></div>
  );

  return (
    <div style={{ animation: "fadeSlideIn 0.35s ease" }}>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none",
        color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 0",
        marginBottom: 20, fontFamily: "'DM Sans', sans-serif",
      }}><IconBack /> Back to Library</button>

      {/* Hero */}
      <div style={{
        display: "flex", gap: 28, marginBottom: 32, padding: 24,
        background: "linear-gradient(135deg, rgba(30,33,42,0.9) 0%, rgba(20,22,28,0.95) 100%)",
        borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <img
          src={media.poster} alt={media.title}
          style={{ width: 140, height: 210, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
              borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              background: media.type === "movie" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)",
              color: media.type === "movie" ? "#a78bfa" : "#60a5fa",
            }}>
              {media.type === "movie" ? <IconFilm /> : <IconTv />}
              {media.type.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{media.rating}</span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f3f4f6", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {media.title}
          </h2>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{media.year} &middot; {media.runtime}</div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "Quality", value: media.quality, color: "#fbbf24" },
              { label: "Codec", value: media.videoCodec, color: "#34d399" },
              { label: "Container", value: media.container, color: "#60a5fa" },
              { label: "Size", value: media.size, color: "#f472b6" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 14, color, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track Tabs */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 2, padding: "0 4px",
      }}>
        {["audio", "subtitle"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
            background: activeTab === tab ? "#1c1f26" : "transparent",
            border: "1px solid " + (activeTab === tab ? "rgba(255,255,255,0.06)" : "transparent"),
            borderBottom: activeTab === tab ? "1px solid #1c1f26" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px 10px 0 0", color: activeTab === tab ? "#e8eaed" : "#6b7280",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s", position: "relative", bottom: -1,
          }}>
            {tab === "audio" ? <IconAudio /> : <IconSubtitle />}
            {tab === "audio" ? "Audio Tracks" : "Subtitle Tracks"}
            <span style={{
              background: activeTab === tab ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
              color: activeTab === tab ? "#818cf8" : "#6b7280",
              padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800,
            }}>
              {tab === "audio" ? media.audioTracks.length : media.subtitleTracks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Track Table */}
      <div style={{
        background: "#1c1f26", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0 12px 12px 12px", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: activeTab === "audio" ? "44px 1fr 110px 80px 100px 90px" : "44px 1fr 80px 80px 80px 90px",
          padding: "0 20px", height: 40, alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 10, fontWeight: 700, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <span></span>
          <span>Track</span>
          {activeTab === "audio" ? (
            <>
              <span>Codec</span><span>Channels</span><span>Bitrate</span>
            </>
          ) : (
            <>
              <span>Format</span><span>Language</span><span>Flags</span>
            </>
          )}
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>
        {/* Rows */}
        {(activeTab === "audio" ? media.audioTracks : media.subtitleTracks).map((track, i, arr) => (
          <TrackRow
            key={track.id} track={track} type={activeTab}
            isDefault={track.isDefault}
            onSetDefault={activeTab === "audio" ? setDefaultAudio : setDefaultSub}
            onRemove={activeTab === "audio" ? removeAudio : removeSub}
            isLast={i === arr.length - 1}
          />
        ))}
        {(activeTab === "audio" ? media.audioTracks : media.subtitleTracks).length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#4b5563", fontSize: 13 }}>
            No {activeTab} tracks remaining.
          </div>
        )}
      </div>
    </div>
  );
}

// --- Media Card ---
function MediaCard({ media, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 16, padding: 16, cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        borderRadius: 12, transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        transform: hovered ? "translateX(4px)" : "none",
        animation: `fadeSlideIn 0.4s ease ${index * 0.04}s both`,
      }}
    >
      {!imgError ? (
        <img
          src={media.poster} alt={media.title}
          onError={() => setImgError(true)}
          style={{
            width: 56, height: 84, borderRadius: 8, objectFit: "cover", flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      ) : (
        <div style={{
          width: 56, height: 84, borderRadius: 8, background: "#1c1f26", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563",
          border: "1px solid rgba(255,255,255,0.06)",
        }}><IconFilm /></div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#e8eaed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {media.title}
          </span>
          <span style={{ fontSize: 12, color: "#6b7280", flexShrink: 0 }}>{media.year}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px",
            borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
            background: media.type === "movie" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)",
            color: media.type === "movie" ? "#a78bfa" : "#60a5fa",
          }}>
            {media.type === "movie" ? <IconFilm /> : <IconTv />}
            {media.type.toUpperCase()}
          </span>
          <span style={{
            padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: "rgba(251,191,36,0.1)", color: "#fbbf24", letterSpacing: "0.04em",
          }}>{media.quality}</span>
          <span style={{
            padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: "rgba(52,211,153,0.1)", color: "#34d399", letterSpacing: "0.04em",
          }}>{media.videoCodec}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "#6b7280" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconAudio /> {media.audioTracks.length} audio</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconSubtitle /> {media.subtitleTracks.length} subs</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconHDD /> {media.size}</span>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", color: "#3b3f4a",
        transition: "color 0.15s", ...(hovered && { color: "#6b7280" }),
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  );
}

// --- Main App ---
export default function Trackarr() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_MEDIA.filter(m => {
    if (filter === "movies" && m.type !== "movie") return false;
    if (filter === "shows" && m.type !== "show") return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAudio = MOCK_MEDIA.reduce((s, m) => s + m.audioTracks.length, 0);
  const totalSubs = MOCK_MEDIA.reduce((s, m) => s + m.subtitleTracks.length, 0);
  const totalSize = MOCK_MEDIA.reduce((s, m) => s + parseFloat(m.size), 0).toFixed(1);

  return (
    <div style={{
      minHeight: "100vh", background: "#12141a",
      fontFamily: "'DM Sans', sans-serif", color: "#e8eaed",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #4b5563; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2d36; border-radius: 3px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(18,20,26,0.9)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#fff", letterSpacing: "-0.02em",
          }}>T</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Track<span style={{ color: "#818cf8" }}>arr</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#6b7280" }}>
          <span>{MOCK_MEDIA.length} titles</span>
          <span style={{ width: 1, height: 16, background: "#2a2d36" }} />
          <span>{totalAudio} audio</span>
          <span>{totalSubs} subs</span>
          <span style={{ width: 1, height: 16, background: "#2a2d36" }} />
          <span>{totalSize} GB</span>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 80px" }}>
        {selected ? (
          <MediaDetail media={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Search & Filter */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, animation: "fadeSlideIn 0.4s ease" }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                background: "#1c1f26", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10, padding: "0 14px", height: 42,
              }}>
                <span style={{ color: "#4b5563" }}><IconSearch /></span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search media library..."
                  style={{
                    flex: 1, border: "none", outline: "none", background: "transparent",
                    color: "#e8eaed", fontSize: 13, fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 2, background: "#1c1f26", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
                {["all", "movies", "shows"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                    background: filter === f ? "rgba(99,102,241,0.15)" : "transparent",
                    color: filter === f ? "#818cf8" : "#6b7280",
                    fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                    transition: "all 0.15s", textTransform: "capitalize",
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28,
              animation: "fadeSlideIn 0.4s ease 0.05s both",
            }}>
              {[
                { label: "Total Titles", value: MOCK_MEDIA.length, icon: <IconFilm />, color: "#a78bfa" },
                { label: "Audio Tracks", value: totalAudio, icon: <IconAudio />, color: "#6ee7b7" },
                { label: "Subtitle Tracks", value: totalSubs, icon: <IconSubtitle />, color: "#93c5fd" },
                { label: "Library Size", value: `${totalSize} GB`, icon: <IconHDD />, color: "#f472b6" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  background: "#1c1f26", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12,
                  padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4b5563", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Media List */}
            <div style={{
              background: "#1c1f26", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: 12, fontWeight: 700, color: "#4b5563", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Media Library &middot; {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "#4b5563" }}>
                  No media found matching your search.
                </div>
              ) : (
                <div style={{ padding: 4 }}>
                  {filtered.map((m, i) => (
                    <MediaCard key={m.id} media={m} index={i} onClick={() => setSelected(m)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
