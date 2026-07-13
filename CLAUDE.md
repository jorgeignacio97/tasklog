# CLAUDE.md

## Regla de oro para proyectos existentes
Si el proyecto ya tiene un stack instalado, respetarlo. No reemplazar librerías, no cambiar
package manager, no migrar frameworks. Los **principios** siempre aplican; el **stack
preferido** solo aplica a proyectos nuevos.

---

## Principios (siempre aplican)

### TypeScript
- `strict: true`. `type` sobre `interface`. `unknown` + narrowing en vez de `any`. Evitar `as`.
- Tipos inferidos de Zod (`z.infer<typeof schema>`), nunca duplicados a mano.

### Arquitectura (Screaming / feature-based)
- Carpetas raíz: `config/`, `features/`, `shared/`
- `features/<nombre>/` contiene: `components`, `hooks`, `services`, `state`, `types`, `utils`
- Cada feature expone su API pública SOLO vía `index.ts`. Imports externos apuntan al
  index; el interior se importa por ruta directa, nunca por barrel.
- `config/` = constantes, env, theme, setup de libs. SIN lógica de negocio.
- `shared/` = misma estructura que una feature, para lo reutilizable entre features.
- Regla dura: si algo tiene lógica de negocio, no va en `config/`.

### Reglas de estado (dueño único — no duplicar)
- Datos de servidor: librería de estado servidor (TanStack Query o equivalente). Prohibido
  copiarlos a estado local o global.
- UI/cliente: estado global (Zustand o equivalente), con selectores atómicos.
- Navegación/filtros: search params del router, no estado global.
- Formularios: librería dedicada (React Hook Form o equivalente).

### Estilo de código
- Clean code, legibilidad primero. No abstraer hasta el tercer uso (regla de 3).
- Sin sobreingeniería: no patrones ni capas que el tamaño actual no justifique.
- Nombres explícitos. Funciones cortas, una responsabilidad.
- Orden interno de un componente: hooks → valores derivados → efectos → handlers
  → guard clauses → JSX.
- Estado derivado: calcular en render, no con useEffect. Un efecto por responsabilidad.

### Idioma del código
- Variables, funciones, constantes y comentarios: español O inglés, NUNCA mezclados
  en el mismo proyecto.
- Al iniciar o revisar un proyecto, detectar el idioma predominante y respetarlo.
- Consistencia > preferencia personal.

### Manejo de errores
- Error Boundary por ruta o sección, con opción de reintentar.
- Validar respuestas externas con Zod en el borde; nunca confiar en el contrato del backend.

### Testing
- Mockear la red con MSW; no mockear fetch/axios a mano.
- Probar comportamiento visible, no detalles internos.
- Tests co-locados con el archivo o en `__tests__` dentro de la feature.

### Seguridad (siempre)
- Credenciales/keys/URLs en variables de entorno. Nunca hardcodeadas.
- `.env` en `.gitignore` + `.env.example` sin valores reales.
- En frontend: solo variables públicas del bundler (`VITE_`, `NEXT_PUBLIC_`, etc.).
- Validar todo input externo con Zod antes de procesarlo.
- Nunca construir SQL concatenando strings. Nunca `eval`/`new Function` con datos de usuario.

### Definition of done
- lint + typecheck + tests deben pasar antes de terminar.
- Arreglar las violaciones, no silenciarlas (no `// eslint-disable` salvo justificación).

### Restricciones duras
- Nunca commitear credenciales ni keys.
- No añadir dependencias sin justificación.

---

## Stack preferido (proyectos nuevos)

Usar al iniciar desde cero. En proyectos existentes, adaptar al stack instalado.

### Core
- React 19 · Vite · TypeScript strict
- React Compiler activado — no escribir `useMemo`/`useCallback`/`React.memo` manual
- Package manager: pnpm

### Estado
- Servidor: TanStack Query v5
- Cliente: Zustand (slices + selectores)
- Routing: TanStack Router (type-safe, search params con Zod)
- HTTP: Axios (instancia única en `config/api` con interceptors)

### UI
- Tailwind CSS v4 (config en CSS con `@theme`, plugin de Vite — no PostCSS)
- Iconos: lucide-react · Toasts: sonner
- Clases condicionales: clsx/cva. Patrones repetidos → componente, no `@apply`.

### Forms & Validación
- React Hook Form + Zod (`zodResolver`, tipos con `z.infer`)

### Backend / Infra
- Supabase (cliente único en `config/`, acceso vía services, nunca desde componentes)
- Deploy: Vercel

### Testing
- Vitest + Testing Library + MSW

### Comandos (pnpm)
```
pnpm install | pnpm dev | pnpm build | pnpm lint | pnpm tsc --noEmit | pnpm test
```

---

## Idioms por librería (cuando la librería está en el proyecto)

### React 19
- NO `forwardRef` (ref es prop normal). Usar Actions / `useActionState` para mutaciones
  de formulario cuando aplique. NO `React.FC`.

### React Compiler
- Respetar Rules of React: no mutar props/estado, no hooks condicionales, no leer refs
  en render, no `setState` dentro de efectos. Violaciones se omiten en silencio.
- Excepción (memo manual válido): valores que cruzan librerías de terceros no compiladas,
  o estabilidad referencial que el compiler no puede ver a través de un límite de efecto.
- Vitest no aplica la transform: fixtures que mutan a propósito llevan `"use no memo"`.

### Zustand
- Stores en `features/<nombre>/state`, divididos en slices.
- Exponer hooks selectores (`useUser = () => useStore(s => s.user)`), no el store crudo.
- Selector que devuelve objeto → `useShallow`; valor primitivo → selector atómico directo.

### TanStack Query v5
- Firma de objeto en `useQuery`/`useMutation` (no firma posicional v4).
- Sin `onSuccess`/`onError` en `useQuery`; side-effects en mutaciones.
- Query keys: arrays tipados y centralizados por feature (`userKeys.detail(id)`).
- `queryOptions()` para configs tipadas reutilizables junto a los key factories.
- Funciones de fetch en `features/<nombre>/services`. No `useEffect`+fetch manual.
- Pasar el `signal` del AbortController al fetcher.
- Tras mutación: invalidar queries afectadas; optimistic updates con `onSettled`.
- `staleTime` explícito por query (no dejar el 0 por defecto).

### TanStack Router
- Rutas type-safe. Validar search params con Zod. Cargar datos con loaders cuando convenga.

### Axios
- Una instancia única en `config/api` con interceptors (auth, errores).
- No instanciar Axios suelto en componentes.

### Supabase
- Cliente único en `config/`. Acceso siempre vía services, nunca desde componentes.

### Tailwind v4
- Config en CSS con `@theme` (NO `tailwind.config.js`). Entrada: `@import "tailwindcss"`.
- Solo tokens definidos en `@theme`. Sin valores arbitrarios `[..]` salvo justificación.
- En CSS-module/scoped, añadir `@reference` a la entrada de Tailwind.

### Mapas (cuando aplique)
- react-map-gl declarativo. Instancia vía ref, no estado (evita re-renders).
- Tipos de maplibre-gl, no `@types/leaflet`.