import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { FileText, Trash2, Send, Download } from 'lucide-react'
import Card from '../../../shared/components/Card'
import Badge from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { formatDate, formatDuration } from '../../../shared/utils/cn'
import { reportService } from '../../../lib/services'
import { ReportPdfDocument } from './ReportPdfDocument'
import type { Report } from '../../../shared/types'

interface ReportListItemProps {
  report: Report
  onMarkSent: (id: string) => void
  onDelete: (report: Report) => void
  isMarkingSent: boolean
  isDeleting: boolean
}

export function ReportListItem({
  report,
  onMarkSent,
  onDelete,
  isMarkingSent,
  isDeleting,
}: ReportListItemProps) {
  const queryClient = useQueryClient()
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownloadPdf() {
    setIsDownloading(true)
    try {
      const tasks = await queryClient.fetchQuery({
        queryKey: ['reports', report.id, 'tasks'],
        queryFn: () => reportService.getTasksForReport(report.id),
        staleTime: Infinity,
      })
      const blob = await pdf(
        <ReportPdfDocument report={report} tasks={tasks} />,
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-${report.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('No se pudo generar el PDF del reporte')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
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
              {report.taskCount} tarea{report.taskCount !== 1 ? 's' : ''}
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
                Enviado {formatDate(report.sentAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {report.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkSent(report.id)}
              isLoading={isMarkingSent}
              title="Marcar como enviado"
            >
              <Send size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isDownloading}
            title="Descargar PDF"
            aria-label="Descargar PDF"
          >
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(report)}
            className="text-red-400 hover:text-red-300"
            title="Eliminar reporte"
            isLoading={isDeleting}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  )
}
