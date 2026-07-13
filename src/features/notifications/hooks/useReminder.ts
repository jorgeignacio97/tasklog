import { useEffect } from 'react'
import { taskService } from '../../../lib/services'

const REMINDER_INACTIVE_KEY = 'tasklog_reminder_inactive'
const REMINDER_UNREPORTED_KEY = 'tasklog_reminder_unreported'

function daysAgo(dateStr: string): number {
  const then = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function isNearMonthEnd(): boolean {
  const now = new Date()
  const day = now.getDate()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return day >= lastDay - 2
}

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function wasShownToday(key: string): boolean {
  return localStorage.getItem(key) === today()
}

function markShown(key: string): void {
  localStorage.setItem(key, today())
}

export function useReminder() {
  useEffect(() => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
      return
    }

    if (Notification.permission !== 'granted') return

    // Reminder 1: Check if 3+ days without tasks
    if (!wasShownToday(REMINDER_INACTIVE_KEY)) {
      taskService.getAll().then((tasks) => {
        if (tasks.length === 0) return

        // Sort by createdAt descending
        const sorted = [...tasks].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        const latest = sorted[0]

        if (daysAgo(latest.createdAt) >= 3) {
          new Notification('TaskLog — Inactividad', {
            body: `Hace ${daysAgo(latest.createdAt)} días que no registras tareas. ¡Registra algo nuevo!`,
          })
          markShown(REMINDER_INACTIVE_KEY)
        }
      })
    }

    // Reminder 2: Check if near month end with unreported tasks
    if (!wasShownToday(REMINDER_UNREPORTED_KEY) && isNearMonthEnd()) {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const monthEnd = today()

      taskService.getUnreportedInRange(monthStart, monthEnd).then((tasks) => {
        if (tasks.length === 0) return

        new Notification('TaskLog — Tareas sin reportar', {
          body: `Tienes ${tasks.length} tarea${tasks.length > 1 ? 's' : ''} sin reportar cerca de fin de mes. ¡Crea tu reporte!`,
        })
        markShown(REMINDER_UNREPORTED_KEY)
      })
    }
  }, [])
}
