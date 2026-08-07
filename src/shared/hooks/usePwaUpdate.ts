import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

export function usePwaUpdate() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return

      setInterval(() => {
        registration.update().catch((error: unknown) => {
          console.error('No se pudo comprobar si hay una nueva versión', error)
        })
      }, UPDATE_CHECK_INTERVAL_MS)
    },
  })

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
