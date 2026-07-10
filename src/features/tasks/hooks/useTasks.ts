import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService } from '../services/task.service.impl'
import type { Task, TaskCategory } from '../../../shared/types'
import type { CreateTaskInput, UpdateTaskInput } from '../services/task.service'

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll(),
    staleTime: Infinity,
  })
}

export function useTask(id: string | undefined) {
  return useQuery<Task | undefined>({
    queryKey: ['tasks', id],
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created')
    },
    onError: () => {
      toast.error('Failed to create task')
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      taskService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated')
    },
    onError: () => {
      toast.error('Failed to update task')
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })
}

export function useTasksByCategory(category: TaskCategory) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'category', category],
    queryFn: () => taskService.getByCategory(category),
    staleTime: Infinity,
  })
}
