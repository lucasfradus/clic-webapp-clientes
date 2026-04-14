CLIC Studio Pilates — Web App
Objetivo
Crear una SPA (Single Page Application) con React + Vite + TypeScript que funcione como versión web de la app mobile de CLIC Studio Pilates. Esta web es un fallback para cuando la app nativa no funcione. Consume la misma API REST que la app React Native.
Stack

React 18+ con TypeScript
Vite como bundler
React Router v6 para navegación
CSS Modules o CSS vanilla con variables (sin Tailwind, sin MUI — el diseño es custom)
Fetch nativo o axios para API calls
Google Fonts: Poppins + Italiana

Setup inicial
bashnpm create vite@latest clic-web -- --template react-ts
cd clic-web
npm install react-router-dom
npm install -D @types/react-router-dom

Identidad de marca CLIC
Nombre
CLIC studio pilates
Personalidad
Moderno, elegante, sobrio, femenino sin ser dulce. Target: mujeres 18–50. Voz bilingüe español/inglés. Frases de marca: "Welcome to your pilates era", "It's pilates time", "Push your habits, push your level", "Your new happy place".
Paleta de colores (CSS variables)
css:root {
  /* Colores de marca CLIC (del manual de marca 2024) */
  --bg: #edece7;           /* Fondo principal — off-white del manual */
  --surface: #fdfbfa;      /* Cards, superficies — blanco roto */
  --beige: #dfd4ca;        /* Beige cálido — color primario de marca */
  --beige-soft: #e8e0d6;   /* Beige suave — fondos secundarios */
  --taupe: #bcac9e;        /* Taupe — acentos, botones destacados */
  --taupe-dark: #9a8a7c;   /* Taupe oscuro — labels, subtítulos */
  --ink: #2c2f34;          /* Negro azulado — tinta principal, cards dark */
  --ink-soft: #5a5d62;     /* Texto secundario */
  --ink-mute: #9a9da2;     /* Texto terciario, placeholders */
  --line: #e0d8cd;         /* Líneas divisorias */
  --line-soft: #ebe5db;    /* Bordes suaves de cards */

  /* Acentos funcionales (NO son de la marca, son para UI solamente) */
  --sage: #8a9a82;         /* Verde salvia — confirmaciones, "al día" */
  --sage-bg: #e6ebe2;      /* Fondo verde — badges confirmados */
  --terracotta: #b87560;   /* Terracota apagado — alertas, "1 libre" */
  --terracotta-bg: #f0e0d8; /* Fondo terracota — badges alerta */
}
Tipografía

Italiana (Google Fonts, serif): Para títulos, números grandes, nombres de clases. Le da el toque elegante boutique. Es sustituto de "Seasons" del manual de marca (no disponible gratis).
Poppins (Google Fonts, sans-serif): Para texto de UI, labels, botones, cuerpo. Es la tipografía oficial del manual de marca.

html<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Italiana&display=swap" rel="stylesheet">
Uso de tipografía

Títulos de página → Italiana, ~36px
Nombres de clases → Italiana, ~18px
Números/montos → Italiana, tamaño variable
Labels/tags → Poppins uppercase, 9px, letter-spacing: 2.5px, color: var(--taupe-dark)
Texto de UI → Poppins 12-13px
Badges → Poppins 8-9px, uppercase, bold

Logo y assets
Los siguientes archivos PNG con fondo transparente deben ir en src/assets/:

clic_logo_white_transparent.png — Logo "CLIC" en blanco (para fondos oscuros)
clic_logo_black_transparent.png — Logo "CLIC" en negro (para fondos claros)
clic_iso_white_transparent.png — Isotipo (C con flechita) en blanco
clic_iso_black_transparent.png — Isotipo en negro #2c2f34
clic_iso_taupe_transparent.png — Isotipo en taupe #bcac9e

NOTA: Estos PNG fueron procesados a partir de los originales del manual de marca. Los archivos originales están en la carpeta del proyecto. Copiarlos a src/assets/ al scaffoldear.
Presencia de marca en la UI
El isotipo (la C con la flecha) aparece de forma sutil en estos lugares:

Sidebar: logo CLIC completo (blanco) arriba + "studio pilates" en Italiana debajo
Home header: isotipo negro pequeño (26px) al lado del saludo
Hero cards oscuras: isotipo blanco como watermark en esquina inferior derecha, opacity ~0.07
Quote/frases: isotipo taupe (32px) como icono acompañante
Balance de cuenta: isotipo taupe pequeño (26px) en esquina superior derecha de la card
Perfil hero: isotipo taupe en esquina superior derecha
Perfil footer: isotipo + "CLIC studio pilates" como firma
Notificaciones unread: isotipo blanco como watermark en esquina, opacity ~0.08
Clase reservada (tuya): isotipo blanco watermark en la card

