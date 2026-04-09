import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  useRegisterSW({
    onRegistered(r) {
      // Check for SW updates every 30 seconds
      if (r) {
        setInterval(() => r.update(), 30 * 1000)
      }
    },
    onNeedRefresh() {
      // autoUpdate mode: the new SW already called skipWaiting,
      // so just reload to pick up the new assets
      window.location.reload()
    },
  })

  // Nothing to render — updates happen silently
  return null
}
