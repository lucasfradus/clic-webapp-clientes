# Multi-Brand Theming System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable a single codebase to serve both CLIC Pilates (clientes.clicpilates.com) and CLIC FIT (clientes.clicfit.ar) with distinct branding, controlled by `VITE_BRAND` env variable at build time.

**Architecture:** A `BrandConfig` type defines all brand-specific values (colors, fonts, logos, text, taglines). Two theme files provide the concrete values. A `BrandProvider` React context injects the active config. CSS variables are set dynamically at mount. All components read brand values from context instead of hardcoded imports/strings.

**Tech Stack:** React 18, TypeScript, Vite (env vars), CSS custom properties, React Context

---

## File Structure

```
src/
├── brand/
│   ├── types.ts           — BrandConfig interface
│   ├── theme-clic.ts      — CLIC Pilates theme (current brand)
│   ├── theme-fit.ts       — CLIC FIT theme
│   ├── context.tsx         — BrandProvider + useBrand hook
│   └── inject-theme.ts    — Sets CSS variables on :root from config
├── assets/
│   ├── clic/              — CLIC Pilates assets (move existing)
│   │   ├── logo_white.png
│   │   ├── logo_black.png
│   │   ├── iso_white.png
│   │   ├── iso_black.png
│   │   └── iso_accent.png
│   └── fit/               — CLIC FIT assets (new)
│       ├── logo_white.png
│       ├── logo_black.png
│       ├── iso_white.png
│       ├── iso_black.png
│       └── iso_accent.png
```

**Modified files:**
- `index.html` — dynamic font loading via brand config
- `src/main.tsx` — wrap app in BrandProvider
- `src/styles/globals.css` — remove hardcoded color variables (injected by JS)
- `src/components/layout/Sidebar.tsx` — use brand context for logo + tagline
- `src/components/layout/MobileHeader.tsx` — use brand context for logo
- `src/components/brand/Watermark.tsx` — use brand context for isotipo
- `src/pages/Login.tsx` — use brand context for logo, tagline, welcome text
- `src/pages/Home.tsx` — use brand context for isotipo + fallback quote
- `src/pages/Perfil.tsx` — use brand context for brand label
- `src/api/client.ts` — brand-aware token key
- `vite.config.ts` — env-driven API proxy target + allowed hosts
- `.env` / `.env.example` — add VITE_BRAND

---

## Task 1: Define BrandConfig type

**Files:**
- Create: `src/brand/types.ts`

- [ ] **Step 1: Create the BrandConfig interface**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/brand/types.ts
git commit -m "feat: add BrandConfig type for multi-brand theming"
```

---

## Task 2: Create CLIC Pilates theme (current brand)

**Files:**
- Create: `src/brand/theme-clic.ts`

- [ ] **Step 1: Move existing assets to brand subfolder**

```bash
mkdir -p src/assets/clic src/assets/fit
cp src/assets/clic_logo_white_transparent.png src/assets/clic/logo_white.png
cp src/assets/clic_logo_black_transparent.png src/assets/clic/logo_black.png
cp src/assets/clic_iso_white_transparent.png src/assets/clic/iso_white.png
cp src/assets/clic_iso_black_transparent.png src/assets/clic/iso_black.png
cp src/assets/clic_iso_taupe_transparent.png src/assets/clic/iso_accent.png
```

- [ ] **Step 2: Create the CLIC theme file**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/clic/ src/brand/theme-clic.ts
git commit -m "feat: create CLIC Pilates theme config with reorganized assets"
```

---

## Task 3: Create CLIC FIT theme

**Files:**
- Create: `src/brand/theme-fit.ts`

- [ ] **Step 1: Add CLIC FIT logo assets**

Download the CLIC FIT logo from `https://clicfit.ar/wp-content/uploads/2024/06/Logo-Clic-blanco_Mesa-de-trabajo-1.png` and save as `src/assets/fit/logo_white.png`. Create other variants or use placeholders for now. At minimum, `logo_white.png` and `logo_black.png` are needed.

