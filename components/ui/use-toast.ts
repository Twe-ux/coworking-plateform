import * as React from 'react'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Simple toast implementation using browser notifications or console
export function useToast() {
  return {
    toast: ({ title, description, variant = 'default' }: ToastProps) => {
      const message = `${title || (variant === 'destructive' ? 'Erreur' : 'Succès')}${description ? `: ${description}` : ''}`

      if (variant === 'destructive') {
        console.error(message)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Erreur', { body: description || title })
        }
      } else {
        console.log(message)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Succès', { body: description || title })
        }
      }

      // Fallback: show alert for important errors
      if (variant === 'destructive') {
        alert(message)
      }
    },
  }
}
