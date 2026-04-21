// src/brand/theme-clic.ts
import type { BrandConfig } from './types';

import logoWhite from '../assets/clic/logo_white.png';
import logoBlack from '../assets/clic/logo_black.png';
import isoWhite from '../assets/clic/iso_white.png';
import isoBlack from '../assets/clic/iso_black.png';
import isoAccent from '../assets/clic/iso_accent.png';

const clic: BrandConfig = {
  id: 'clic',
  colors: {
    bg: '#edece7',
    surface: '#fdfbfa',
    accent: '#dfd4ca',
    accentSoft: '#e8e0d6',
    accentDark: '#9a8a7c',
    primary: '#bcac9e',
    ink: '#2c2f34',
    inkSoft: '#5a5d62',
    inkMute: '#9a9da2',
    line: '#e0d8cd',
    lineSoft: '#ebe5db',
    sage: '#8a9a82',
    sageBg: '#e6ebe2',
    terracotta: '#b87560',
    terracottaBg: '#f0e0d8',
  },
  fonts: {
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Italiana&display=swap',
    body: "'Poppins', -apple-system, sans-serif",
    display: "'Poppins', sans-serif",
    accent: "'Poppins', sans-serif",
  },
  logos: { logoWhite, logoBlack, isoWhite, isoBlack, isoAccent },
  text: {
    name: 'CLIC',
    tagline: 'studio pilates',
    fullName: 'CLIC studio pilates',
    pageTitle: 'CLIC studio pilates',
    loginWelcome: 'Bienvenida',
    loginSubtitle: 'Tu espacio de práctica',
    fallbackQuote: 'Tu pilates empieza acá.',
    fallbackCta: 'Consultá con tu sede',
  },
};

export default clic;