Regla: nunca dos isotipos compitiendo en la misma vista. Siempre en opacidad reducida o tamaño pequeño.

Arquitectura de la app
Layout
┌──────────────────────────────────────────┐
│                                          │
│  ┌──────────┐  ┌──────────────────────┐  │
│  │          │  │                      │  │
│  │ Sidebar  │  │    Page content      │  │
│  │ (240px)  │  │    (max-width:       │  │
│  │ fixed    │  │     960px)           │  │
│  │          │  │                      │  │
│  │ - Logo   │  │                      │  │
│  │ - Nav    │  │                      │  │
│  │ - User   │  │                      │  │
│  │          │  │                      │  │
│  └──────────┘  └──────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
En mobile (< 768px):

Sidebar se oculta
Aparece un header sticky con logo CLIC (negro) + avatar
Aparece un bottom tab bar (5 items)
Contenido ocupa 100% del ancho

Sidebar (desktop)

Fondo: var(--ink)
Ancho: 240px, fixed left
Estructura:

Logo CLIC blanco + "studio pilates" en Italiana
Separador sutil (1px rgba(253,251,250,0.1))
Nav items con icono + label + badge opcional
Footer con avatar + nombre + plan


Item activo: fondo rgba(253,251,250,0.07), borde izquierdo taupe 3px, texto blanco
Item inactivo: texto rgba(253,251,250,0.5)

Páginas (5)

Home (/) — Saludo + hero card próxima clase + stats + quote
Agenda (/agenda) — Week strip + lista de clases del día
Mi cuenta (/cuenta) — Balance card + plan + movimientos
Perfil (/perfil) — Card de perfil + gráfico de progreso + menú
Novedades (/novedades) — Lista de notificaciones agrupadas por fecha

Estructura de archivos
src/
├── assets/
│   ├── clic_logo_white_transparent.png
│   ├── clic_logo_black_transparent.png
│   ├── clic_iso_white_transparent.png
│   ├── clic_iso_black_transparent.png
│   └── clic_iso_taupe_transparent.png
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.css
│   │   ├── MobileHeader.tsx
│   │   ├── MobileTabBar.tsx
│   │   └── AppLayout.tsx        ← shell con sidebar + outlet
│   ├── ui/
│   │   ├── Badge.tsx            ← badges de estado (ok, lw, fu, tuya)
│   │   ├── Card.tsx             ← card genérica con bordes redondeados
│   │   ├── ClassCard.tsx        ← card de clase (normal y "tuya")
│   │   ├── TransactionRow.tsx
│   │   └── NotificationItem.tsx
│   └── brand/
│       ├── Watermark.tsx        ← isotipo como watermark posicionado
│       └── BrandFooter.tsx      ← firma "CLIC studio pilates"
├── pages/
│   ├── Home.tsx
│   ├── Home.css
│   ├── Agenda.tsx
│   ├── Agenda.css
│   ├── Cuenta.tsx
│   ├── Cuenta.css
│   ├── Perfil.tsx
│   ├── Perfil.css
│   ├── Novedades.tsx
│   └── Novedades.css
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── api/
│   ├── client.ts               ← fetch wrapper con base URL y auth headers
│   ├── classes.ts               ← getClasses, bookClass, cancelClass
│   ├── payments.ts              ← getBalance, getTransactions, getPlan
│   ├── profile.ts               ← getProfile, getProgress
│   └── notifications.ts         ← getNotifications, markAsRead
├── types/
│   └── index.ts                 ← interfaces TypeScript compartidas
├── styles/
│   └── globals.css              ← variables CSS, reset, tipografía base
├── App.tsx                      ← router setup
├── main.tsx
└── vite-env.d.ts

