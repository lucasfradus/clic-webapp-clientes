// src/brand/context.tsx
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { BrandConfig } from './types';
import clic from './theme-clic';
import fit from './theme-fit';
import { injectThemeColors, injectThemeFonts } from './inject-theme';

const themes: Record<string, BrandConfig> = { clic, fit };
const brandId = (import.meta.env.VITE_BRAND as string) || 'clic';
const activeBrand = themes[brandId] ?? clic;

const BrandContext = createContext<BrandConfig>(activeBrand);

export function BrandProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Inject CSS color and font variables
    injectThemeColors(activeBrand.colors);
    injectThemeFonts(activeBrand.fonts);

    // Brand attribute for CSS overrides
    document.documentElement.setAttribute('data-brand', activeBrand.id);

    // Inject brand fonts via dynamic <link> tag
    const existing = document.querySelector('link[data-brand-fonts]');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = activeBrand.fonts.googleFontsUrl;
    link.setAttribute('data-brand-fonts', 'true');
    document.head.appendChild(link);

    // Set body font
    document.body.style.fontFamily = activeBrand.fonts.body;

    // Set page title
    document.title = activeBrand.text.pageTitle;
  }, []);

  return (
    <BrandContext.Provider value={activeBrand}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}
