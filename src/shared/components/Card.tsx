import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

type CardProps = {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  className?: string
}

export default function Card({
  children,
  header,
  footer,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-800 bg-zinc-900 p-4',
        className,
      )}
    >
      {header && <div className="mb-3">{header}</div>}
      {children}
      {footer && (
        <div className="mt-3 border-t border-zinc-800 pt-3">{footer}</div>
      )}
    </div>
  )
}
