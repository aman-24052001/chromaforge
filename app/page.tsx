"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Save, RefreshCw, Trash2, X, Palette, Type, Maximize2, Code, Droplets, Eye } from "lucide-react";
import {
  hexToHsl, hslToHex, generatePalette, generateSpacingScale,
  paletteToCss, paletteToTailwind,
  DISPLAY_FONTS, BODY_FONTS, HARMONY_OPTIONS, PRESET_COLORS,
  type ColorPalette, type FontConfig,
} from "./lib/colorEngine";

type Tab = "colors" | "type" | "spacing" | "export";
type ExportFmt = "css" | "tailwind";
interface Saved { id: string; label: string; color: string; harmony: string; palette: ColorPalette; }

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "colors",  icon: <Palette size={20}/>,   label: "Colors" },
  { id: "type",    icon: <Type size={20}/>,       label: "Type"   },
  { id: "spacing", icon: <Maximize2 size={20}/>,  label: "Space"  },
  { id: "export",  icon: <Code size={20}/>,       label: "Export" },
];

export default function ChromaForge() {
  const [tab, setTab] = useState<Tab>("colors");
  const [color, setColor] = useState("#008CBB");
  const [harmony, setHarmony] = useState("golden");
  const [palette, setPalette] = useState<ColorPalette>(() => generatePalette("#008CBB", "golden"));
  const [fonts, setFonts] = useState<FontConfig>({ display: "Space Grotesk", body: "Inter", baseSize: 16 });
  const [spacing, setSpacing] = useState(8);
  const [exportFmt, setExportFmt] = useState<ExportFmt>("css");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [loadedFonts, setLoadedFonts] = useState(new Set(["Space Grotesk", "Inter"]));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    try { const r = localStorage.getItem("cf-saved"); if (r) setSaved(JSON.parse(r)); } catch {}
  }, []);

  const applyColor = useCallback((hex: string, h = harmony) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) { setColor(hex); setPalette(generatePalette(hex, h)); }
  }, [harmony]);

  const applyHarmony = (h: string) => { setHarmony(h); setPalette(generatePalette(color, h)); };

  const loadFont = (name: string) => {
    if (loadedFonts.has(name)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g,"+")}:wght@300;400;600;700&display=swap`;
    document.head.appendChild(link);
    setLoadedFonts(p => new Set([...p, name]));
  };

  const savePalette = () => {
    const { h } = hexToHsl(color);
    const entry: Saved = { id: Date.now().toString(), label: `${harmony[0].toUpperCase()+harmony.slice(1)} ${Math.round(h)}°`, color, harmony, palette };
    const next = [entry, ...saved].slice(0, 12);
    setSaved(next);
    try { localStorage.setItem("cf-saved", JSON.stringify(next)); } catch {}
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter(s => s.id !== id);
    setSaved(next);
    try { localStorage.setItem("cf-saved", JSON.stringify(next)); } catch {}
  };

  const randomColor = () => {
    const { h } = hexToHsl(color);
    applyColor(hslToHex((h + 67 + Math.random()*100) % 360, 55 + Math.random()*35, 32 + Math.random()*25));
  };

  const copyHex = (hex: string, key: string) => {
    navigator.clipboard.writeText(hex); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 1200);
  };

  const copyExport = () => {
    navigator.clipboard.writeText(exportCode); setExportCopied(true); setTimeout(() => setExportCopied(false), 2000);
  };

  const swatches = [
    { key: "primary", label: "Primary", hex: palette.primary },
    { key: "accent",  label: "Accent",  hex: palette.accent },
    { key: "support", label: "Support", hex: palette.support },
    { key: "bg",      label: "BG",      hex: palette.background },
    { key: "surface", label: "Surface", hex: palette.surface },
    { key: "text",    label: "Text",    hex: palette.text },
    { key: "muted",   label: "Muted",   hex: palette.muted },
  ];

  const exportCode = exportFmt === "css" ? paletteToCss(palette, fonts, spacing) : paletteToTailwind(palette, fonts, spacing);
  const { h: hD, s: sD, l: lD } = hexToHsl(color);

  // ─────────── LIVE PREVIEW (overlay content) ───────────
  const PreviewContent = () => (
    <div className="h-full overflow-y-auto no-scrollbar p-4 flex flex-col gap-3"
      style={{ background: palette.background, fontFamily: `'${fonts.body}', sans-serif` }}>
      <div className="rounded-2xl p-5 border" style={{ background: palette.surface, borderColor: palette.primary + "22" }}>
        <p className="mono text-xs mb-1" style={{ color: palette.accent, letterSpacing: "0.12em" }}>DESIGN SYSTEM</p>
        <h1 style={{ fontFamily: `'${fonts.display}', sans-serif`, fontSize: fonts.baseSize * 2.4, fontWeight: 700, color: palette.text, lineHeight: 1.1 }}>ChromaForge</h1>
        <p style={{ color: palette.muted, fontSize: fonts.baseSize * 0.95, lineHeight: 1.6, marginTop: 8, marginBottom: 16 }}>
          From one color to a full design system. Golden ratio harmony, live preview.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button style={{ background: palette.primary, color: "#fff", borderRadius: spacing, fontSize: fonts.baseSize*0.9, padding: `${spacing*1.25}px ${spacing*2.5}px`, fontWeight: 600 }}>Get Started</button>
          <button style={{ background: "transparent", border: `1px solid ${palette.primary}55`, color: palette.primary, borderRadius: spacing, fontSize: fonts.baseSize*0.9, padding: `${spacing*1.25}px ${spacing*2.5}px` }}>Explore</button>
        </div>
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: palette.surface, borderColor: palette.muted + "22" }}>
        <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>TYPOGRAPHY</p>
        <div className="flex items-baseline gap-3">
          <span style={{ fontFamily: `'${fonts.display}', sans-serif`, fontSize: fonts.baseSize*2.8, fontWeight: 300, color: palette.text, lineHeight: 1 }}>Aa</span>
          <span style={{ fontFamily: `'${fonts.display}', sans-serif`, fontSize: fonts.baseSize*1.2, fontWeight: 700, color: palette.text }}>{fonts.display}</span>
        </div>
        <p style={{ color: palette.muted, fontSize: fonts.baseSize*0.9, marginTop: 10, lineHeight: 1.6 }}>{fonts.body} — The quick brown fox jumps over the lazy dog.</p>
        <p className="mono mt-2" style={{ fontSize: fonts.baseSize*0.78, color: palette.accent }}>const theme = forge(&apos;{color}&apos;);</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 border" style={{ background: palette.surface, borderColor: palette.muted+"22" }}>
          <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>TOKENS</p>
          {["Color","Type","Space"].map((it,i) => (
            <div key={it} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i<2?`1px solid ${palette.muted}18`:"none" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: [palette.primary,palette.accent,palette.support][i] }}/>
              <span style={{ fontSize: fonts.baseSize*0.85, color: palette.text }}>{it}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: palette.surface, borderColor: palette.accent+"22" }}>
          <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>BADGES</p>
          <div className="flex flex-col gap-2">
            {[["Primary",palette.primary],["Accent",palette.accent],["Support",palette.support]].map(([l,c]) => (
              <span key={l} className="px-2.5 py-1 rounded-full text-xs font-medium w-fit" style={{ background: c+"22", color: c }}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 border" style={{ background: palette.surface, borderColor: palette.muted+"22" }}>
        <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>SPACING · {spacing}px base</p>
        <div className="flex items-end gap-2">
          {Object.entries(generateSpacingScale(spacing)).map(([k,v]) => (
            <div key={k} className="flex flex-col items-center gap-1 flex-1">
              <div className="rounded-sm w-full" style={{ height: Math.min(v*1.1, 64), background: palette.primary+"55" }}/>
              <span className="mono" style={{ fontSize: 8, color: palette.muted }}>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────── PANELS (each fits viewport, no scroll) ───────────
  const ColorsPanel = () => (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div>
        <p className="mono text-xs mb-2" style={{ color: "#666", letterSpacing: "0.1em" }}>BASE COLOR</p>
        <div className="flex gap-3 items-center">
          <input type="color" value={color} onChange={e => applyColor(e.target.value)} style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 16 }}/>
          <div className="flex-1 min-w-0">
            <input type="text" value={color}
              onChange={e => { const v=e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) { setColor(v); if (v.length===7) applyColor(v); }}}
              className="mono w-full px-3 py-3 rounded-xl text-base border outline-none"
              style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#f0f0f0" }}/>
            <p className="mono text-xs mt-1.5" style={{ color: "#555" }}>{Math.round(hD)}° {Math.round(sD)}% {Math.round(lD)}%</p>
          </div>
          <button onClick={randomColor} className="rounded-xl border flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52, background: "#1a1a1a", borderColor: "#2a2a2a" }}>
            <RefreshCw size={18} color="#888"/>
          </button>
        </div>
      </div>

      <div>
        <p className="mono text-xs mb-2.5" style={{ color: "#666", letterSpacing: "0.1em" }}>PRESETS</p>
        <div className="flex gap-2.5 justify-between">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => applyColor(c)} className="rounded-xl active:scale-90 transition-transform flex-1 aspect-square"
              style={{ background: c, border: color===c?"2.5px solid #fbbf24":"2.5px solid transparent", maxWidth: 48 }}/>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <p className="mono text-xs mb-2.5" style={{ color: "#666", letterSpacing: "0.1em" }}>HARMONY</p>
        <div className="grid grid-cols-2 gap-2.5 flex-1">
          {HARMONY_OPTIONS.map(o => (
            <button key={o.id} onClick={() => applyHarmony(o.id)} className="rounded-2xl text-left border transition-all flex flex-col justify-center px-4"
              style={{ background: harmony===o.id?palette.primary+"18":"#111", borderColor: harmony===o.id?palette.primary:"#2a2a2a" }}>
              <p className="text-base font-semibold" style={{ color: harmony===o.id?palette.primary:"#aaa" }}>{o.label}</p>
              <p className="mono text-xs mt-1" style={{ color: "#555" }}>{o.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const TypePanel = () => (
    <div className="flex flex-col p-4 h-full gap-3">
      <div className="flex-shrink-0">
        <p className="mono text-xs mb-2" style={{ color: "#666", letterSpacing: "0.1em" }}>DISPLAY FONT</p>
        <div className="overflow-y-auto no-scrollbar flex flex-col gap-1.5" style={{ maxHeight: "30vh" }}>
          {DISPLAY_FONTS.map(f => (
            <button key={f} onClick={() => { loadFont(f); setFonts(p=>({...p,display:f})); }}
              className="text-left px-4 py-2.5 rounded-xl border transition-all flex-shrink-0"
              style={{ background: fonts.display===f?"#1a1a1a":"transparent", borderColor: fonts.display===f?"#fbbf24":"#2a2a2a" }}>
              <span style={{ fontFamily: `'${f}', sans-serif`, fontSize: 17, color: fonts.display===f?"#f0f0f0":"#888", fontWeight: 600 }}>{f}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0">
        <p className="mono text-xs mb-2" style={{ color: "#666", letterSpacing: "0.1em" }}>BODY FONT</p>
        <div className="overflow-y-auto no-scrollbar flex flex-col gap-1.5" style={{ maxHeight: "24vh" }}>
          {BODY_FONTS.map(f => (
            <button key={f} onClick={() => { loadFont(f); setFonts(p=>({...p,body:f})); }}
              className="text-left px-4 py-2.5 rounded-xl border transition-all flex-shrink-0"
              style={{ background: fonts.body===f?"#1a1a1a":"transparent", borderColor: fonts.body===f?"#fbbf24":"#2a2a2a" }}>
              <span style={{ fontFamily: `'${f}', sans-serif`, fontSize: 15, color: fonts.body===f?"#f0f0f0":"#888" }}>{f}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 mt-auto">
        <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>BASE SIZE — {fonts.baseSize}px</p>
        <input type="range" min={12} max={20} value={fonts.baseSize} onChange={e => setFonts(p=>({...p,baseSize:+e.target.value}))}/>
      </div>
    </div>
  );

  const SpacingPanel = () => (
    <div className="flex flex-col gap-5 p-4 h-full">
      <div>
        <p className="mono text-xs mb-2.5" style={{ color: "#666", letterSpacing: "0.1em" }}>BASE UNIT</p>
        <div className="flex gap-2.5">
          {[4,8,16].map(u => (
            <button key={u} onClick={() => setSpacing(u)} className="flex-1 py-4 rounded-2xl text-lg font-semibold border mono transition-all"
              style={{ background: spacing===u?palette.primary+"18":"#111", borderColor: spacing===u?palette.primary:"#2a2a2a", color: spacing===u?palette.primary:"#888" }}>{u}px</button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>SCALE</p>
        <div className="flex flex-col gap-2.5">
          {Object.entries(generateSpacingScale(spacing)).map(([k,v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="mono text-xs w-9" style={{ color: "#555" }}>{k}</span>
              <div className="h-2.5 rounded-full" style={{ width: Math.min(v*1.5, 180), background: palette.primary+"55" }}/>
              <span className="mono text-xs ml-auto" style={{ color: "#777" }}>{v}px</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0">
        <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>RADIUS</p>
        <div className="flex gap-6 items-end">
          {[["sm",spacing*0.5],["md",spacing],["lg",spacing*2]].map(([l,r]) => (
            <div key={l as string} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 border-2" style={{ borderColor: palette.primary, borderRadius: `${r}px`, background: palette.primary+"12" }}/>
              <span className="mono text-xs" style={{ color: "#777" }}>{l} · {r}px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ExportPanel = () => (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div className="flex gap-2.5 flex-shrink-0">
        {(["css","tailwind"] as ExportFmt[]).map(f => (
          <button key={f} onClick={() => setExportFmt(f)} className="flex-1 py-3 rounded-xl text-sm font-semibold border mono transition-all"
            style={{ background: exportFmt===f?palette.primary:"#111", borderColor: exportFmt===f?palette.primary:"#2a2a2a", color: exportFmt===f?"#fff":"#888" }}>
            {f==="css"?"CSS Variables":"Tailwind"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar rounded-2xl p-4 border mono text-xs leading-relaxed"
        style={{ background: "#0d0d0d", borderColor: "#2a2a2a", color: "#999" }}>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{exportCode}</pre>
      </div>
      <button onClick={copyExport} className="flex-shrink-0 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
        style={{ background: exportCopied?"#22c55e":palette.primary, color: "#fff" }}>
        {exportCopied ? <><Check size={18}/> Copied!</> : <><Copy size={18}/> Copy Code</>}
      </button>
    </div>
  );

  const renderPanel = () => {
    switch(tab) {
      case "colors": return <ColorsPanel/>;
      case "type": return <TypePanel/>;
      case "spacing": return <SpacingPanel/>;
      case "export": return <ExportPanel/>;
    }
  };

  return (
    <div className="app-shell w-screen overflow-hidden flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* signature color bar */}
      <div className="transition-color-bar flex-shrink-0" style={{ background: palette.primary, height: 4 }}/>

      {/* topbar */}
      <header className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-color-bar" style={{ background: palette.primary }}>
            <Droplets size={14} color="#fff"/>
          </div>
          <span className="font-bold text-base" style={{ color: "#f0f0f0" }}>ChromaForge</span>
        </div>
        <div className="flex items-center gap-2">
          {saved.length > 0 && (
            <button onClick={() => setShowSaved(p=>!p)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border"
              style={{ background: "#111", borderColor: "#2a2a2a", color: "#888" }}>
              Saved <span className="mono" style={{ color: palette.accent }}>{saved.length}</span>
            </button>
          )}
          <button onClick={savePalette} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ background: "#111", borderColor: "#2a2a2a", color: "#f0f0f0" }}>
            <Save size={13}/> Save
          </button>
        </div>
      </header>

      {/* saved dropdown */}
      <AnimatePresence>
        {showSaved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-14 right-3 z-50 rounded-2xl border p-3 w-72 shadow-2xl" style={{ background: "#111", borderColor: "#2a2a2a" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-xs" style={{ color: "#666" }}>SAVED</span>
              <button onClick={() => setShowSaved(false)}><X size={14} color="#444"/></button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto no-scrollbar">
              {saved.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer group border" style={{ background: "#0d0d0d", borderColor: "#2a2a2a" }}
                  onClick={() => { setColor(s.color); setHarmony(s.harmony); setPalette(s.palette); setShowSaved(false); }}>
                  <div className="flex gap-0.5">
                    {[s.palette.primary,s.palette.accent,s.palette.support].map((c,i) => <div key={i} className="w-5 h-5 rounded-md" style={{ background: c }}/>)}
                  </div>
                  <span className="text-xs flex-1" style={{ color: "#888" }}>{s.label}</span>
                  <button onClick={e => { e.stopPropagation(); deleteSaved(s.id); }}><Trash2 size={12} color="#ef4444"/></button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* swatch strip */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar flex-shrink-0" style={{ borderBottom: "1px solid #1a1a1a" }}>
        {swatches.map(s => (
          <button key={s.key} onClick={() => copyHex(s.hex, s.key)}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border active:scale-95 transition-all"
            style={{ background: "#111", borderColor: copiedKey===s.key?s.hex:"#2a2a2a" }}>
            <div className="w-4 h-4 rounded" style={{ background: s.hex }}/>
            <span className="mono text-xs" style={{ color: "#888", fontSize: 10 }}>{copiedKey===s.key ? "✓" : s.hex.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* ───── DESKTOP: 3 columns ───── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-72 flex flex-col border-r overflow-hidden flex-shrink-0" style={{ borderColor: "#1a1a1a" }}>
          <div className="flex gap-1 p-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #1a1a1a" }}>
            {TABS.filter(t=>t.id!=="export").map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: tab===t.id?palette.primary+"18":"transparent", color: tab===t.id?palette.primary:"#666", border: `1px solid ${tab===t.id?palette.primary:"transparent"}` }}>{t.label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {tab === "export" ? <ColorsPanel/> : renderPanel()}
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid #1a1a1a" }}>
            <span className="mono text-xs" style={{ color: "#444" }}>LIVE PREVIEW</span>
          </div>
          <div className="flex-1 overflow-hidden"><PreviewContent/></div>
        </div>
        <div className="w-64 flex flex-col border-l overflow-hidden flex-shrink-0" style={{ borderColor: "#1a1a1a" }}>
          <ExportPanel/>
        </div>
      </div>

      {/* ───── MOBILE: single panel fills screen, no scroll ───── */}
      <div className="flex md:hidden flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            {renderPanel()}
          </motion.div>
        </AnimatePresence>

        {/* Floating preview button — only on non-export tabs */}
        {tab !== "export" && (
          <button onClick={() => setShowPreview(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm shadow-2xl active:scale-95 transition-transform z-30"
            style={{ background: palette.primary, color: "#fff" }}>
            <Eye size={17}/> Preview
          </button>
        )}
      </div>

      {/* MOBILE bottom nav */}
      <nav className="flex md:hidden flex-shrink-0" style={{ borderTop: "1px solid #1a1a1a", background: "#0a0a0a" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
            style={{ color: tab===t.id?palette.primary:"#555" }}>
            {t.icon}
            <span className="text-xs font-medium mono">{t.label}</span>
            {tab===t.id && <div className="absolute top-0 w-9 h-0.5 rounded-full" style={{ background: palette.primary }}/>}
          </button>
        ))}
      </nav>

      {/* ───── PREVIEW OVERLAY (full screen) ───── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div className="fixed inset-0 z-50 flex flex-col md:hidden"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ background: palette.background }}>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${palette.muted}22` }}>
              <span className="mono text-xs" style={{ color: palette.muted, letterSpacing: "0.1em" }}>LIVE PREVIEW</span>
              <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg" style={{ background: palette.surface }}>
                <X size={18} color={palette.text}/>
              </button>
            </div>
            <div className="flex-1 overflow-hidden"><PreviewContent/></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
