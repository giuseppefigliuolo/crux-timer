import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'
import { RADIUS, SHADOW } from '../../styles/tokens'

export default function ReloadPrompt() {
  const [updating, setUpdating] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        registration.update()
      }, 60_000)
    },
  })

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await updateServiceWorker(true)
    } catch {
      window.location.reload()
    }
    // If the page hasn't reloaded after 3s, force a reload
    setTimeout(() => window.location.reload(), 3000)
  }

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-100 max-w-lg mx-auto"
        >
          <div
            className="bg-surface-elevated border-[3px] border-[#3A1248] p-4 flex items-center gap-3"
            style={{ borderRadius: RADIUS.card, boxShadow: SHADOW.lg }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Nuova versione disponibile</p>
              <p className="text-xs text-text-secondary">Aggiorna per ottenere le ultime modifiche</p>
            </div>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="px-4 py-2 bg-accent text-bg text-sm font-bold border-[2.5px] border-[#3A1248] shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60"
              style={{ borderRadius: RADIUS.btnSm, boxShadow: SHADOW.sm }}
            >
              {updating ? 'Aggiornando…' : 'Aggiorna'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
