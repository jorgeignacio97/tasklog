import { ReportPdfDocument } from './ReportPdfDocument'
import { formatDate, formatDuration } from '../../../shared/utils/format'
import { badgeLabels } from '../../../shared/lib/labels'
import type { Report, Task } from '../../../shared/types'

/**
 * ReportPdfDocument is a plain function component built from
 * @react-pdf/renderer's own primitives (Document/Page/View/Text/StyleSheet) —
 * NOT rendered through ReactDOM or jsdom. Calling it directly as a function
 * (not via JSX/ReactDOM) returns a plain React-element tree we can walk via
 * `.props.children`, without needing an actual PDF renderer. @react-pdf/renderer
 * is intentionally NOT mocked here — we want the real element tree.
 */

function flattenChildren(node: unknown): unknown[] {
  if (Array.isArray(node)) return node.flatMap(flattenChildren)
  if (node === null || node === undefined || typeof node === 'boolean')
    return []
  return [node]
}

function collectText(node: unknown): string[] {
  if (node === null || node === undefined || typeof node === 'boolean')
    return []
  if (typeof node === 'string') return [node]
  if (typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectText)
  if (
    typeof node === 'object' &&
    'props' in (node as Record<string, unknown>)
  ) {
    const props = (node as { props?: { children?: unknown } }).props
    return collectText(props?.children)
  }
  return []
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r-1',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'sent',
    taskCount: 2,
    totalHours: 2,
    createdAt: '2026-07-31T12:00:00.000Z',
    updatedAt: '2026-07-31T12:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Diseñar login',
    category: 'frontend',
    status: 'completada',
    estimatedDuration: 1.5,
    notes: [],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('ReportPdfDocument (RPD-1)', () => {
  it('RPD-1 Happy: renders the header with date range, status, task count and total hours', () => {
    const report = makeReport()
    const tasks = [
      makeTask(),
      makeTask({
        id: 't-2',
        title: 'Arreglar bug de pagos',
        category: 'bug',
        status: 'pendiente',
        estimatedDuration: 0.5,
      }),
    ]

    const documentEl = ReportPdfDocument({ report, tasks }) as {
      props: { children: unknown }
    }
    const pageEl = documentEl.props.children as { props: { children: unknown } }
    const pageChildren = flattenChildren(pageEl.props.children) as Array<{
      props: { children: unknown }
    }>

    // [0] title, [1] subtitle, [2] summary row, [3] table
    expect(pageChildren).toHaveLength(4)

    const titleText = collectText(pageChildren[0]).join('')
    expect(titleText).toBe('Reporte de tareas')

    const subtitleText = collectText(pageChildren[1]).join('')
    expect(subtitleText).toBe(
      `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
    )

    const summaryItems = flattenChildren(
      pageChildren[2].props.children,
    ) as Array<{
      props: { children: unknown }
    }>
    expect(summaryItems).toHaveLength(3)

    expect(collectText(summaryItems[0])).toEqual([
      'Estado',
      badgeLabels[report.status],
    ])
    expect(collectText(summaryItems[1])).toEqual([
      'Tareas',
      String(report.taskCount),
    ])
    expect(collectText(summaryItems[2])).toEqual([
      'Horas totales',
      formatDuration(report.totalHours),
    ])
  })

  it('RPD-1 Happy: renders one table row per task with title, category label, status label and duration', () => {
    const report = makeReport()
    const taskA = makeTask()
    const taskB = makeTask({
      id: 't-2',
      title: 'Arreglar bug de pagos',
      category: 'bug',
      status: 'pendiente',
      estimatedDuration: 0.5,
    })
    const tasks = [taskA, taskB]

    const documentEl = ReportPdfDocument({ report, tasks }) as {
      props: { children: unknown }
    }
    const pageEl = documentEl.props.children as { props: { children: unknown } }
    const pageChildren = flattenChildren(pageEl.props.children) as Array<{
      props: { children: unknown }
    }>
    const tableEl = pageChildren[3]

    const tableChildren = flattenChildren(tableEl.props.children) as Array<{
      props: { children: unknown }
    }>
    // [0] header row, [1..] one row per task
    expect(tableChildren).toHaveLength(1 + tasks.length)

    const headerCells = flattenChildren(tableChildren[0].props.children)
    expect(headerCells.map((cell) => collectText(cell).join(''))).toEqual([
      'Tarea',
      'Categoría',
      'Estado',
      'Duración',
    ])

    const rowA = flattenChildren(tableChildren[1].props.children)
    expect(rowA.map((cell) => collectText(cell).join(''))).toEqual([
      taskA.title,
      badgeLabels[taskA.category],
      badgeLabels[taskA.status],
      formatDuration(taskA.estimatedDuration),
    ])

    const rowB = flattenChildren(tableChildren[2].props.children)
    expect(rowB.map((cell) => collectText(cell).join(''))).toEqual([
      taskB.title,
      badgeLabels[taskB.category],
      badgeLabels[taskB.status],
      formatDuration(taskB.estimatedDuration),
    ])
  })

  it('RPD-1 Edge: an empty task list renders the empty-state message instead of a table, without throwing', () => {
    const report = makeReport({ taskCount: 0, totalHours: 0 })

    let documentEl: { props: { children: unknown } }
    expect(() => {
      documentEl = ReportPdfDocument({ report, tasks: [] }) as {
        props: { children: unknown }
      }
    }).not.toThrow()

    const pageEl = documentEl!.props.children as {
      props: { children: unknown }
    }
    const pageChildren = flattenChildren(pageEl.props.children) as Array<{
      props: { children: unknown }
    }>
    const emptyStateOrTable = pageChildren[3]

    expect(collectText(emptyStateOrTable).join('')).toBe(
      'Este reporte no tiene tareas.',
    )
  })
})
