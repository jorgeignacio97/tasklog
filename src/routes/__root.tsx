import { createRootRoute } from '@tanstack/react-router'
import AppShell from '../shared/layout/AppShell'

export const Route = createRootRoute({
  component: () => <AppShell />,
})
