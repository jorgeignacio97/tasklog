import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePwaUpdate() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) return

    toast('Nueva versión disponible', {
      description: 'Actualiza para obtener los últimos cambios.',
      action: {
        label: 'Actualizar',
        onClick: () => updateServiceWorker(true),
      },
      duration: Infinity,
    })
  }, [needRefresh, updateServiceWorker])

  useEffect(() => {
    if (!offlineReady) return

    toast.success('TaskLog está listo para funcionar sin conexión')
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])
}
