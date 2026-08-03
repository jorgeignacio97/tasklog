import { TaskServiceImpl } from '../features/tasks/services/task.service.impl'
import { ReportServiceImpl } from '../features/reports/services/report.service.impl'
import { BackupServiceImpl } from '../features/backup/services/backup.service.impl'
import type { TaskService } from '../features/tasks/services/task.service'
import type { ReportService } from '../features/reports/services/report.service'
import type { BackupService } from '../features/backup/services/backup.service'

export const taskService: TaskService = new TaskServiceImpl()
export const reportService: ReportService = new ReportServiceImpl()
export const backupService: BackupService = new BackupServiceImpl()
