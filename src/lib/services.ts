// Composition root: wires concrete service implementations to the
// interfaces each feature exposes. Imports the impl classes by direct path
// rather than through the feature barrels — those barrels also export UI
// components that import from this very file (via feature hooks), so
// routing the class imports through the barrel would create a circular
// module dependency. Type-only imports are erased at compile time and are
// safe to take from the barrels.
import { TaskServiceImpl } from '../features/tasks/services/task.service.impl'
import { ReportServiceImpl } from '../features/reports/services/report.service.impl'
import { BackupServiceImpl } from '../features/backup/services/backup.service.impl'
import type { TaskService } from '../features/tasks'
import type { ReportService } from '../features/reports'
import type { BackupService } from '../features/backup'

export const taskService: TaskService = new TaskServiceImpl()
export const reportService: ReportService = new ReportServiceImpl()
export const backupService: BackupService = new BackupServiceImpl()
