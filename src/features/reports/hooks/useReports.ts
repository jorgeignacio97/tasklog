import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService, reportService } from '../../../lib/services'
import { taskKeys } from '../../tasks'
import type { Task, Report } from '../../../shared/types'
import type {
  CreateReportInput,
  UpdateReportInput,
} from '../services/report.service'

export const reportKeys = {
  all: ['reports'] as const,
  detail: (id: string) => ['reports', id] as const,
  tasks: (id: string) => ['reports', id, 'tasks'] as const,
}

export function useReports() {
  return useQuery<Report[]>({
    queryKey: reportKeys.all,
    queryFn: () => reportService.getAll(),
    staleTime: Infinity,
  })
}

export function useReport(id: string | undefined) {
  return useQuery<Report | undefined>({
    queryKey: reportKeys.detail(id ?? ''),
    queryFn: () => reportService.getById(id!),
    staleTime: Infinity,
    enabled: !!id,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      taskIds,
      ...reportData
    }: CreateReportInput & { taskIds?: string[] }) =>
      reportService.createWithTaskLinks(reportData, taskIds ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      toast.success('Reporte creado')
    },
    onError: (error) => {
      console.error('No se pudo crear el reporte', error)
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
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
      toast.success('Reporte actualizado')
    },
    onError: (error) => {
      console.error('No se pudo actualizar el reporte', error)
      toast.error('No se pudo actualizar el reporte')
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      toast.success('Reporte eliminado')
    },
    onError: (error) => {
      console.error('No se pudo eliminar el reporte', error)
      toast.error('No se pudo eliminar el reporte')
    },
  })
}

export function useUnreportedTasks(
  startDate: string | undefined,
  endDate: string | undefined,
) {
  return useQuery<Task[]>({
    queryKey: taskKeys.unreported(startDate ?? '', endDate ?? ''),
    queryFn: () => taskService.getUnreportedInRange(startDate!, endDate!),
    staleTime: Infinity,
    enabled: !!startDate && !!endDate,
  })
}