Detalle de cada página
1. Home (/)
┌──────────────────────────────────────┐
│ HELLO, GIRL                          │
│ Welcome back, Lucía.    Mié 16 abril │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ▓▓▓▓▓ HERO CARD (fondo ink) ▓▓▓ │ │
│ │ YOUR NEXT CLASS       18:30     │ │
│ │ Reformer              [Ver →]   │ │
│ │ Intermedio                      │ │
│ │ Sofía · Sala 2 · 50 min        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Your week                  VER TODO  │
│ ┌──────────┐  ┌──────────┐          │
│ │ CLASES   │  │ CUENTA   │          │
│ │ 8 / 12   │  │ $0       │          │
│ │ 4 rest.  │  │ ✓ Al día │          │
│ └──────────┘  └──────────┘          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ [iso taupe] It's pilates time.  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
2. Agenda (/agenda)
┌──────────────────────────────────────┐
│ APRIL · WEEK 16                      │
│ Agenda              4 clases · Mié 16│
│                                      │
│ [L14] [M15] [▓M16▓] [J17] [V18] ... │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 09:00  │ Mat Pilates          [4]│ │
│ │   AM   │ Sofía · 50 min      lib│ │
│ ├────────┤──────────────────────────│ │
│ │ 11:00  │ Reformer Inicial    [1]│ │
│ │   AM   │ Clara · 50 min     lib │ │
│ ├────────┤──────────────────────────│ │
│ │▓18:30 ▓│▓Reformer Intermedio▓[T]▓│ │◄── card oscura
│ │▓  PM  ▓│▓Sofía · Sala 2     UYA▓│ │
│ ├────────┤──────────────────────────│ │
│ │ 20:00  │ Barre Fusion       [LL]│ │
│ │   PM   │ Martina · 45 min   ENO │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
3. Mi cuenta (/cuenta)
┌──────────────────────────────────────┐
│ YOUR ACCOUNT                         │
│ Mi cuenta                            │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ▓▓▓▓ BALANCE (fondo ink) ▓▓▓▓▓ │ │
│ │ SALDO ACTUAL     [Ver historial]│ │
│ │ $0,00                          │ │
│ │ ✓ Estás al día                 │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────┐  ┌──────────┐          │
│ │ TU PLAN  │  │ USADAS   │          │
│ │ 8 clases │  │ 8 / 12   │          │
│ │ [ACTIVO] │  │ 4 rest.  │          │
│ └──────────┘  └──────────┘          │
│                                      │
│ Movimientos                          │
│ ┌──────────────────────────────────┐ │
│ │ ↑ Plan mensual    1 abr  $24000 │ │
│ │ ○ Clase indiv.   28 mar  $4500  │ │
│ │ ↑ Plan mensual    1 mar  $24000 │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
4. Perfil (/perfil)
┌──────────────────────────────────────┐
│ YOUR PROFILE                         │
│ Perfil                               │
│                                      │
│ ┌──────────┐  ┌────────────────────┐ │
│ │ ▓▓HERO▓▓ │  │ Your progress +92% │ │
│ │  [ava]   │  │                    │ │
│ │  Lucía   │  │ ▓ ▓ ▓ ▓ █ (bars)  │ │
│ │ MIEMBRO  │  │ D E F M A         │ │
│ │ 2024     │  │                    │ │
│ │          │  ├────────────────────┤ │
│ │ 47 12  3 │  │ ☺ Datos personales │ │
│ │ CL SE RA │  │ ⚙ Preferencias    │ │
│ │          │  │ ? Ayuda            │ │
│ │ [C] CLIC │  │ ↗ Cerrar sesión   │ │
│ └──────────┘  └────────────────────┘ │
└──────────────────────────────────────┘
5. Novedades (/novedades)
┌──────────────────────────────────────┐
│ WHAT'S NEW                           │
│ Novedades              MARCAR LEÍDAS │
│                                      │
│ HOY                                  │
│ ┌──────────────────────────────────┐ │
│ │▓▓ ◷ Tu clase empieza en 2h   ▓▓│ │◄── unread = fondo ink
│ │▓▓   Reformer · Sofía · Sala 2▓▓│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │▓▓ ✓ Reserva confirmada       ▓▓│ │
│ │▓▓   Mat Pilates · Vie 18     ▓▓│ │
│ └──────────────────────────────────┘ │
│                                      │
│ ESTA SEMANA                          │
│ ┌──────────────────────────────────┐ │
│ │ ✦ ¡3 semanas seguidas!          │ │◄── read = fondo surface
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ↑ Pago recibido                 │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

