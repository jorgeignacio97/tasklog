import type { TaskCategory, TaskStatus, ReportStatus } from '../types'
import { cn } from '../utils/cn'
import { badgeLabels } from '../lib/labels'

type BadgeVariant = TaskCategory | TaskStatus | ReportStatus

const badgeColors: Record<BadgeVariant, string> = {
  frontend: 'bg-blue-500/20 text-blue-300',
  backend: 'bg-emerald-500/20 text-emerald-300',
  bug: 'bg-red-500/20 text-red-300',
  review: 'bg-amber-500/20 text-amber-300',
  other: 'bg-zinc-500/20 text-zinc-300',
  pendiente: 'bg-amber-500/20 text-amber-300',
  'en-curso': 'bg-blue-500/20 text-blue-300',
  completada: 'bg-emerald-500/20 text-emerald-300',
  draft: 'bg-zinc-500/20 text-zinc-300',
  sent: 'bg-emerald-500/20 text-emerald-300',
}

type BadgeProps = {
  variant: BadgeVariant
  className?: string
}

export default function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        badgeColors[variant] ?? badgeColors.other,
        className,
      )}
    >
      {badgeLabels[variant]}
    </span>
  )
}
