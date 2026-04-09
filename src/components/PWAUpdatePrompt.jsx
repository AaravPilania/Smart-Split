import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds while app is open
      if (r) {
        setInterval(() => r.update(), 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-white dark:bg-neutral-900 border border-pink-200 dark:border-pink-900 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4">
        <div className="text-2xl">🎉</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">Update available</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Tap to get the latest version.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-2 py-1"
          >
            Later
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs font-semibold text-white bg-[#e52d96] hover:bg-[#c9257f] rounded-lg px-3 py-1.5 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}
