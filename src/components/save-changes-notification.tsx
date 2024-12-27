'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Button } from './ui/button'

interface SaveChangesNotificationProps {
  show: boolean
  onSave: (e: React.FormEvent) => Promise<void>
  onReset: () => void
}

export function SaveChangesNotification({ show, onSave, onReset }: SaveChangesNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 rounded-full shadow-lg px-4 pr-2 py-2 flex items-center gap-4"
        >
          <div className="flex items-center gap-2 text-white">
            <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">Unsaved changes</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={onReset}
              className="text-white hover:text-red-400 rounded-full hover:bg-gray-800"
            >
              Reset
            </Button>
            <Button 
              onClick={onSave}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              Save
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 