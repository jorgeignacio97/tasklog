import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService, reportService } from '../../../lib/services'
import type { Task, Report } from '../../../shared/types'
import type { CreateReportInput, UpdateReportInput } from '../services/report.service'

export function useReports() {
  return useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: () => reportService.getAll(),
    staleTime: Infinity,
  })
}

export function useReport(id: string | undefined) {
  return useQuery<Report | undefined>({
    queryKey: ['reports', id],
    queryFn: () => reportService.getById(id!),
    staleTime: Infinity,
    enabled: !!id,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateReportInput & { taskIds?: string[] }) => {
      const { taskIds, ...reportData } = data
      const report = await reportService.create(reportData)

      // Link tasks to this report so they are marked as reported
      if (taskIds && taskIds.length > 0) {
        await Promise.all(
          taskIds.map((id) =>
            taskService.update(id, { reportedInReportId: report.id }),
          ),
        )
      }

      return report
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Reporte creado')
    },
    onError: () => {
      toast.error('No se pudo crear el reporte')
    },
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportInput }) =>
      reportService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reports', id] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Reporte actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el reporte')
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Reporte eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el reporte')
    },
  })
}

export function useUnreportedTasks(
  startDate: string | undefined,
  endDate: string | undefined,
) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'unreported', startDate, endDate],
    queryFn: () => taskService.getUnreportedInRange(startDate!, endDate!),
    staleTime: Infinity,
    enabled: !!startDate && !!endDate,
  })
}