For isotipo assets, if CLIC FIT uses the same "C" isotipo, copy from the clic folder. If it has its own, add the custom files.

```bash
# Placeholder: copy clic assets as starting point for fit
cp src/assets/clic/iso_white.png src/assets/fit/iso_white.png
cp src/assets/clic/iso_black.png src/assets/fit/iso_black.png
cp src/assets/clic/iso_accent.png src/assets/fit/iso_accent.png
```

- [ ] **Step 2: Create the FIT theme file**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/fit/ src/brand/theme-fit.ts
git commit -m "feat: create CLIC FIT theme config with dark/yellow palette"
```

---

## Task 4: Create brand context + CSS injection

**Files:**
- Create: `src/brand/inject-theme.ts`
- Create: `src/brand/context.tsx`

- [ ] **Step 1: Create the CSS variable injector**

```typescript
// src/brand/inject-theme.ts
import type { BrandColors } from './types';

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
```

- [ ] **Step 2: Create the BrandProvider and useBrand hook**

```typescript
// src/brand/context.tsx
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { BrandConfig } from './types';
import clic from './theme-clic';
import fit from './theme-fit';
import { injectThemeColors } from './inject-theme';

const themes: Record<string, BrandConfig> = { clic, fit };
const brandId = (import.meta.env.VITE_BRAND as string) || 'clic';
const activeBrand = themes[brandId] ?? clic;

const BrandContext = createContext<BrandConfig>(activeBrand);

export function BrandProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Inject CSS variables
    injectThemeColors(activeBrand.colors);

    // Inject font
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
```

- [ ] **Step 3: Commit**

```bash
git add src/brand/inject-theme.ts src/brand/context.tsx
git commit -m "feat: add BrandProvider context with CSS variable injection"
```

---

## Task 5: Wire BrandProvider into the app

**Files:**
- Modify: `src/main.tsx`
- Modify: `index.html`
- Modify: `src/styles/globals.css`
- Modify: `.env` / `.env.example`

- [ ] **Step 1: Add VITE_BRAND to env files**

Add to `.env`:
```
VITE_BRAND=clic
```

Add to `.env.example`:
```
VITE_BRAND=clic
```

- [ ] **Step 2: Add VITE_BRAND type to vite-env.d.ts**

In `src/vite-env.d.ts`, add the env type:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BRAND: 'clic' | 'fit';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 3: Remove hardcoded fonts from index.html**

The BrandProvider will inject fonts dynamically. Remove the Google Fonts `<link>` tags from `index.html`. Keep preconnect for performance:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cargando…</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Remove hardcoded :root color variables from globals.css**

Remove the `:root` color block (lines 1-20 of globals.css). Colors are now injected by `inject-theme.ts`. Keep the `:root` selector but remove color definitions. The rest of globals.css stays as-is since it references `var(--ink)` etc. which will still work.

Replace lines 1-20 with just:

```css
/* Brand colors injected via JS — see src/brand/inject-theme.ts */
```

Also update the hardcoded font references in globals.css. Replace `'Poppins'` with `inherit` or `var(--font-body)` — but since we set `font-family` on `body` via JS, we can just use `inherit`:

- Line 35: `font-family: 'Poppins', -apple-system, sans-serif;` → remove (set by BrandProvider)
- Line 67: `.page-title` font-family → remove (inherits from body)
- Line 76: `.italiana` font-family → remove (will be set by components)

- [ ] **Step 5: Wrap app in BrandProvider in main.tsx**

Add `<BrandProvider>` as the outermost wrapper in main.tsx, around the existing `<BrowserRouter>`:

```typescript
import { BrandProvider } from './brand/context';

