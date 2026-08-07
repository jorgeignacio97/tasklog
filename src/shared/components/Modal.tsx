import { type ReactNode, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return

    if (isOpen && !d.open) {
      d.showModal()
    } else if (!isOpen && d.open) {
      d.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      onCancel={() => onClose()}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      className="border-0 bg-transparent p-0 max-w-none max-h-none m-auto backdrop:bg-black/50"
    >
      <div className="w-full max-w-lg rounded-lg bg-zinc-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
