// src/brand/theme-fit.ts
import type { BrandConfig } from './types';

import logoWhite from '../assets/fit/logo_white.png';
import logoBlack from '../assets/fit/logo_black.png';
import isoWhite from '../assets/fit/iso_white.png';
import isoBlack from '../assets/fit/iso_black.png';
import isoAccent from '../assets/fit/iso_accent.png';

const fit: BrandConfig = {
  id: 'fit',
  colors: {
    bg: '#0a0a0a',
    surface: '#1a1a1a',
    accent: '#FBFA3F',
    accentSoft: '#E8D628',
    accentDark: '#E8D628',
    primary: '#FBFA3F',
    ink: '#f5f1e8',
    inkSoft: '#c5c2ba',
    inkMute: '#8a877f',
    line: '#2a2a2a',
    lineSoft: '#222222',
    sage: '#8a9a82',
    sageBg: '#1a2418',
    terracotta: '#b87560',
    terracottaBg: '#2a1a14',
  },
  fonts: {
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Anton&family=Fraunces:ital,wght@1,400;1,600&display=swap',
    body: "'Geist', ui-sans-serif, system-ui, sans-serif",
    display: "'Anton', sans-serif",
    accent: "'Fraunces', serif",
  },
  logos: { logoWhite, logoBlack, isoWhite, isoBlack, isoAccent },
  text: {
    name: 'CLIC',
    tagline: 'fit',
    fullName: 'CLIC FIT',
    pageTitle: 'CLIC FIT',
    loginWelcome: 'Bienvenido',
    loginSubtitle: 'El lugar donde tus hábitos cambian',
    fallbackQuote: 'Tu entreno empieza acá.',
    fallbackCta: 'Consultá con tu sede',
  },
};

export default fit;
