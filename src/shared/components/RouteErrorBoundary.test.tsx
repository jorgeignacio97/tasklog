import { render, screen, fireEvent } from '@testing-library/react'
import {
  CatchBoundary,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import RouteErrorBoundary from './RouteErrorBoundary'
import AppShell from '../layout/AppShell'

describe('RouteErrorBoundary', () => {
  it('renders the fallback with the error message and a retry button', () => {
    const reset = vi.fn()
    render(<RouteErrorBoundary error={new Error('Fallo al cargar la tarea')} reset={reset} />)

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByText('Fallo al cargar la tarea')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('calls reset when the retry button is clicked', () => {
    const reset = vi.fn()
    render(<RouteErrorBoundary error={new Error('boom')} reset={reset} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('falls back to a generic message when the thrown value is not an Error', () => {
    render(<RouteErrorBoundary error={'not an Error instance'} reset={vi.fn()} />)

    expect(screen.getByText('Ocurrió un error inesperado.')).toBeInTheDocument()
  })

  it('catches a render-time throw from a child and shows the fallback instead of crashing', () => {
    // A mutable flag rather than a fixed attempt count: React replays a
    // throwing render internally before it reaches the boundary, so the
    // condition must stay stable until the test itself flips it for retry.
    const flaky = { shouldThrow: true }
    function FlakyChild() {
      if (flaky.shouldThrow) throw new Error('render explodió')
      return <p>Contenido recuperado</p>
    }

    render(
      <CatchBoundary getResetKey={() => 0} errorComponent={RouteErrorBoundary}>
        <FlakyChild />
      </CatchBoundary>,
    )

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.queryByText('Contenido recuperado')).not.toBeInTheDocument()

    flaky.shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(screen.getByText('Contenido recuperado')).toBeInTheDocument()
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
  })
})

describe('RouteErrorBoundary wired as router.defaultErrorComponent (per-route isolation)', () => {
  it('catches a leaf-route throw at that route only, leaving the shell/nav intact and navigable', async () => {
    // Mirrors the real tree: root route renders AppShell (sidebar + Outlet),
    // a leaf route can throw independently. Only `defaultErrorComponent` is
    // set (matching src/App.tsx) — proving isolation depends on that, not on
    // a root-only `errorComponent`.
    const flaky = { shouldThrow: true }
    function FlakyTasksLeaf() {
      if (flaky.shouldThrow) throw new Error('leaf explodió')
      return <p>Tarea cargada</p>
    }

    const rootRoute = createRootRoute({ component: () => <AppShell /> })
    const tasksRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/tasks',
      component: FlakyTasksLeaf,
    })
    const reportsRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/reports',
      component: () => <p>Reportes ok</p>,
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([tasksRoute, reportsRoute]),
      history: createMemoryHistory({ initialEntries: ['/tasks'] }),
      defaultErrorComponent: RouteErrorBoundary,
    })

    render(<RouterProvider router={router} />)

    // Leaf fallback shown, shell/nav still rendered around it.
    // Router match resolution is async, so the first paint is awaited.
    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.queryByText('Tarea cargada')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tareas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reportes' })).toBeInTheDocument()

    // The nav is not just present but actually usable: navigate away from
    // the broken route without ever hitting a full-app fallback.
    fireEvent.click(screen.getByRole('link', { name: 'Reportes' }))

    expect(await screen.findByText('Reportes ok')).toBeInTheDocument()
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tareas' })).toBeInTheDocument()
  })
})
