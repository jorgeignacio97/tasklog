import { useRef, useState, type ChangeEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../../shared/components/Card'
import Modal from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { backupService } from '../../../lib/services'
import { taskKeys } from '../../tasks'
import { reportKeys } from '../../reports'

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export default function BackupPanel() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await backupService.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `tasklog-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Datos exportados')
    } catch (error) {
      console.error('No se pudieron exportar los datos', error)
      toast.error('No se pudieron exportar los datos')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      toast.error(
        'El archivo es demasiado grande (máximo 10MB). Verificá que sea un backup válido de TaskLog.',
      )
      return
    }
    setPendingFile(file)
  }

  const handleCancelImport = () => {
    if (isImporting) return
    setPendingFile(null)
  }

  const handleConfirmImport = async () => {
    if (!pendingFile) return

    setIsImporting(true)
    try {
      const text = await readFileAsText(pendingFile)
      const parsed = JSON.parse(text)
      await backupService.importData(parsed)

      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      queryClient.invalidateQueries({ queryKey: reportKeys.all })

      toast.success('Datos importados')
      setPendingFile(null)
    } catch (error) {
      console.error('No se pudo importar el archivo de backup', error)
      toast.error(
        'No se pudo importar el archivo. Tus datos actuales no se modificaron.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">
        Configuración
      </h1>

      <Card>
        <h2 className="text-sm font-medium text-zinc-300 mb-1">
          Copia de seguridad
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Tus datos viven solo en este navegador. Exportalos para tener una
          copia de respaldo o para llevarlos a otro dispositivo.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download size={16} />
            Exportar datos
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Importar datos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            aria-label="Importar archivo de backup"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </Card>

      <Modal
        isOpen={pendingFile !== null}
        onClose={handleCancelImport}
        title="Importar datos"
      >
        <p className="text-sm text-zinc-400 mb-4">
          Esto reemplazará todos los datos actuales. Esta acción no se puede
          deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleCancelImport}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmImport}
            isLoading={isImporting}
          >
            Reemplazar datos
          </Button>
        </div>
      </Modal>
    </div>
  )
}
