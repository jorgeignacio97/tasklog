import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FileText, Trash2, Send } from 'lucide-react'
import Card from '../../../shared/components/Card'
import Badge from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import { formatDate, formatDuration } from '../../../shared/utils/cn'
import { useReports, useUpdateReport, useDeleteReport } from '../hooks/useReports'

export default function ReportHistory() {
  const { data: reports, isLoading } = useReports()
  const updateReport = useUpdateReport()
  const deleteReport = useDeleteReport()

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    status: 'draft' | 'sent'
  } | null>(null)

  const handleMarkSent = (id: string) => {
    updateReport.mutate({ id, data: { status: 'sent', sentAt: new Date().toISOString() } })
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
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">Report History</h1>
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

  // ── Empty state ──────────────────────────────────────────
  if (!reports || reports.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">Report History</h1>
        <div className="text-center py-16 text-zinc-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">No reports yet</p>
          <p className="text-sm mb-4">
            Generate your first report from the Report Builder.
          </p>
          <Link to="/reports">
            <Button variant="primary">
              <FileText size={16} />
              Go to Report Builder
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
        <h1 className="text-xl font-semibold text-zinc-100">Report History</h1>
        <Link to="/reports">
          <Button variant="secondary" size="sm">
            <FileText size={14} />
            New Report
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={report.status} />
                  <span className="text-sm text-zinc-400">
                    {formatDate(report.startDate)} – {formatDate(report.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {report.taskCount} task{report.taskCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-70"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatDuration(report.totalHours)}
                  </span>
                  {report.sentAt && (
                    <span className="text-xs text-zinc-500">
                      Sent {formatDate(report.sentAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {report.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkSent(report.id)}
                    isLoading={updateReport.isPending}
                    title="Mark as sent"
                  >
                    <Send size={14} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeleteTarget({ id: report.id, status: report.status })
                  }
                  className="text-red-400 hover:text-red-300"
                  title="Delete report"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Report"
      >
        <p className="text-sm text-zinc-300 mb-4">
          {deleteTarget?.status === 'sent'
            ? 'This report was marked as sent. Tasks will be available for reporting again.'
            : 'Tasks linked to this report will be available for reporting again.'}
        </p>
        <p className="text-sm text-zinc-500 mb-6">This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
            isLoading={deleteReport.isPending}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