Patrones de diseño CSS
Card genérica
cssbackground: var(--surface);
border: 1px solid var(--line-soft);
border-radius: 20px;
padding: 22px;
Card hero (fondo oscuro)
cssbackground: var(--ink);
border-radius: 24px;
padding: 32px 36px;
color: var(--surface);
position: relative;
overflow: hidden; /* para watermarks */
Radial glow decorativo en cards oscuras
css/* Pseudo-element en ::before o ::after */
position: absolute;
top: -60px; right: -80px;
width: 300px; height: 300px;
border-radius: 50%;
background: radial-gradient(circle, rgba(188,172,158,0.2), transparent 65%);
Tag/label de sección
cssfont-size: 9px;
color: var(--taupe-dark);
letter-spacing: 3px;
text-transform: uppercase;
font-family: 'Poppins', sans-serif;
font-weight: 500;
Título de página
cssfont-family: 'Italiana', serif;
font-size: 36px;
font-weight: 400;
letter-spacing: 0.5px;
line-height: 1;
Badge de estado
css/* Variantes */
.ok    { background: var(--sage-bg);      color: var(--sage); }
.lw    { background: var(--terracotta-bg); color: var(--terracotta); }
.fu    { background: var(--line);          color: var(--ink-mute); }
.tuya  { background: var(--taupe);         color: var(--ink); }

/* Común */
font-size: 9px;
padding: 6px 12px;
border-radius: 10px;
font-weight: 600;
letter-spacing: 0.8px;
text-transform: uppercase;
Watermark del isotipo
cssposition: absolute;
bottom: -24px;
right: -24px;
width: 180px; /* varía */
height: 180px;
object-fit: contain;
opacity: 0.07; /* clave: muy sutil */
z-index: 0;
pointer-events: none;
Botón CTA taupe
cssbackground: var(--taupe);
color: var(--ink);
padding: 10px 18px;
border-radius: 100px;
font-size: 10px;
font-weight: 600;
letter-spacing: 1.5px;
text-transform: uppercase;
border: none;
cursor: pointer;
Sidebar item activo
csscolor: var(--surface);
background: rgba(253,251,250,0.07);
border-left: 3px solid var(--taupe);

Responsive breakpoints
css/* Desktop: > 768px — sidebar visible, grids de 2 columnas */
/* Mobile: <= 768px — sidebar oculta, bottom tab bar, grids de 1 columna */

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .main { margin-left: 0; padding-bottom: 80px; }
  .mobile-bar { display: flex; }
  .mobile-header { display: flex; }
  /* Todas las grids pasan a 1 columna */
  /* Hero cards: flex-direction column */
  /* Perfil: grid 1 columna en vez de 2 */
}

API (para cuando se conecte)
La API base URL se configura como variable de entorno:
envVITE_API_BASE_URL=https://tu-api.ejemplo.com/api
Endpoints esperados (adaptar a tu API real)
typescript// Clases
GET /classes?date=2026-04-16        → ClassItem[]
POST /classes/:id/book              → BookingResult
DELETE /classes/:id/booking         → void

// Pagos
GET /account/balance                → { balance: number, status: string }
GET /account/plan                   → { name: string, classes: number, renewal: string }
GET /account/transactions           → Transaction[]

// Perfil
GET /profile                        → UserProfile
GET /profile/progress               → ProgressData

// Notificaciones
GET /notifications                  → Notification[]
PUT /notifications/mark-read        → void
Tipos TypeScript base
typescriptinterface ClassItem {
  id: string;
  name: string;          // "Reformer Intermedio"
  instructor: string;    // "Sofía"
  room: string;          // "Sala 2"
  time: string;          // "18:30"
  duration: number;      // 50 (minutos)
  level: string;         // "Intermedio"
  availableSlots: number;
  isBooked: boolean;     // si la usuaria ya reservó
}

interface Transaction {
  id: string;
  type: 'payment' | 'class';
  title: string;
  date: string;
  method?: string;       // "Mercado Pago"
  amount: number;
}

interface UserProfile {
  name: string;
  memberSince: number;   // año
  totalClasses: number;
  totalWeeks: number;
  streak: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'class' | 'booking' | 'payment' | 'achievement';
}

Instrucciones de implementación

1. Scaffoldear primero el layout shell: AppLayout.tsx con sidebar + <Outlet /> de React Router. Verificar que la navegación entre las 5 rutas funcione.
2. Implementar con data mock hardcodeada. No conectar la API todavía. Usar los datos de ejemplo de los mockups (Lucía, Reformer Intermedio, 8/12 clases, etc.) para que se vea completo desde el día 1.
3. Mobile-first no, desktop-first sí. El diseño parte de desktop con sidebar y luego adapta a mobile con media query.
4. Los assets PNG (logos e isotipos) se importan como imágenes normales en React: import logoWhite from '../assets/clic_logo_white_transparent.png'.
5. Animaciones mínimas: solo un fadeIn suave al cambiar de página (opacity + translateY con 0.3s ease). No overcomplicar.
6. No usar ningún framework CSS (no Tailwind, no MUI, no Chakra). El diseño es 100% custom con CSS vanilla + variables. La identidad de CLIC requiere control fino que los frameworks no dan.




## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs