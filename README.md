# tasklog

App local-first de registro de tareas y control de tiempos. Registrá tareas por categoría, seguí su estado y duración estimada, y armá reportes a partir del trabajo completado en un rango de fechas — todo persistido del lado del cliente (IndexedDB vía Dexie), sin necesidad de backend.

## Funcionalidades

- **Tareas** — creá, editá y seguí tareas con categoría, estado, duración estimada y notas.
- **Reportes** — armá un reporte a partir de tareas no reportadas en un rango de fechas y exportalo como PDF (`@react-pdf/renderer`).
- **Historial** — navegá los reportes generados anteriormente.
- **Recordatorios** — notificaciones dentro de la app para tareas que quedaron sin actualizar por mucho tiempo.
- **Backup** — exportá/importá todos los datos locales como JSON desde la pantalla de Configuración.
- **Instalable y offline** — PWA con service worker de precacheo; funciona completamente sin conexión una vez instalada.

## Stack

- React 19 + Vite + TypeScript (strict)
- TanStack Router (routing) + TanStack Query (patrón de server-state sobre servicios locales) + TanStack Table
- Zustand (estado de UI), React Hook Form + Zod (formularios/validación)
- Tailwind CSS v4
- Dexie (IndexedDB) para persistencia local
- vite-plugin-pwa (instalable, service worker offline)
- Vitest + Testing Library para tests

## Comandos

```bash
pnpm install       # instalar dependencias
pnpm dev           # levantar el servidor de desarrollo
pnpm build         # typecheck + build de producción
pnpm lint          # lint
pnpm test          # correr la suite de tests
pnpm test:watch    # correr tests en modo watch
pnpm test:coverage # correr tests con reporte de cobertura
pnpm format        # formatear con Prettier
```

## Arquitectura

Estructura Screaming/feature-based:

- `src/features/<nombre>/` — `components`, `hooks`, `services`, `schemas`; cada feature expone su API pública solo vía `index.ts`.
- `src/shared/` — código reutilizable entre features (components, layout, utils, types).
- `src/routes/` — definiciones de rutas de TanStack Router.
- `src/stores/` — estado de UI con Zustand.

Ver `CLAUDE.md` para el conjunto completo de convenciones que sigue este codebase.