// In the render:
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BrandProvider>
  </StrictMode>
);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add .env .env.example src/vite-env.d.ts index.html src/styles/globals.css src/main.tsx
git commit -m "feat: wire BrandProvider into app, remove hardcoded brand values from globals"
```

---

## Task 6: Refactor components to use brand context

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MobileHeader.tsx`
- Modify: `src/components/brand/Watermark.tsx`

- [ ] **Step 1: Refactor Sidebar.tsx**

Replace hardcoded logo import and "studio pilates" text with brand context:

```typescript
import { NavLink } from 'react-router-dom';
import { useBrand } from '../../brand/context';
import { useAuth } from '../../store/auth';
import './Sidebar.css';

// ... navItems stays the same ...

export default function Sidebar() {
  const brand = useBrand();
  const perfil = useAuth((s) => s.perfil);
  // ... rest stays same ...

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={brand.logos.logoWhite} alt={brand.text.name} className="sidebar-logo" />
        <span className="sidebar-tagline italiana">{brand.text.tagline}</span>
      </div>
      {/* rest unchanged */}
    </aside>
  );
}
```

- [ ] **Step 2: Refactor MobileHeader.tsx**

```typescript
import { useBrand } from '../../brand/context';
import { useAuth } from '../../store/auth';

export default function MobileHeader() {
  const brand = useBrand();
  const perfil = useAuth((s) => s.perfil);
  const initial = (perfil?.nombre ?? '?').charAt(0).toUpperCase();

  return (
    <header className="mobile-header">
      <img src={brand.logos.logoBlack} alt={brand.text.name} className="mobile-header-logo" />
      <div className="mobile-header-avatar">{initial}</div>
    </header>
  );
}
```

- [ ] **Step 3: Refactor Watermark.tsx**

Replace hardcoded isotipo imports with brand context:

```typescript
import { useBrand } from '../../brand/context';

type Color = 'white' | 'black' | 'accent';

interface Props {
  color?: Color;
  size?: number;
  opacity?: number;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
  inline?: boolean;
}

export default function Watermark({
  color = 'white',
  size = 180,
  opacity = 0.07,
  position = { bottom: -24, right: -24 },
  inline = false,
}: Props) {
  const brand = useBrand();
  const srcMap: Record<Color, string> = {
    white: brand.logos.isoWhite,
    black: brand.logos.isoBlack,
    accent: brand.logos.isoAccent,
  };

  if (inline) {
    return (
      <img
        src={srcMap[color]}
        alt=""
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }
  return (
    <img
      src={srcMap[color]}
      alt=""
      style={{
        position: 'absolute',
        width: size,
        height: size,
        objectFit: 'contain',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
        ...position,
      }}
    />
  );
}
```

**Note:** The `Color` type changes from `'taupe'` to `'accent'` (semantic name). Update all call sites:
- `Home.tsx` line 204: `color="taupe"` → `color="accent"`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/MobileHeader.tsx src/components/brand/Watermark.tsx
git commit -m "refactor: Sidebar, MobileHeader, Watermark use brand context"
```

---

## Task 7: Refactor pages to use brand context

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Perfil.tsx`

- [ ] **Step 1: Refactor Login.tsx**

Replace hardcoded logo, tagline, welcome text, and subtitle:

```typescript
import { useBrand } from '../brand/context';

export default function Login() {
  const brand = useBrand();
  // ... existing state/logic ...

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={brand.logos.logoBlack} alt={brand.text.name} className="login-logo" />
        <div className="italiana login-tagline">{brand.text.tagline}</div>

        <h1 className="page-title login-title">{brand.text.loginWelcome}</h1>
        <div className="tag-label">{brand.text.loginSubtitle}</div>

        {/* form unchanged */}
      </div>
    </div>
  );
}
```

Remove the `import logoBlack from '../assets/clic_logo_black_transparent.png';` line.

- [ ] **Step 2: Refactor Home.tsx**

Replace hardcoded isotipo import and fallback quote:

