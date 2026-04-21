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
    bg: '#f8f7f4',
    surface: '#ffffff',
    accent: '#FBDC32',
    accentSoft: '#F5D020',
    accentDark: '#D4A800',
    primary: '#FBDC32',
    ink: '#1f1f1f',
    inkSoft: '#787870',
    inkMute: '#a0a09a',
    line: '#e8e5de',
    lineSoft: '#f0ede6',
    sage: '#8a9a82',
    sageBg: '#e6ebe2',
    terracotta: '#b87560',
    terracottaBg: '#f0e0d8',
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
