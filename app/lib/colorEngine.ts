export interface ColorPalette {
  primary: string;
  accent: string;
  support: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

export interface HSL { h: number; s: number; l: number; }

export function hexToHsl(hex: string): HSL {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return { h: 0, s: 0, l: 0 };
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max+min)/2;
  if (max !== min) {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return { h: h*360, s: s*100, l: l*100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h%360)+360)%360;
  s = Math.max(0,Math.min(100,s));
  l = Math.max(0,Math.min(100,l));
  const hn=h/360, sn=s/100, ln=l/100;
  const hue2rgb = (p:number,q:number,t:number) => {
    if(t<0)t+=1; if(t>1)t-=1;
    if(t<1/6)return p+(q-p)*6*t;
    if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;
    return p;
  };
  let r,g,b;
  if(sn===0){r=g=b=ln;}else{
    const q=ln<0.5?ln*(1+sn):ln+sn-ln*sn;
    const p=2*ln-q;
    r=hue2rgb(p,q,hn+1/3); g=hue2rgb(p,q,hn); b=hue2rgb(p,q,hn-1/3);
  }
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function buildPalette(primary: string, accentH: number, supportMod: number): ColorPalette {
  const {h,s,l} = hexToHsl(primary);
  const accent = hslToHex(h+accentH, Math.min(s*1.1,100), l);
  const support = hslToHex(h+supportMod, s*0.4, Math.min(l+22,88));
  return {
    primary,
    accent,
    support,
    background: hslToHex(h, 8, 5),
    surface: hslToHex(h, 6, 9),
    text: hslToHex(h, 5, 94),
    muted: hslToHex(h, 4, 42),
  };
}

export function generateGoldenPalette(hex: string) { return buildPalette(hex, 137.5, 60); }
export function generateComplementary(hex: string) { return buildPalette(hex, 180, 90); }
export function generateTriadic(hex: string) { return buildPalette(hex, 120, 240); }
export function generateAnalogous(hex: string) { return buildPalette(hex, 30, -30); }

export function generatePalette(hex: string, harmony: string): ColorPalette {
  switch(harmony) {
    case 'complementary': return generateComplementary(hex);
    case 'triadic': return generateTriadic(hex);
    case 'analogous': return generateAnalogous(hex);
    default: return generateGoldenPalette(hex);
  }
}

export function generateSpacingScale(base: number) {
  return { xs: base*0.5, sm: base, md: base*2, lg: base*3, xl: base*4, '2xl': base*6, '3xl': base*8 };
}

export interface FontConfig { display: string; body: string; baseSize: number; }

export function paletteToCss(p: ColorPalette, f: FontConfig, spacing: number): string {
  const sp = generateSpacingScale(spacing);
  return `:root {
  /* — Colors — */
  --color-primary:    ${p.primary};
  --color-accent:     ${p.accent};
  --color-support:    ${p.support};
  --color-bg:         ${p.background};
  --color-surface:    ${p.surface};
  --color-text:       ${p.text};
  --color-muted:      ${p.muted};

  /* — Typography — */
  --font-display: '${f.display}', sans-serif;
  --font-body:    '${f.body}', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
  --text-xs:   ${Math.round(f.baseSize*0.75)}px;
  --text-sm:   ${Math.round(f.baseSize*0.875)}px;
  --text-base: ${f.baseSize}px;
  --text-lg:   ${Math.round(f.baseSize*1.25)}px;
  --text-xl:   ${Math.round(f.baseSize*1.5)}px;
  --text-2xl:  ${Math.round(f.baseSize*2)}px;
  --text-3xl:  ${Math.round(f.baseSize*3)}px;

  /* — Spacing — */
  --space-xs:  ${sp.xs}px;
  --space-sm:  ${sp.sm}px;
  --space-md:  ${sp.md}px;
  --space-lg:  ${sp.lg}px;
  --space-xl:  ${sp.xl}px;
  --space-2xl: ${sp['2xl']}px;
  --space-3xl: ${sp['3xl']}px;
  --radius-sm: ${spacing*0.5}px;
  --radius-md: ${spacing}px;
  --radius-lg: ${spacing*2}px;
}`;
}

export function paletteToTailwind(p: ColorPalette, f: FontConfig, spacing: number): string {
  return `// tailwind.config.js
module.exports = {
  theme: { extend: {
    colors: {
      primary: '${p.primary}',
      accent:  '${p.accent}',
      support: '${p.support}',
      bg:      '${p.background}',
      surface: '${p.surface}',
      text:    '${p.text}',
      muted:   '${p.muted}',
    },
    fontFamily: {
      display: ['${f.display}', 'sans-serif'],
      body:    ['${f.body}', 'sans-serif'],
      mono:    ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      sm:   '${Math.round(f.baseSize*0.875)}px',
      base: '${f.baseSize}px',
      lg:   '${Math.round(f.baseSize*1.25)}px',
      xl:   '${Math.round(f.baseSize*1.5)}px',
      '2xl':'${Math.round(f.baseSize*2)}px',
      '3xl':'${Math.round(f.baseSize*3)}px',
    },
    spacing: {
      xs:  '${generateSpacingScale(spacing).xs}px',
      sm:  '${generateSpacingScale(spacing).sm}px',
      md:  '${generateSpacingScale(spacing).md}px',
      lg:  '${generateSpacingScale(spacing).lg}px',
      xl:  '${generateSpacingScale(spacing).xl}px',
    },
    borderRadius: {
      sm: '${spacing*0.5}px',
      md: '${spacing}px',
      lg: '${spacing*2}px',
    },
  }},
};`;
}

export const DISPLAY_FONTS = [
  'Space Grotesk','Syne','Outfit','Unbounded',
  'Fraunces','Playfair Display','Cormorant Garamond','DM Serif Display',
  'Bebas Neue','Righteous','Clash Display','Cabinet Grotesk',
];

export const BODY_FONTS = [
  'Inter','DM Sans','Plus Jakarta Sans','Manrope',
  'Nunito','Raleway','Work Sans','Karla',
  'IBM Plex Sans','Lato','Rubik','Source Sans 3',
];

export const HARMONY_OPTIONS = [
  { id: 'golden', label: 'Golden', desc: 'H + 137.5°' },
  { id: 'complementary', label: 'Complement', desc: 'H + 180°' },
  { id: 'triadic', label: 'Triadic', desc: 'H + 120°' },
  { id: 'analogous', label: 'Analogous', desc: 'H ± 30°' },
];

export const PRESET_COLORS = [
  '#008CBB','#E63946','#2D6A4F','#7209B7',
  '#F77F00','#0077B6','#C77DFF','#06D6A0',
];