```typescript
import { useBrand } from '../brand/context';

export default function Home() {
  const brand = useBrand();
  // ... existing state/logic ...

  return (
    <div className="page home">
      <header className="home-head">
        <div>
          <div className="tag-label">{greeting()}</div>
          <h1 className="page-title">
            <img src={brand.logos.isoBlack} alt="" className="home-iso" />
            {perfil?.nombre ?? ''}
          </h1>
        </div>
        {/* ... */}
      </header>

      {/* ... existing sections ... */}

      {/* Fallback quote — update text */}
      {!loading && !active && !fallback && reservas.length === 0 && (
        <div className="card home-quote">
          <Watermark color="accent" size={32} inline />
          <div>
            <div className="italiana home-quote-text">{brand.text.fallbackQuote}</div>
            <div className="tag-label">{brand.text.fallbackCta}</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

Remove the `import isoBlack from '../assets/clic_iso_black_transparent.png';` line.

- [ ] **Step 3: Refactor Perfil.tsx**

Replace the brand label at line 125:

```typescript
import { useBrand } from '../brand/context';

export default function Perfil() {
  const brand = useBrand();
  // ... existing logic ...

  // In JSX, replace the brand footer:
  <div className="perfil-brand">
    <img src={brand.logos.isoAccent} alt="" className="perfil-brand-iso" />
    <span className="tag-label">{brand.text.fullName}</span>
  </div>
}
```

Remove the `import isoTaupe from '../assets/clic_iso_taupe_transparent.png';` line.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.tsx src/pages/Home.tsx src/pages/Perfil.tsx
git commit -m "refactor: Login, Home, Perfil pages use brand context"
```

---

## Task 8: Brand-aware token key and Vite config

**Files:**
- Modify: `src/api/client.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Make token key brand-aware in client.ts**

Change line 2 of `src/api/client.ts`:

```typescript
const brandId = import.meta.env.VITE_BRAND || 'clic';
const TOKEN_KEY = `${brandId}_token`;
```

This prevents token collisions if someone is testing both apps on localhost.

- [ ] **Step 2: Update vite.config.ts for brand-aware proxy**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const brand = process.env.VITE_BRAND || 'clic';

const apiTargets: Record<string, string> = {
  clic: 'https://app.clicpilates.com',
  fit: 'https://app.clicfit.ar',  // Update when the FIT API domain is known
};

const allowedHosts: Record<string, string[]> = {
  clic: ['.up.railway.app', 'clientes.clicpilates.com'],
  fit: ['.up.railway.app', 'clientes.clicfit.ar'],
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTargets[brand] ?? apiTargets.clic,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    allowedHosts: allowedHosts[brand] ?? allowedHosts.clic,
  },
});
```

**Note:** The API target for FIT might be the same backend (`app.clicpilates.com`) or a different domain. Adjust `apiTargets.fit` when the backend URL for FIT is confirmed.

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts vite.config.ts
git commit -m "feat: brand-aware token key and Vite proxy config"
```

---

## Task 9: Handle font styling for .italiana class and display fonts

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Update .italiana and .page-title to use CSS custom properties**

In `inject-theme.ts`, add font injection:

```typescript
// Add to injectThemeColors (rename to injectTheme) or create separate function:
export function injectThemeFonts(fonts: BrandFonts) {
  const root = document.documentElement;
  root.style.setProperty('--font-body', fonts.body);
  root.style.setProperty('--font-display', fonts.display);
  root.style.setProperty('--font-accent', fonts.accent);
}
```

Update `context.tsx` to call it:

```typescript
import { injectThemeColors, injectThemeFonts } from './inject-theme';

// In useEffect:
injectThemeColors(activeBrand.colors);
injectThemeFonts(activeBrand.fonts);
```

Then in `globals.css`, update font references:

```css
body {
  font-family: var(--font-body, 'Poppins', sans-serif);
  /* ... rest unchanged ... */
}

.page-title {
  font-family: var(--font-display, sans-serif);
  /* ... rest unchanged ... */
}

