export interface ColorPalette {
  primary: string;
  accent: string;
  support: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const hn = h / 360, sn = s / 100, ln = l / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (sn === 0) { r = g = b = ln; }
  else {
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1/3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1/3);
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export function generateGoldenPalette(hex: string): ColorPalette {
  const { h, s, l } = hexToHsl(hex);
  const GOLDEN_ANGLE = 137.5;
  const accent = hslToHex(h + GOLDEN_ANGLE, s, l);
  const support = hslToHex(h, s * 0.4, Math.min(l + 20, 85));
  const isDark = l < 50;
  const background = isDark ? hslToHex(h, 15, 6) : hslToHex(h, 10, 96);
  const surface = isDark ? hslToHex(h, 12, 10) : hslToHex(h, 8, 92);
  const text = isDark ? hslToHex(h, 10, 92) : hslToHex(h, 15, 8);
  const muted = isDark ? hslToHex(h, 8, 50) : hslToHex(h, 8, 45);
  return { primary: hex, accent, support, background, surface, text, muted };
}

export function generateComplementary(hex: string): ColorPalette {
  const { h, s, l } = hexToHsl(hex);
  const accent = hslToHex(h + 180, s, l);
  const support = hslToHex(h, s * 0.4, Math.min(l + 20, 85));
  const background = hslToHex(h, 15, 6);
  const surface = hslToHex(h, 12, 10);
  const text = hslToHex(h, 10, 92);
  const muted = hslToHex(h, 8, 50);
  return { primary: hex, accent, support, background, surface, text, muted };
}

export function generateTriadic(hex: string): ColorPalette {
  const { h, s, l } = hexToHsl(hex);
  const accent = hslToHex(h + 120, s, l);
  const support = hslToHex(h + 240, s * 0.7, l);
  const background = hslToHex(h, 15, 6);
  const surface = hslToHex(h, 12, 10);
  const text = hslToHex(h, 10, 92);
  const muted = hslToHex(h, 8, 50);
  return { primary: hex, accent, support, background, surface, text, muted };
}

export function generateAnalogous(hex: string): ColorPalette {
  const { h, s, l } = hexToHsl(hex);
  const accent = hslToHex(h + 30, s, l);
  const support = hslToHex(h - 30, s * 0.8, l);
  const background = hslToHex(h, 15, 6);
  const surface = hslToHex(h, 12, 10);
  const text = hslToHex(h, 10, 92);
  const muted = hslToHex(h, 8, 50);
  return { primary: hex, accent, support, background, surface, text, muted };
}

export function generateSpacingScale(base: number) {
  return {
    xs: base * 0.5,
    sm: base,
    md: base * 2,
    lg: base * 3,
    xl: base * 4,
    '2xl': base * 6,
    '3xl': base * 8,
  };
}

export function paletteToCssVars(p: ColorPalette, fonts: FontConfig, spacing: number): string {
  const sp = generateSpacingScale(spacing);
  return `/* ChromaForge Design System */
:root {
  /* Colors */
  --color-primary: ${p.primary};
  --color-accent: ${p.accent};
  --color-support: ${p.support};
  --color-bg: ${p.background};
  --color-surface: ${p.surface};
  --color-text: ${p.text};
  --color-muted: ${p.muted};

  /* Typography */
  --font-display: '${fonts.display}', serif;
  --font-body: '${fonts.body}', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-base: ${fonts.baseSize}px;
  --font-size-sm: ${fonts.baseSize * 0.875}px;
  --font-size-lg: ${fonts.baseSize * 1.25}px;
  --font-size-xl: ${fonts.baseSize * 1.5}px;
  --font-size-2xl: ${fonts.baseSize * 2}px;
  --font-size-display: ${fonts.baseSize * 3}px;

  /* Spacing */
  --space-xs: ${sp.xs}px;
  --space-sm: ${sp.sm}px;
  --space-md: ${sp.md}px;
  --space-lg: ${sp.lg}px;
  --space-xl: ${sp.xl}px;
  --space-2xl: ${sp['2xl']}px;
  --space-3xl: ${sp['3xl']}px;
  --radius-sm: ${spacing * 0.5}px;
  --radius-md: ${spacing}px;
  --radius-lg: ${spacing * 2}px;
}`;
}

export function paletteToTailwind(p: ColorPalette, fonts: FontConfig, spacing: number): string {
  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${p.primary}',
        accent: '${p.accent}',
        support: '${p.support}',
        bg: '${p.background}',
        surface: '${p.surface}',
        text: '${p.text}',
        muted: '${p.muted}',
      },
      fontFamily: {
        display: ['${fonts.display}', 'serif'],
        body: ['${fonts.body}', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        base: '${fonts.baseSize}px',
        lg: '${fonts.baseSize * 1.25}px',
        xl: '${fonts.baseSize * 1.5}px',
        '2xl': '${fonts.baseSize * 2}px',
      },
      spacing: {
        xs: '${spacing * 0.5}px',
        sm: '${spacing}px',
        md: '${spacing * 2}px',
        lg: '${spacing * 3}px',
        xl: '${spacing * 4}px',
      },
      borderRadius: {
        sm: '${spacing * 0.5}px',
        md: '${spacing}px',
        lg: '${spacing * 2}px',
      },
    },
  },
};`;
}

export interface FontConfig {
  display: string;
  body: string;
  baseSize: number;
}

export const GOOGLE_FONTS_DISPLAY = [
  'Fraunces', 'Playfair Display', 'Cormorant Garamond', 'DM Serif Display',
  'Syne', 'Space Grotesk', 'Cabinet Grotesk', 'Clash Display',
  'Unbounded', 'Bebas Neue', 'Righteous', 'Outfit',
];

export const GOOGLE_FONTS_BODY = [
  'Inter', 'Plus Jakarta Sans', 'DM Sans', 'Nunito',
  'Manrope', 'Raleway', 'Lato', 'Source Sans 3',
  'IBM Plex Sans', 'Karla', 'Rubik', 'Work Sans',
];
