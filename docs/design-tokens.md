# Design Tokens — Guía de migración

Fuente de verdad: CSS vars en `src/index.css` (`:root` light, `:root.dark` dark), expuestas como clases Tailwind en `tailwind.config.js`.

## Regla de oro

**Nunca usar clases de paleta cruda de Tailwind** (`text-blue-600`, `bg-red-50`, `dark:bg-blue-900/20`, etc.). Siempre el token semántico. Al tokenizar un elemento, **borrar su override `dark:` pareado** — la CSS var ya resuelve el dark mode.

## Cheat-sheet de reemplazo

| Antes (raw) | Después (token) |
|---|---|
| `text-blue-600` / `text-blue-500` | `text-primary` |
| `bg-blue-600` + `hover:bg-blue-700` | `bg-primary hover:bg-primary-dark` |
| `bg-blue-50` (+ `dark:bg-blue-900/20`) | `bg-primary-soft` |
| `border-blue-100/200` | `border-primary/20` |
| `text-red-500/600`, `bg-red-50` | `text-danger`, `bg-danger-soft` |
| `text-green-600`, `text-emerald-*`, `bg-green-50` | `text-success`, `bg-success-soft` |
| `text-amber-500/600`, `bg-amber-50` | `text-warning`, `bg-warning-soft` |
| `text-sky-*`, `text-cyan-*` informativo | `text-info`, `bg-info-soft` |
| Verde de proteína | `text-protein`, `bg-protein-soft` |
| Ámbar de carbohidratos | `text-carbs`, `bg-carbs-soft` |
| Naranja de grasas | `text-fat`, `bg-fat-soft` |
| `bg-white`, `bg-slate-800` (superficie) | `bg-surface` / `bg-surface-elevated` (sheets/nav/modales) |
| `bg-slate-50/100` (hover/fondo) | `bg-surface-lighter` / `bg-background` |
| `text-slate-900` … `text-slate-400` | `text-text-primary` / `-secondary` / `-tertiary` |
| `border-slate-200/700` | `border-border` |
| Decorativos purple/pink sin semántica | elegir token semántico o macro más cercano (caso por caso) |
| `bg-slate-900/80`, `bg-gray-900` en scrims sobre fotos/cámara | `bg-overlay` (+ `/60`, `/80`, `/90`) — fijo, **no** theme-aware a propósito (contraste sobre imagen debe sostenerse en ambos temas) |

## Forma y profundidad

- **Radios (3 valores)**: `rounded-card` (20px, cards/modales/sheets), `rounded-control` (12px, botones/inputs/filas), `rounded-full` (pills/FAB/nav). No usar `rounded-lg/xl/2xl/3xl` ni arbitrarios `rounded-[2.5rem]`.
- **Sombras (3 valores)**: `shadow-card` (cards), `shadow-float` (nav/FAB/sheets flotantes), `shadow-glow` (CTA primario). No usar `shadow-sm/lg/xl/2xl` ad hoc.

## Tipografía

Escala en `tailwind.config.js` → `fontSize`: `text-display` (métricas hero, combinar con `tabular-nums`), `text-title`, `text-heading`, `text-body-md`, `text-caption`, `text-overline` (+ `uppercase`, estilo etiqueta). Números de métricas siempre con `tabular-nums`.

## Marca

- Un solo azul: `--color-primary` (`#0066ee` light / `#3b82f6` dark).
- Gradiente de marca: `var(--brand-gradient)` (`--brand-gradient-from` → `--brand-gradient-to`). Usarlo en logos/splash en lugar de hex hardcodeados.

## Safe areas (PWA con notch)

`viewport-fit=cover` está activo: usar `.pt-safe`/`.pb-safe` (o `env(safe-area-inset-*)` en arbitrarios) en chrome fijo (header, nav, sheets). `.safe-bottom` = clearance del nav flotante.
