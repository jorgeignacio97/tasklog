import { TaskServiceImpl } from '../features/tasks/services/task.service.impl'
import { ReportServiceImpl } from '../features/reports/services/report.service.impl'
import type { TaskService } from '../features/tasks/services/task.service'
import type { ReportService } from '../features/reports/services/report.service'

export const taskService: TaskService = new TaskServiceImpl()
export const reportService: ReportService = new ReportServiceImpl()
