'use client'

import { openCookieBanner } from '@/lib/cookie-utils'

export function CookieButton() {
  const handleClick = () => {
    openCookieBanner()
  }

  return (
    <button 
      onClick={handleClick}
      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
    >
      🍪 Gérer les cookies
    </button>
  )
}