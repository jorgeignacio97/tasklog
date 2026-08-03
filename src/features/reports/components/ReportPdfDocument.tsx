import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { formatDate, formatDuration } from '../../../shared/utils/cn'
import { badgeLabels } from '../../../shared/lib/labels'
import type { Report, Task } from '../../../shared/types'

type ReportPdfDocumentProps = {
  report: Report
  tasks: Task[]
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: '#18181b',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#52525b',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #d4d4d8',
  },
  summaryItem: {
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#71717a',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 700,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: '1px solid #e4e4e7',
  },
  headerCell: {
    fontSize: 9,
    fontWeight: 700,
    color: '#3f3f46',
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 10,
  },
  colTitle: { width: '46%' },
  colCategory: { width: '18%' },
  colStatus: { width: '18%' },
  colDuration: { width: '18%', textAlign: 'right' },
  emptyState: {
    fontSize: 10,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 24,
  },
})

export function ReportPdfDocument({ report, tasks }: ReportPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de tareas</Text>
        <Text style={styles.subtitle}>
          {formatDate(report.startDate)} - {formatDate(report.endDate)}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Estado</Text>
            <Text style={styles.summaryValue}>
              {badgeLabels[report.status]}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tareas</Text>
            <Text style={styles.summaryValue}>{report.taskCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Horas totales</Text>
            <Text style={styles.summaryValue}>
              {formatDuration(report.totalHours)}
            </Text>
          </View>
        </View>

        {tasks.length === 0 ? (
          <Text style={styles.emptyState}>Este reporte no tiene tareas.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.colTitle]}>Tarea</Text>
              <Text style={[styles.headerCell, styles.colCategory]}>
                Categoría
              </Text>
              <Text style={[styles.headerCell, styles.colStatus]}>Estado</Text>
              <Text style={[styles.headerCell, styles.colDuration]}>
                Duración
              </Text>
            </View>
            {tasks.map((task) => (
              <View key={task.id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.colTitle]}>{task.title}</Text>
                <Text style={[styles.cell, styles.colCategory]}>
                  {badgeLabels[task.category]}
                </Text>
                <Text style={[styles.cell, styles.colStatus]}>
                  {badgeLabels[task.status]}
                </Text>
                <Text style={[styles.cell, styles.colDuration]}>
                  {formatDuration(task.estimatedDuration)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
