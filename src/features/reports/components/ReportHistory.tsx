import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, FileText, Trash2 } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import { ReportListItem } from './ReportListItem'
import {
  useReports,
  useUpdateReport,
  useDeleteReport,
} from '../hooks/useReports'
import type { Report } from '../../../shared/types'

export default function ReportHistory() {
  const { data: reports, isLoading, isError, refetch } = useReports()
  const updateReport = useUpdateReport()
  const deleteReport = useDeleteReport()

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    status: 'draft' | 'sent'
  } | null>(null)

  const handleMarkSent = (id: string) => {
    updateReport.mutate({
      id,
      data: { status: 'sent', sentAt: new Date().toISOString() },
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteReport.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  // ── Loading state ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">
          Historial de reportes
        </h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-zinc-800"
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">
          Historial de reportes
        </h1>
        <div className="text-center py-16 text-zinc-500">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium mb-1 text-zinc-300">
            No se pudieron cargar los reportes
          </p>
          <p className="text-sm mb-4">
            Puede que la base de datos local no esté disponible en este
            navegador.
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────
  if (!reports || reports.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">
          Historial de reportes
        </h1>
        <div className="text-center py-16 text-zinc-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Todavía no hay reportes</p>
          <p className="text-sm mb-4">
            Generá tu primer reporte desde el generador de reportes.
          </p>
          <Link to="/reports">
            <Button variant="primary">
              <FileText size={16} />
              Ir a generar reporte
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Report list ──────────────────────────────────────────
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">
          Historial de reportes
        </h1>
        <Link to="/reports">
          <Button variant="secondary" size="sm">
            <FileText size={14} />
            Nuevo reporte
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <ReportListItem
            key={report.id}
            report={report}
            onMarkSent={handleMarkSent}
            onDelete={(r: Report) =>
              setDeleteTarget({ id: r.id, status: r.status })
            }
            isMarkingSent={updateReport.isPending}
            isDeleting={deleteReport.isPending}
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar reporte"
      >
        <p className="text-sm text-zinc-300 mb-4">
          {deleteTarget?.status === 'sent'
            ? 'Este reporte ya fue marcado como enviado. Las tareas volverán a estar disponibles para reportar.'
            : 'Las tareas vinculadas a este reporte volverán a estar disponibles para reportar.'}
        </p>
        <p className="text-sm text-zinc-500 mb-6">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
            isLoading={deleteReport.isPending}
          >
            <Trash2 size={14} />
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
