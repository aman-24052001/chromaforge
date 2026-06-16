"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Save, RefreshCw, Trash2, ChevronDown, Palette, Type, Maximize2, Code, Droplets, X } from "lucide-react";
import {
  hexToHsl, hslToHex, generatePalette, generateSpacingScale,
  paletteToCss, paletteToTailwind,
  DISPLAY_FONTS, BODY_FONTS, HARMONY_OPTIONS, PRESET_COLORS,
  type ColorPalette, type FontConfig,
} from "./lib/colorEngine";

type Tab = "colors" | "type" | "spacing" | "export";
type ExportFmt = "css" | "tailwind";

interface Saved {
  id: string; label: string; color: string; harmony: string; palette: ColorPalette;
}

const TAB_CONFIG: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "colors",  icon: <Palette size={18}/>,  label: "Colors"   },
  { id: "type",    icon: <Type size={18}/>,      label: "Type"     },
  { id: "spacing", icon: <Maximize2 size={18}/>, label: "Space"    },
  { id: "export",  icon: <Code size={18}/>,      label: "Export"   },
];

function Swatch({ label, hex, onCopy }: { label: string; hex: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(hex); setCopied(true); onCopy(); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={handle}
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden border transition-transform active:scale-95"
      style={{ width: 100, borderColor: "#2a2a2a", background: "#111" }}>
      <div style={{ background: hex, height: 64, width: "100%" }} />
      <div className="px-2.5 py-2">
        <p className="text-xs font-medium" style={{ color: "#f0f0f0" }}>{label}</p>
        <p className="mono text-xs mt-0.5" style={{ color: "#666", fontSize: 10 }}>{hex.toUpperCase()}</p>
        <div className="mt-1.5 flex items-center justify-center h-5">
          {copied ? <Check size={11} color="#22c55e"/> : <Copy size={11} color="#444"/>}
        </div>
      </div>
    </button>
  );
}

