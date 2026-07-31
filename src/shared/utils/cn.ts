import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const parsed = isDateOnly ? new Date(`${date}T00:00:00`) : new Date(date)
  return parsed.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDuration(hours: number): string {
  const safeHours = Number.isFinite(hours) && hours >= 0 ? hours : 0
  const totalMinutes = Math.round(safeHours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
