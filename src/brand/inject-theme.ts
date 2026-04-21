// src/brand/inject-theme.ts
import type { BrandColors, BrandFonts } from './types';

export function injectThemeFonts(fonts: BrandFonts) {
  const root = document.documentElement;
  root.style.setProperty('--font-body', fonts.body);
  root.style.setProperty('--font-display', fonts.display);
  root.style.setProperty('--font-accent', fonts.accent);
}

export function injectThemeColors(colors: BrandColors) {
  const root = document.documentElement;
  root.style.setProperty('--bg', colors.bg);
  root.style.setProperty('--surface', colors.surface);
  root.style.setProperty('--beige', colors.accent);
  root.style.setProperty('--beige-soft', colors.accentSoft);
  root.style.setProperty('--taupe', colors.primary);
  root.style.setProperty('--taupe-dark', colors.accentDark);
  root.style.setProperty('--ink', colors.ink);
  root.style.setProperty('--ink-soft', colors.inkSoft);
  root.style.setProperty('--ink-mute', colors.inkMute);
  root.style.setProperty('--line', colors.line);
  root.style.setProperty('--line-soft', colors.lineSoft);
  root.style.setProperty('--sage', colors.sage);
  root.style.setProperty('--sage-bg', colors.sageBg);
  root.style.setProperty('--terracotta', colors.terracotta);
  root.style.setProperty('--terracotta-bg', colors.terracottaBg);
}
