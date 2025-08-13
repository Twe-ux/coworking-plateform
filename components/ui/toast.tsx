'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export interface ToastContextType {
  toasts: ToastProps[]
  toast: (toast: Omit<ToastProps, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastVariants = {
  default: 'border bg-background text-foreground',
  destructive:
    'destructive border-destructive bg-destructive text-destructive-foreground',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const toastIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

function Toast({
  id,
  title,
  description,
  variant = 'default',
  onClose,
}: ToastProps) {
  const Icon = toastIcons[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 shadow-lg transition-all hover:shadow-xl',
        toastVariants[variant]
      )}
    >
      <div className="flex items-start space-x-2">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-foreground/50 hover:text-foreground absolute top-1 right-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:ring-1 focus:outline-none"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((newToast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const toastWithId = { ...newToast, id }

    setToasts((prevToasts) => [...prevToasts, toastWithId])

    // Auto dismiss after duration (default 5 seconds)
    const duration = newToast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed right-0 bottom-0 z-50 flex max-w-[420px] flex-col-reverse p-4 sm:right-4 sm:bottom-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div key={toast.id} layout className="mb-2">
              <Toast {...toast} onClose={() => dismiss(toast.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
