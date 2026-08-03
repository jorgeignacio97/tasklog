import { AlertTriangle } from 'lucide-react'
import type { ErrorComponentProps } from '@tanstack/react-router'
import Card from './Card'
import { Button } from './Button'

export default function RouteErrorBoundary({
  error,
  reset,
}: ErrorComponentProps<unknown>) {
  const message =
    error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-400" />
          <h2 className="text-lg font-semibold text-zinc-100">
            Algo salió mal
          </h2>
          <p className="text-sm text-zinc-400">{message}</p>
          <Button onClick={reset} variant="secondary">
            Reintentar
          </Button>
        </div>
      </Card>
    </div>
  )
}
