// src/brand/types.ts

export interface BrandColors {
  bg: string;
  surface: string;
  accent: string;         // clic: beige, fit: yellow
  accentSoft: string;     // clic: beige-soft, fit: yellow-deep
  accentDark: string;     // clic: taupe-dark, fit: yellow-deep
  primary: string;        // clic: taupe, fit: yellow
  ink: string;
  inkSoft: string;
  inkMute: string;
  line: string;
  lineSoft: string;
  sage: string;
  sageBg: string;
  terracotta: string;
  terracottaBg: string;
}

export interface BrandFonts {
  /** Google Fonts URL to load */
  googleFontsUrl: string;
  /** Body / UI font */
  body: string;
  /** Display / title font */
  display: string;
  /** Accent / elegant font (used where .italiana class is now) */
  accent: string;
}

export interface BrandLogos {
  logoWhite: string;
  logoBlack: string;
  isoWhite: string;
  isoBlack: string;
  isoAccent: string; // clic: taupe, fit: yellow variant
}

export interface BrandText {
  name: string;             // "CLIC" — same for both
  tagline: string;          // "studio pilates" | "fit"
  fullName: string;         // "CLIC studio pilates" | "CLIC FIT"
  pageTitle: string;        // HTML <title>
  loginWelcome: string;     // "Bienvenida" | "Bienvenido"
  loginSubtitle: string;    // "Tu espacio de práctica" | "El lugar donde tus hábitos cambian"
  fallbackQuote: string;    // "Tu pilates empieza acá." | "Tu entreno empieza acá."
  fallbackCta: string;      // "Consultá con tu sede"
}

export interface BrandConfig {
  id: 'clic' | 'fit';
  colors: BrandColors;
  fonts: BrandFonts;
  logos: BrandLogos;
  text: BrandText;
}
