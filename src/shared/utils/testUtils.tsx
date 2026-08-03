import type { ReactElement, ReactNode } from 'react'
import { render, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

/**
 * Test-only harness (TH-1). Never imported by production code.
 *
 * Wraps every hook/component test in a fresh QueryClient (queries and
 * mutations retry: false — no retry storms in tests) plus a minimal
 * memory-router tree that provides `useNavigate`/`Link` context without
 * mounting real sibling routes or the AppShell layout.
 */

const noOp = () => null

const rootRoute = createRootRoute()
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: noOp,
})
const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: noOp,
})
const tasksNewRoute = createRoute({
  getParentRoute: () => tasksRoute,
  path: '/new',
  component: noOp,
})
const taskDetailRoute = createRoute({
  getParentRoute: () => tasksRoute,
  path: '/$taskId',
  component: noOp,
})
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: noOp,
})
const reportsHistoryRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: '/history',
  component: noOp,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  tasksRoute.addChildren([tasksNewRoute, taskDetailRoute]),
  reportsRoute.addChildren([reportsHistoryRoute]),
])

type HarnessOptions = {
  route?: string
}

function createHarness(opts?: HarnessOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [opts?.route ?? '/'] }),
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>
          {children}
        </RouterContextProvider>
      </QueryClientProvider>
    )
  }

  return { router, queryClient, Wrapper }
}

export function renderWithProviders(ui: ReactElement, opts?: HarnessOptions) {
  const ctx = createHarness(opts)
  const utils = render(ui, { wrapper: ctx.Wrapper })
  return { ...utils, router: ctx.router, queryClient: ctx.queryClient }
}

export function renderHookWithProviders<Result, Props>(
  cb: (props: Props) => Result,
  opts?: HarnessOptions,
) {
  const ctx = createHarness(opts)
  const utils = renderHook(cb, { wrapper: ctx.Wrapper })
  return { ...utils, router: ctx.router, queryClient: ctx.queryClient }
}