function FontPill({ name, selected, role, onSelect }: { name: string; selected: boolean; role: "display" | "body"; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="w-full text-left px-4 py-3 rounded-xl transition-all active:scale-98 border"
      style={{
        background: selected ? "#1a1a1a" : "transparent",
        borderColor: selected ? "#fbbf24" : "#2a2a2a",
      }}>
      <span style={{
        fontFamily: `'${name}', ${role === "display" ? "serif" : "sans-serif"}`,
        fontSize: 16,
        color: selected ? "#f0f0f0" : "#888",
        fontWeight: role === "display" ? 600 : 400,
      }}>{name}</span>
    </button>
  );
}

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
  const hexInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const r = localStorage.getItem("cf-saved"); if (r) setSaved(JSON.parse(r)); } catch {}
  }, []);

  const applyColor = useCallback((hex: string, h = harmony) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setColor(hex); setPalette(generatePalette(hex, h));
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
    const entry: Saved = {
      id: Date.now().toString(),
      label: `${harmony.charAt(0).toUpperCase()+harmony.slice(1)} ${Math.round(h)}°`,
      color, harmony, palette,
    };
    const next = [entry, ...saved].slice(0, 10);
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
    const newHex = hslToHex((h + 67 + Math.random() * 100) % 360, 55 + Math.random() * 35, 32 + Math.random() * 25);
    applyColor(newHex);
  };

  const swatches = [
    { key: "primary", label: "Primary", hex: palette.primary },
    { key: "accent",  label: "Accent",  hex: palette.accent  },
    { key: "support", label: "Support", hex: palette.support  },
    { key: "bg",      label: "BG",      hex: palette.background },
    { key: "surface", label: "Surface", hex: palette.surface  },
    { key: "text",    label: "Text",    hex: palette.text     },
    { key: "muted",   label: "Muted",   hex: palette.muted    },
  ];

  const exportCode = exportFmt === "css"
    ? paletteToCss(palette, fonts, spacing)
    : paletteToTailwind(palette, fonts, spacing);

  const { h: hDeg, s: sDeg, l: lDeg } = hexToHsl(color);

  // ─── DESKTOP SIDE PANEL ─────────────────────────────
  const InputPanel = () => (
    <AnimatePresence mode="wait">
      <motion.div key={tab}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
        className="flex flex-col gap-5 p-5 overflow-y-auto h-full">

        {tab === "colors" && <>
          {/* Big color display */}
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#2a2a2a" }}>
            <div className="transition-color-bar" style={{ background: palette.primary, height: 80 }}/>
            <div className="flex gap-1 p-3" style={{ background: "#111" }}>
              {[palette.primary, palette.accent, palette.support, palette.muted].map((c,i) => (
                <div key={i} className="flex-1 h-6 rounded-md" style={{ background: c }}/>
              ))}
            </div>
          </div>

          {/* Picker row */}
          <div>
            <p className="mono text-xs mb-2" style={{ color: "#666", letterSpacing: "0.1em" }}>BASE COLOR</p>
            <div className="flex gap-3 items-center">
              <input type="color" value={color} onChange={e => applyColor(e.target.value)}
                className="rounded-xl cursor-pointer" style={{ width: 52, height: 52 }}/>
              <div className="flex-1">
                <input ref={hexInputRef} type="text" value={color}
                  onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { if (e.target.value.length === 7) applyColor(e.target.value); else setColor(e.target.value); }}}
                  className="mono w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#f0f0f0" }}/>
                <p className="mono text-xs mt-1" style={{ color: "#444" }}>
                  {Math.round(hDeg)}° {Math.round(sDeg)}% {Math.round(lDeg)}%
                </p>
              </div>
              <button onClick={randomColor} className="p-3 rounded-xl border transition-colors"
                style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}>
                <RefreshCw size={16} color="#666"/>
              </button>
            </div>
          </div>

          {/* Presets */}
          <div>
            <p className="mono text-xs mb-2" style={{ color: "#666", letterSpacing: "0.1em" }}>PRESETS</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => applyColor(c)}
                  className="rounded-lg transition-transform active:scale-90 border-2"
                  style={{ width: 32, height: 32, background: c, borderColor: color === c ? "#fbbf24" : "transparent" }}/>
              ))}
            </div>
          </div>

          {/* Harmony */}
          <div>
            <p className="mono text-xs mb-2" style={{ color: "#666", letterSpacing: "0.1em" }}>HARMONY</p>
            <div className="grid grid-cols-2 gap-2">
              {HARMONY_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => applyHarmony(opt.id)}
                  className="py-2.5 px-3 rounded-xl text-left border transition-all"
                  style={{
                    background: harmony === opt.id ? palette.primary + "18" : "#111",
                    borderColor: harmony === opt.id ? palette.primary : "#2a2a2a",
                  }}>
                  <p className="text-sm font-medium" style={{ color: harmony === opt.id ? palette.primary : "#888" }}>{opt.label}</p>
                  <p className="mono text-xs mt-0.5" style={{ color: "#444" }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </>}

        {tab === "type" && <>
          <div>
            <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>DISPLAY FONT</p>
            <div className="flex flex-col gap-1.5">
              {DISPLAY_FONTS.map(f => (
                <FontPill key={f} name={f} selected={fonts.display === f} role="display"
                  onSelect={() => { loadFont(f); setFonts(p => ({...p, display: f})); }}/>
              ))}
            </div>
          </div>
          <div>
            <p className="mono text-xs mb-3 mt-2" style={{ color: "#666", letterSpacing: "0.1em" }}>BODY FONT</p>
            <div className="flex flex-col gap-1.5">
              {BODY_FONTS.map(f => (
                <FontPill key={f} name={f} selected={fonts.body === f} role="body"
                  onSelect={() => { loadFont(f); setFonts(p => ({...p, body: f})); }}/>
              ))}
            </div>
          </div>
          <div>
            <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>BASE SIZE — {fonts.baseSize}px</p>
            <input type="range" min={12} max={20} value={fonts.baseSize}
              onChange={e => setFonts(p => ({...p, baseSize: +e.target.value}))}/>
          </div>
        </>}

        {tab === "spacing" && <>
          <div>
            <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>BASE UNIT</p>
            <div className="flex gap-2">
              {[4, 8, 16].map(u => (
                <button key={u} onClick={() => setSpacing(u)}
                  className="flex-1 py-3 rounded-xl font-medium border transition-all mono"
                  style={{
                    background: spacing === u ? palette.primary + "18" : "#111",
                    borderColor: spacing === u ? palette.primary : "#2a2a2a",
                    color: spacing === u ? palette.primary : "#666",
                  }}>{u}px</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>SCALE</p>
            <div className="flex flex-col gap-3">
              {Object.entries(generateSpacingScale(spacing)).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="mono text-xs w-8" style={{ color: "#444" }}>{key}</span>
                  <div className="h-2 rounded-full" style={{ width: Math.min(val * 1.5, 180), background: palette.primary + "55" }}/>
                  <span className="mono text-xs ml-auto" style={{ color: "#666" }}>{val}px</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mono text-xs mb-3" style={{ color: "#666", letterSpacing: "0.1em" }}>RADIUS</p>
            <div className="flex gap-4 items-end">
              {[["sm", spacing * 0.5], ["md", spacing], ["lg", spacing * 2]].map(([label, r]) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 border-2" style={{ borderColor: palette.primary, borderRadius: `${r}px`, background: palette.primary + "12" }}/>
                  <span className="mono text-xs" style={{ color: "#666" }}>{label}</span>
                  <span className="mono text-xs" style={{ color: "#444" }}>{r}px</span>
                </div>
              ))}
            </div>
          </div>
        </>}

        {tab === "export" && <>
          <div className="flex gap-2">
            {(["css", "tailwind"] as ExportFmt[]).map(f => (
              <button key={f} onClick={() => setExportFmt(f)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all mono"
                style={{
                  background: exportFmt === f ? palette.primary : "#111",
                  borderColor: exportFmt === f ? palette.primary : "#2a2a2a",
                  color: exportFmt === f ? "#fff" : "#666",
                }}>{f === "css" ? "CSS Vars" : "Tailwind"}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto rounded-2xl p-4 border mono text-xs leading-relaxed"
            style={{ background: "#0d0d0d", borderColor: "#2a2a2a", color: "#888", minHeight: 200 }}>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{exportCode}</pre>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(exportCode); setExportCopied(true); setTimeout(() => setExportCopied(false), 2000); }}
            className="py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            style={{ background: exportCopied ? "#22c55e" : palette.primary, color: "#fff" }}>
            {exportCopied ? <><Check size={15}/> Copied!</> : <><Copy size={15}/> Copy Code</>}
          </button>
        </>}
      </motion.div>
    </AnimatePresence>
  );

  // ─── LIVE PREVIEW ────────────────────────────────────
  const Preview = () => (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-4"
      style={{ background: palette.background, fontFamily: `'${fonts.body}', sans-serif` }}>

      {/* Hero */}
      <div className="rounded-2xl p-5 border" style={{ background: palette.surface, borderColor: palette.primary + "22" }}>
        <p className="mono text-xs mb-1" style={{ color: palette.accent, letterSpacing: "0.12em" }}>DESIGN SYSTEM</p>
        <h1 style={{ fontFamily: `'${fonts.display}', sans-serif`, fontSize: fonts.baseSize * 2.2, fontWeight: 700, color: palette.text, lineHeight: 1.1 }}>
          ChromaForge
        </h1>
        <p style={{ color: palette.muted, fontSize: fonts.baseSize * 0.9, lineHeight: 1.6, marginTop: spacing, marginBottom: spacing * 1.5 }}>
          From one color to a complete design system. Golden ratio harmony, live preview.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 font-semibold text-sm"
            style={{ background: palette.primary, color: "#fff", borderRadius: spacing, fontSize: fonts.baseSize * 0.875 }}>
            Get Started
          </button>
          <button className="px-4 py-2 text-sm border"
            style={{ background: "transparent", borderColor: palette.primary + "55", color: palette.primary, borderRadius: spacing, fontSize: fonts.baseSize * 0.875 }}>
            Explore
          </button>
        </div>
      </div>

      {/* Type specimen */}
      <div className="rounded-2xl p-5 border" style={{ background: palette.surface, borderColor: palette.muted + "22" }}>
        <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>TYPOGRAPHY</p>
        <p style={{ fontFamily: `'${fonts.display}', sans-serif`, fontSize: fonts.baseSize * 2.4, fontWeight: 300, color: palette.text, lineHeight: 1 }}>Aa</p>
        <p style={{ fontFamily: `'${fonts.display}', sans-serif`, fontSize: fonts.baseSize * 1.4, fontWeight: 700, color: palette.text, marginTop: 4 }}>{fonts.display}</p>
        <p style={{ color: palette.muted, fontSize: fonts.baseSize * 0.875, marginTop: 8, lineHeight: 1.65, fontFamily: `'${fonts.body}', sans-serif` }}>
          {fonts.body} — The quick brown fox jumps over the lazy dog.
        </p>
        <p className="mono mt-2" style={{ fontSize: fonts.baseSize * 0.75, color: palette.accent }}>
          const theme = forge('{color}');
        </p>
      </div>

      {/* Badges + list */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 border" style={{ background: palette.surface, borderColor: palette.muted + "22" }}>
          <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>TOKENS</p>
          {["Color","Type","Space"].map((item, i) => (
            <div key={item} className="flex items-center gap-2 py-2"
              style={{ borderBottom: i < 2 ? `1px solid ${palette.muted}18` : "none" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: [palette.primary, palette.accent, palette.support][i] }}/>
              <span style={{ fontSize: fonts.baseSize * 0.8, color: palette.text }}>{item}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: palette.surface, borderColor: palette.accent + "22" }}>
          <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>BADGES</p>
          <div className="flex flex-col gap-2">
            {[{ label: "Primary", c: palette.primary }, { label: "Accent", c: palette.accent }, { label: "Support", c: palette.support }].map(b => (
              <span key={b.label} className="px-2 py-1 rounded-full text-xs font-medium inline-block w-fit"
                style={{ background: b.c + "22", color: b.c }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Spacing ruler */}
      <div className="rounded-2xl p-4 border" style={{ background: palette.surface, borderColor: palette.muted + "22" }}>
        <p className="mono text-xs mb-3" style={{ color: palette.muted, letterSpacing: "0.1em" }}>SPACING · {spacing}px base</p>
        <div className="flex items-end gap-1">
          {Object.entries(generateSpacingScale(spacing)).slice(0, 5).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className="rounded-sm w-5" style={{ height: Math.min(val * 1.2, 64), background: palette.primary + "55" }}/>
              <span className="mono" style={{ fontSize: 8, color: palette.muted }}>{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: "#0a0a0a" }}>

      {/* ── COLOR BAR (signature element) ── */}
      <div className="transition-color-bar flex-shrink-0" style={{ background: palette.primary, height: 4 }}/>

      {/* ── TOPBAR ── */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-color-bar"
            style={{ background: palette.primary }}>
            <Droplets size={14} color="#fff"/>
          </div>
          <span className="font-bold tracking-tight text-base" style={{ color: "#f0f0f0" }}>ChromaForge</span>
          <span className="mono text-xs px-1.5 py-0.5 rounded" style={{ background: "#1a1a1a", color: "#444" }}>v2</span>
        </div>
        <div className="flex items-center gap-2">
          {saved.length > 0 && (
            <button onClick={() => setShowSaved(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
              style={{ background: "#111", borderColor: "#2a2a2a", color: "#888" }}>
              Saved <span className="mono" style={{ color: palette.accent }}>{saved.length}</span>
              <ChevronDown size={12} className={showSaved ? "rotate-180" : ""} style={{ transition: "transform 0.2s" }}/>
            </button>
          )}
          <button onClick={savePalette}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{ background: "#111", borderColor: "#2a2a2a", color: "#f0f0f0" }}>
            <Save size={13}/> Save
          </button>
        </div>
      </header>

      {/* ── SAVED DROPDOWN ── */}
      <AnimatePresence>
        {showSaved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-16 right-4 z-50 rounded-2xl border p-3 w-72 shadow-2xl"
            style={{ background: "#111", borderColor: "#2a2a2a" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-xs" style={{ color: "#666" }}>SAVED PALETTES</span>
              <button onClick={() => setShowSaved(false)}><X size={14} color="#444"/></button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {saved.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer group border transition-all"
                  style={{ background: "#0d0d0d", borderColor: "#2a2a2a" }}
                  onClick={() => { setColor(s.color); setHarmony(s.harmony); setPalette(s.palette); setShowSaved(false); }}>
                  <div className="flex gap-0.5">
                    {[s.palette.primary, s.palette.accent, s.palette.support].map((c,i) => (
                      <div key={i} className="w-5 h-5 rounded-md" style={{ background: c }}/>
                    ))}
                  </div>
                  <span className="text-xs flex-1" style={{ color: "#888" }}>{s.label}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); deleteSaved(s.id); }}>
                    <Trash2 size={12} color="#ef4444"/>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SWATCH STRIP (always visible) ── */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0"
        style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
        {swatches.map(s => (
          <button key={s.key}
            onClick={() => { navigator.clipboard.writeText(s.hex); setCopiedKey(s.key); setTimeout(() => setCopiedKey(null), 1200); }}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95"
            style={{ background: "#111", borderColor: copiedKey === s.key ? s.hex : "#2a2a2a" }}>
            <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: s.hex }}/>
            <div className="hidden sm:block">
              <p className="text-xs font-medium leading-none" style={{ color: "#f0f0f0" }}>{s.label}</p>
              <p className="mono text-xs leading-none mt-0.5" style={{ color: "#444", fontSize: 10 }}>{s.hex.toUpperCase()}</p>
            </div>
            {copiedKey === s.key && <Check size={11} color="#22c55e"/>}
          </button>
        ))}
      </div>

      {/* ── MAIN AREA ── */}
      {/* MOBILE: tabs control full panel. DESKTOP: 3 columns */}
      <div className="flex-1 flex overflow-hidden">

        {/* DESKTOP LEFT PANEL */}
        <div className="hidden md:flex w-72 flex-col border-r overflow-hidden flex-shrink-0"
          style={{ borderColor: "#1a1a1a", background: "#0a0a0a" }}>
          {/* Desktop tab pills */}
          <div className="flex gap-1 p-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
            {TAB_CONFIG.filter(t => t.id !== "export").map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: tab === t.id ? palette.primary + "18" : "transparent", color: tab === t.id ? palette.primary : "#666", border: `1px solid ${tab === t.id ? palette.primary : "transparent"}` }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            <InputPanel/>
          </div>
        </div>

        {/* CENTER: LIVE PREVIEW */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #1a1a1a" }}>
            <span className="mono text-xs" style={{ color: "#444" }}>LIVE PREVIEW</span>
            <span className="mono text-xs px-2 py-0.5 rounded" style={{ background: "#1a1a1a", color: palette.primary }}>{palette.background}</span>
          </div>
          <Preview/>
        </div>

        {/* DESKTOP RIGHT: EXPORT */}
        <div className="hidden md:flex w-64 flex-col border-l overflow-hidden"
          style={{ borderColor: "#1a1a1a", background: "#0a0a0a" }}>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <p className="mono text-xs" style={{ color: "#666", letterSpacing: "0.1em" }}>EXPORT</p>
            <div className="flex gap-1.5">
              {(["css","tailwind"] as ExportFmt[]).map(f => (
                <button key={f} onClick={() => setExportFmt(f)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border transition-all mono"
                  style={{ background: exportFmt === f ? palette.primary : "#111", borderColor: exportFmt === f ? palette.primary : "#2a2a2a", color: exportFmt === f ? "#fff" : "#666" }}>
                  {f === "css" ? "CSS" : "TW"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl p-3 border mono text-xs leading-relaxed"
              style={{ background: "#0d0d0d", borderColor: "#2a2a2a", color: "#666" }}>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{exportCode}</pre>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(exportCode); setExportCopied(true); setTimeout(() => setExportCopied(false), 2000); }}
              className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: exportCopied ? "#22c55e" : palette.primary, color: "#fff" }}>
              {exportCopied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy</>}
            </button>
          </div>
        </div>

        {/* MOBILE: Full screen tab content */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={tab} className="flex-1 overflow-y-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              {tab === "export" ? (
                <div className="p-4 flex flex-col gap-3 h-full">
                  <div className="flex gap-2">
                    {(["css","tailwind"] as ExportFmt[]).map(f => (
                      <button key={f} onClick={() => setExportFmt(f)}
                        className="flex-1 py-3 rounded-xl text-sm font-medium border transition-all mono"
                        style={{ background: exportFmt === f ? palette.primary : "#111", borderColor: exportFmt === f ? palette.primary : "#2a2a2a", color: exportFmt === f ? "#fff" : "#666" }}>
                        {f === "css" ? "CSS Variables" : "Tailwind"}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 rounded-2xl p-4 border mono text-xs leading-relaxed overflow-y-auto"
                    style={{ background: "#0d0d0d", borderColor: "#2a2a2a", color: "#888" }}>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{exportCode}</pre>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(exportCode); setExportCopied(true); setTimeout(() => setExportCopied(false), 2000); }}
                    className="py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ background: exportCopied ? "#22c55e" : palette.primary, color: "#fff" }}>
                    {exportCopied ? <><Check size={18}/> Copied!</> : <><Copy size={18}/> Copy {exportFmt === "css" ? "CSS Variables" : "Tailwind Config"}</>}
                  </button>
                </div>
              ) : (
                <InputPanel/>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="flex md:hidden flex-shrink-0 border-t" style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}>
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
            style={{ color: tab === t.id ? palette.primary : "#444" }}>
            <div style={{ color: tab === t.id ? palette.primary : "#444" }}>{t.icon}</div>
            <span className="text-xs font-medium mono">{t.label}</span>
            {tab === t.id && <div className="w-4 h-0.5 rounded-full" style={{ background: palette.primary }}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}
