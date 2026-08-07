import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService } from '../../../lib/services'
import type { Task } from '../../../shared/types'
import type { CreateTaskInput, UpdateTaskInput } from '../services/task.service'

export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => ['tasks', id] as const,
  unreported: (start: string, end: string) =>
    ['tasks', 'unreported', start, end] as const,
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: taskKeys.all,
    queryFn: () => taskService.getAll(),
    staleTime: Infinity,
  })
}

export function useTask(id: string | undefined) {
  return useQuery<Task | undefined>({
    queryKey: taskKeys.detail(id ?? ''),
    queryFn: () => taskService.getById(id!),
    staleTime: Infinity,
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskInput) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      toast.success('Tarea creada')
    },
    onError: (error) => {
      console.error('No se pudo crear la tarea', error)
      toast.error('No se pudo crear la tarea')
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      taskService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      toast.success('Tarea actualizada')
    },
    onError: (error) => {
      console.error('No se pudo actualizar la tarea', error)
      toast.error('No se pudo actualizar la tarea')
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      toast.success('Tarea eliminada')
    },
    onError: (error) => {
      console.error('No se pudo eliminar la tarea', error)
      toast.error('No se pudo eliminar la tarea')
    },
  })
}
