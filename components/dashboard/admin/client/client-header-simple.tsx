'use client'

import { Coffee } from 'lucide-react'

export function ClientHeaderSimple() {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-coffee-primary" />
          <span className="font-semibold text-coffee-primary">Cow or King Café</span>
        </div>
        <div className="text-sm text-gray-600">Dashboard Client</div>
      </div>
    </header>
  )
}