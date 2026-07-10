import type { TaskCategory, TaskStatus, ReportStatus } from '../types'
import { cn } from '../utils/cn'

type BadgeVariant = TaskCategory | TaskStatus | ReportStatus

const badgeColors: Record<BadgeVariant, string> = {
  frontend: 'bg-blue-500/20 text-blue-300',
  backend: 'bg-emerald-500/20 text-emerald-300',
  bug: 'bg-red-500/20 text-red-300',
  review: 'bg-amber-500/20 text-amber-300',
  other: 'bg-zinc-500/20 text-zinc-300',
  pending: 'bg-amber-500/20 text-amber-300',
  'in-progress': 'bg-blue-500/20 text-blue-300',
  completed: 'bg-emerald-500/20 text-emerald-300',
  draft: 'bg-zinc-500/20 text-zinc-300',
  sent: 'bg-emerald-500/20 text-emerald-300',
}

interface BadgeProps {
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
      {variant}
    </span>
  )
}