.italiana {
  font-family: var(--font-accent, sans-serif);
  font-weight: 300;
  letter-spacing: -0.2px;
}

.mobile-header-avatar {
  /* ... */
  font-family: var(--font-accent, serif);
  /* ... */
}
```

- [ ] **Step 2: Commit**

```bash
git add src/brand/inject-theme.ts src/brand/context.tsx src/styles/globals.css
git commit -m "feat: inject brand fonts via CSS custom properties"
```

---

## Task 10: Clean up old asset imports and verify

**Files:**
- Various files that may still import from old asset paths

- [ ] **Step 1: Search for any remaining old asset imports**

```bash
grep -r "assets/clic_" src/ --include="*.ts" --include="*.tsx"
```

Remove any found. All components should now get assets from `useBrand()`.

- [ ] **Step 2: Optionally remove old root-level assets**

Once confirmed nothing imports them:

```bash
rm src/assets/clic_logo_white_transparent.png
rm src/assets/clic_logo_black_transparent.png
rm src/assets/clic_iso_white_transparent.png
rm src/assets/clic_iso_black_transparent.png
rm src/assets/clic_iso_taupe_transparent.png
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Test with VITE_BRAND=clic (should look identical to current app)**

```bash
VITE_BRAND=clic npm run dev
```

Open in browser — everything should look identical to the current app.

- [ ] **Step 5: Test with VITE_BRAND=fit (dark theme)**

```bash
VITE_BRAND=fit npm run dev
```

Open in browser — should see dark background, yellow accents, Anton/Geist/Fraunces fonts.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove old asset imports, verify both themes work"
```

---

## Task 11: CSS adjustments for dark theme compatibility

**Files:**
- Modify: various CSS files where hardcoded colors may break on dark theme

- [ ] **Step 1: Audit and fix hardcoded color values in CSS**

Search for hardcoded colors that won't adapt to the dark theme:

```bash
grep -rn "rgba(253,251,250" src/ --include="*.css" --include="*.tsx"
grep -rn "#fdfbfa\|#edece7\|#2c2f34\|#dfd4ca\|#bcac9e" src/ --include="*.css"
```

Common fixes:
- `Sidebar.css`: rgba values like `rgba(253,251,250,0.07)` — these are `--surface` at various opacities. For FIT theme (where surface is dark), these may need to use `var(--surface)` or remain as-is since they're relative to the sidebar's dark background.
- `card-dark::before` gradient: uses `rgba(188,172,158,0.2)` which is the taupe glow. Replace with CSS variable or keep as brand-specific via a `--glow` variable.

For each hardcoded RGBA that references a brand color, either:
1. Add a CSS variable for it, or
2. If it's already on a dark surface (like sidebar or card-dark), it may be fine

- [ ] **Step 2: Add CSS class for brand-specific display font weight**

Anton (FIT) is weight 400, all-uppercase. Poppins (CLIC) is weight 300, mixed case. The `.italiana` class needs brand-specific styling:

Add to `inject-theme.ts`:
```typescript
// Add a data attribute for brand-specific CSS
document.documentElement.setAttribute('data-brand', config.id);
```

Then in `globals.css`:
```css
[data-brand="fit"] .italiana {
  text-transform: uppercase;
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css src/brand/inject-theme.ts
git commit -m "fix: CSS adjustments for dark theme compatibility"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `VITE_BRAND=clic npm run dev` — app looks identical to before
- [ ] `VITE_BRAND=fit npm run dev` — dark theme with yellow accents, different fonts
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] No remaining imports from `src/assets/clic_*` root paths
- [ ] Login, Home, Agenda, Cuenta, Perfil, Novedades all render correctly on both themes
- [ ] Mobile view (< 768px) works on both themes
- [ ] Watermarks render with correct brand isotipo
- [ ] Brand tagline shows correctly in Sidebar and Login
