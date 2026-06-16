"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Palette, Type, Maximize2, Save, Trash2, Download,
  ChevronRight, Droplets, RefreshCw
} from "lucide-react";
import {
  hexToHsl, hslToHex, generateGoldenPalette, generateComplementary,
  generateTriadic, generateAnalogous, generateSpacingScale,
  paletteToCssVars, paletteToTailwind,
  GOOGLE_FONTS_DISPLAY, GOOGLE_FONTS_BODY,
  type ColorPalette, type FontConfig
} from "./lib/colorEngine";

type Tab = "colors" | "typography" | "spacing";
type Harmony = "golden" | "complementary" | "triadic" | "analogous";
type ExportMode = "css" | "tailwind";

interface SavedPalette {
  id: string;
  name: string;
  color: string;
  harmony: Harmony;
  palette: ColorPalette;
}

const HARMONY_LABELS: Record<Harmony, string> = {
  golden: "Golden Ratio",
  complementary: "Complementary",
  triadic: "Triadic",
  analogous: "Analogous",
};

function generatePalette(color: string, harmony: Harmony): ColorPalette {
  switch (harmony) {
    case "golden": return generateGoldenPalette(color);
    case "complementary": return generateComplementary(color);
    case "triadic": return generateTriadic(color);
    case "analogous": return generateAnalogous(color);
  }
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("colors");
  const [color, setColor] = useState("#008CBB");
  const [harmony, setHarmony] = useState<Harmony>("golden");
  const [palette, setPalette] = useState<ColorPalette>(generateGoldenPalette("#008CBB"));
  const [fonts, setFonts] = useState<FontConfig>({ display: "Fraunces", body: "Inter", baseSize: 16 });
  const [spacing, setSpacing] = useState(8);
  const [exportMode, setExportMode] = useState<ExportMode>("css");
  const [saved, setSaved] = useState<SavedPalette[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState<Set<string>>(new Set(["Inter", "Fraunces"]));

  useEffect(() => {
    const raw = localStorage.getItem("chromaforge-saved");
    if (raw) setSaved(JSON.parse(raw));
  }, []);

  const updateColor = useCallback((hex: string) => {
    setColor(hex);
    setPalette(generatePalette(hex, harmony));
  }, [harmony]);

  const updateHarmony = useCallback((h: Harmony) => {
    setHarmony(h);
    setPalette(generatePalette(color, h));
  }, [color]);

  const loadFont = (family: string) => {
    if (fontsLoaded.has(family)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@300;400;600;700&display=swap`;
    document.head.appendChild(link);
    setFontsLoaded(prev => new Set([...prev, family]));
  };

  const copyColor = (hex: string, key: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyExport = () => {
    const text = exportMode === "css"
      ? paletteToCssVars(palette, fonts, spacing)
      : paletteToTailwind(palette, fonts, spacing);
    navigator.clipboard.writeText(text);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  const savePalette = () => {
    const { h } = hexToHsl(color);
    const name = `${HARMONY_LABELS[harmony]} · ${Math.round(h)}°`;
    const entry: SavedPalette = {
      id: Date.now().toString(),
      name,
      color,
      harmony,
      palette,
    };
    const next = [entry, ...saved].slice(0, 8);
    setSaved(next);
    localStorage.setItem("chromaforge-saved", JSON.stringify(next));
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter(s => s.id !== id);
    setSaved(next);
    localStorage.setItem("chromaforge-saved", JSON.stringify(next));
  };

  const loadSaved = (s: SavedPalette) => {
    setColor(s.color);
    setHarmony(s.harmony);
    setPalette(s.palette);
  };

  const randomColor = () => {
    const { h, s, l } = hexToHsl(color);
    const newH = (h + 47 + Math.random() * 60) % 360;
    const hex = hslToHex(newH, 60 + Math.random() * 30, 35 + Math.random() * 20);
    updateColor(hex);
  };

  const sp = generateSpacingScale(spacing);
  const swatches = [
    { key: "primary", label: "Primary", hex: palette.primary },
    { key: "accent", label: "Accent", hex: palette.accent },
    { key: "support", label: "Support", hex: palette.support },
    { key: "background", label: "Background", hex: palette.background },
    { key: "surface", label: "Surface", hex: palette.surface },
    { key: "text", label: "Text", hex: palette.text },
    { key: "muted", label: "Muted", hex: palette.muted },
  ];

  const exportText = exportMode === "css"
    ? paletteToCssVars(palette, fonts, spacing)
    : paletteToTailwind(palette, fonts, spacing);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-body"
      style={{ background: "#060810", color: "#e8e8e8" }}>

      {/* TOPBAR */}
      <header className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "#21262d", background: "#0d1117" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: palette.primary }}>
            <Droplets size={14} color="#fff" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight"
            style={{ color: "#fbbf24" }}>
            ChromaForge
          </span>
          <span className="text-xs px-2 py-0.5 rounded font-mono"
            style={{ background: "#21262d", color: "#8b949e" }}>
            v1.0
          </span>
        </div>

        {/* TABS */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#161b22" }}>
          {(["colors", "typography", "spacing"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="tab-btn px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
              style={{
                background: tab === t ? palette.primary : "transparent",
                color: tab === t ? "#fff" : "#8b949e",
              }}>
              {t === "colors" && <span className="flex items-center gap-1.5"><Palette size={13} />{t}</span>}
              {t === "typography" && <span className="flex items-center gap-1.5"><Type size={13} />{t}</span>}
              {t === "spacing" && <span className="flex items-center gap-1.5"><Maximize2 size={13} />{t}</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={savePalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "#21262d", color: "#e8e8e8" }}>
            <Save size={13} /> Save
          </button>
        </div>
      </header>

      {/* MAIN 3-PANEL LAYOUT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: INPUT PANEL */}
        <div className="w-72 flex flex-col border-r overflow-y-auto"
          style={{ borderColor: "#21262d", background: "#0d1117" }}>
          <div className="p-4 flex flex-col gap-5">

            <AnimatePresence mode="wait">
              {tab === "colors" && (
                <motion.div key="colors"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4">

                  {/* Color Picker */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Base Color</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <input type="color" value={color}
                          onChange={e => updateColor(e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0.5"
                          style={{ background: "#161b22", border: "2px solid #21262d" }} />
                      </div>
                      <div className="flex-1">
                        <input type="text" value={color}
                          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) updateColor(e.target.value); }}
                          className="w-full px-3 py-2 rounded-lg font-mono text-sm"
                          style={{ background: "#161b22", border: "1px solid #21262d", color: "#e8e8e8" }} />
                        <div className="text-xs mt-1 font-mono" style={{ color: "#8b949e" }}>
                          {(() => { const { h, s, l } = hexToHsl(color); return `H:${Math.round(h)}° S:${Math.round(s)}% L:${Math.round(l)}%`; })()}
                        </div>
                      </div>
                      <button onClick={randomColor}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: "#161b22", border: "1px solid #21262d" }}
                        title="Random color">
                        <RefreshCw size={15} color="#8b949e" />
                      </button>
                    </div>
                  </div>

                  {/* Harmony */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Harmony Mode</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(HARMONY_LABELS) as Harmony[]).map(h => (
                        <button key={h} onClick={() => updateHarmony(h)}
                          className="py-2 px-2 rounded-lg text-xs font-medium transition-all text-left"
                          style={{
                            background: harmony === h ? palette.primary + "22" : "#161b22",
                            border: `1px solid ${harmony === h ? palette.primary : "#21262d"}`,
                            color: harmony === h ? palette.primary : "#8b949e",
                          }}>
                          {HARMONY_LABELS[h]}
                        </button>
                      ))}
                    </div>
                    {harmony === "golden" && (
                      <p className="text-xs mt-2 font-mono" style={{ color: "#8b949e" }}>
                        Accent = H + 137.5° (φ)
                      </p>
                    )}
                  </div>

                  {/* Saved Palettes */}
                  {saved.length > 0 && (
                    <div>
                      <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                        style={{ color: "#8b949e" }}>Saved Palettes</label>
                      <div className="flex flex-col gap-1.5">
                        {saved.map(s => (
                          <div key={s.id}
                            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-all"
                            style={{ background: "#161b22", border: "1px solid #21262d" }}
                            onClick={() => loadSaved(s)}>
                            <div className="flex gap-0.5 flex-shrink-0">
                              {[s.palette.primary, s.palette.accent, s.palette.support].map((c, i) => (
                                <div key={i} className="w-4 h-4 rounded-sm" style={{ background: c }} />
                              ))}
                            </div>
                            <span className="text-xs flex-1 truncate" style={{ color: "#8b949e" }}>{s.name}</span>
                            <button onClick={e => { e.stopPropagation(); deleteSaved(s.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={11} color="#ef4444" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "typography" && (
                <motion.div key="typography"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4">

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Display Font</label>
                    <div className="flex flex-col gap-1">
                      {GOOGLE_FONTS_DISPLAY.map(f => (
                        <button key={f} onClick={() => { loadFont(f); setFonts(p => ({ ...p, display: f })); }}
                          className="px-3 py-2 rounded-lg text-sm text-left transition-all"
                          style={{
                            fontFamily: `'${f}', serif`,
                            background: fonts.display === f ? palette.primary + "22" : "#161b22",
                            border: `1px solid ${fonts.display === f ? palette.primary : "#21262d"}`,
                            color: fonts.display === f ? palette.primary : "#e8e8e8",
                          }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Body Font</label>
                    <div className="flex flex-col gap-1">
                      {GOOGLE_FONTS_BODY.map(f => (
                        <button key={f} onClick={() => { loadFont(f); setFonts(p => ({ ...p, body: f })); }}
                          className="px-3 py-2 rounded-lg text-sm text-left transition-all"
                          style={{
                            fontFamily: `'${f}', sans-serif`,
                            background: fonts.body === f ? palette.primary + "22" : "#161b22",
                            border: `1px solid ${fonts.body === f ? palette.primary : "#21262d"}`,
                            color: fonts.body === f ? palette.primary : "#e8e8e8",
                          }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Base Font Size: {fonts.baseSize}px</label>
                    <input type="range" min={12} max={20} value={fonts.baseSize}
                      onChange={e => setFonts(p => ({ ...p, baseSize: Number(e.target.value) }))}
                      className="w-full" />
                  </div>
                </motion.div>
              )}

              {tab === "spacing" && (
                <motion.div key="spacing"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4">

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Base Unit</label>
                    <div className="flex gap-2">
                      {[4, 8, 16].map(u => (
                        <button key={u} onClick={() => setSpacing(u)}
                          className="flex-1 py-2 rounded-lg text-sm font-mono font-medium transition-all"
                          style={{
                            background: spacing === u ? palette.primary + "22" : "#161b22",
                            border: `1px solid ${spacing === u ? palette.primary : "#21262d"}`,
                            color: spacing === u ? palette.primary : "#8b949e",
                          }}>
                          {u}px
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Spacing Scale</label>
                    <div className="flex flex-col gap-2">
                      {Object.entries(sp).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs font-mono w-8" style={{ color: "#8b949e" }}>{key}</span>
                          <div className="rounded-sm" style={{
                            width: `${Math.min(val * 2, 160)}px`, height: "8px",
                            background: palette.primary + "66",
                          }} />
                          <span className="text-xs font-mono" style={{ color: "#8b949e" }}>{val}px</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest mb-2 block"
                      style={{ color: "#8b949e" }}>Border Radius</label>
                    <div className="flex gap-2">
                      {["sm", "md", "lg"].map((r, i) => {
                        const radii = [spacing * 0.5, spacing, spacing * 2];
                        return (
                          <div key={r} className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10" style={{
                              background: palette.primary + "33",
                              border: `2px solid ${palette.primary}`,
                              borderRadius: `${radii[i]}px`,
                            }} />
                            <span className="text-xs font-mono" style={{ color: "#8b949e" }}>{r}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CENTER: LIVE PREVIEW */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6"
            style={{ background: palette.background }}>
            
            {/* Preview label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: palette.surface, color: palette.muted, border: `1px solid ${palette.muted}33` }}>
                Live Preview
              </span>
              <span className="text-xs font-mono" style={{ color: palette.muted }}>
                {palette.background}
              </span>
            </div>

            {/* HERO CARD */}
            <div className="rounded-xl p-6 mb-4"
              style={{ background: palette.surface, border: `1px solid ${palette.primary}22` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest mb-1"
                    style={{ color: palette.accent, fontFamily: `'JetBrains Mono', monospace` }}>
                    Design System
                  </p>
                  <h1 style={{
                    fontFamily: `'${fonts.display}', serif`,
                    fontSize: `${fonts.baseSize * 2.2}px`,
                    color: palette.text,
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}>
                    ChromaForge
                  </h1>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: palette.primary }}>
                  <Droplets size={18} color="#fff" />
                </div>
              </div>
              <p style={{
                fontFamily: `'${fonts.body}', sans-serif`,
                fontSize: `${fonts.baseSize}px`,
                color: palette.muted,
                lineHeight: 1.6,
                marginBottom: `${spacing * 2}px`,
              }}>
                Build complete design systems from a single color. Every decision — colors, type, spacing — generated and ready to ship.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: palette.primary, color: "#fff",
                    fontFamily: `'${fonts.body}', sans-serif`,
                    fontSize: `${fonts.baseSize * 0.875}px`,
                    borderRadius: `${spacing}px`,
                  }}>
                  Get Started →
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: "transparent",
                    border: `1px solid ${palette.primary}55`,
                    color: palette.primary,
                    fontFamily: `'${fonts.body}', sans-serif`,
                    fontSize: `${fonts.baseSize * 0.875}px`,
                    borderRadius: `${spacing}px`,
                  }}>
                  View Docs
                </button>
                <span className="px-3 py-2 rounded-full text-xs font-mono"
                  style={{ background: palette.accent + "22", color: palette.accent }}>
                  Golden Ratio ✦
                </span>
              </div>
            </div>

            {/* TYPOGRAPHY PREVIEW */}
            <div className="rounded-xl p-5 mb-4"
              style={{ background: palette.surface, border: `1px solid ${palette.muted}22` }}>
              <p className="text-xs font-mono uppercase tracking-widest mb-3"
                style={{ color: palette.muted }}>Typography</p>
              <div style={{ fontFamily: `'${fonts.display}', serif`, color: palette.text }}>
                <p style={{ fontSize: `${fonts.baseSize * 2.5}px`, fontWeight: 300, lineHeight: 1 }}>Display</p>
                <p style={{ fontSize: `${fonts.baseSize * 1.5}px`, fontWeight: 600 }}>Heading Level</p>
              </div>
              <p style={{
                fontFamily: `'${fonts.body}', sans-serif`,
                fontSize: `${fonts.baseSize}px`,
                color: palette.muted, lineHeight: 1.7, marginTop: `${spacing}px`
              }}>
                Body text flows here. The quick brown fox jumps over the lazy dog. Typography is the backbone of every design system.
              </p>
              <p style={{
                fontFamily: `'JetBrains Mono', monospace`,
                fontSize: `${fonts.baseSize * 0.8}px`,
                color: palette.accent, marginTop: `${spacing}px`
              }}>
                const theme = ChromaForge.generate('{color}');
              </p>
            </div>

            {/* COMPONENT SAMPLES */}
            <div className="grid grid-cols-2 gap-3">
              {/* Badge + stat card */}
              <div className="rounded-xl p-4"
                style={{ background: palette.surface, border: `1px solid ${palette.support}33` }}>
                <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: palette.muted }}>Components</p>
                <div className="flex gap-1 flex-wrap mb-3">
                  {["Primary", "Accent", "Muted"].map((label, i) => {
                    const colors = [palette.primary, palette.accent, palette.muted];
                    return (
                      <span key={label} className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: colors[i] + "22", color: colors[i], fontFamily: `'${fonts.body}', sans-serif` }}>
                        {label}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-1">
                  {["Design Token", "Color Theory", "Type Scale"].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                      style={{ background: palette.background }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: [palette.primary, palette.accent, palette.support][i] }} />
                      <span style={{ fontSize: `${fonts.baseSize * 0.8}px`, color: palette.text, fontFamily: `'${fonts.body}', sans-serif` }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="rounded-xl p-4"
                style={{ background: palette.surface, border: `1px solid ${palette.accent}33` }}>
                <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: palette.muted }}>Metrics</p>
                {[
                  { label: "Colors", val: "7", accent: palette.primary },
                  { label: "Fonts", val: "2", accent: palette.accent },
                  { label: "Tokens", val: "24+", accent: palette.support },
                ].map(({ label, val, accent }) => (
                  <div key={label} className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: `${fonts.baseSize * 0.875}px`, color: palette.muted, fontFamily: `'${fonts.body}', sans-serif` }}>{label}</span>
                    <span style={{ fontSize: `${fonts.baseSize * 1.1}px`, fontWeight: 700, color: accent, fontFamily: `'JetBrains Mono', monospace` }}>{val}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${palette.muted}22` }}>
                  <div className="flex gap-1">
                    {[palette.primary, palette.accent, palette.support, palette.muted].map((c, i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: EXPORT + SWATCHES */}
        <div className="w-72 flex flex-col border-l overflow-hidden"
          style={{ borderColor: "#21262d", background: "#0d1117" }}>

          {/* COLOR SWATCHES */}
          <div className="p-4 border-b" style={{ borderColor: "#21262d" }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#8b949e" }}>
              Palette · {HARMONY_LABELS[harmony]}
            </p>
            <div className="flex flex-col gap-1.5">
              {swatches.map(({ key, label, hex }) => (
                <button key={key} onClick={() => copyColor(hex, key)}
                  className="swatch flex items-center gap-2.5 p-2 rounded-lg w-full group transition-all"
                  style={{ background: "#161b22", border: "1px solid #21262d" }}>
                  <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ background: hex }} />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium" style={{ color: "#e8e8e8" }}>{label}</p>
                    <p className="text-xs font-mono" style={{ color: "#8b949e" }}>{hex.toUpperCase()}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied === key ? <Check size={13} color="#22c55e" /> : <Copy size={13} color="#8b949e" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* EXPORT PANEL */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#8b949e" }}>Export</p>
              <div className="flex gap-1 p-0.5 rounded-md" style={{ background: "#161b22" }}>
                {(["css", "tailwind"] as ExportMode[]).map(m => (
                  <button key={m} onClick={() => setExportMode(m)}
                    className="px-2 py-0.5 rounded text-xs font-mono transition-all"
                    style={{
                      background: exportMode === m ? palette.primary : "transparent",
                      color: exportMode === m ? "#fff" : "#8b949e",
                    }}>
                    {m === "css" ? "CSS" : "TW"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg p-3 font-mono text-xs leading-relaxed mb-3"
              style={{ background: "#161b22", color: "#8b949e", border: "1px solid #21262d" }}>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{exportText}</pre>
            </div>

            <button onClick={copyExport}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: exportCopied ? "#22c55e" : palette.primary, color: "#fff" }}>
              {exportCopied ? <><Check size={14} /> Copied!</> : <><Download size={14} /> Copy {exportMode === "css" ? "CSS Vars" : "Tailwind Config"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
