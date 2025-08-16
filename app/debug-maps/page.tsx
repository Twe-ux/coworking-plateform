import { GoogleMapsDebug } from '@/components/debug/GoogleMapsDebug'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Debug Google Maps | Coworking Platform',
  description: 'Diagnostic de configuration Google Maps API',
  robots: 'noindex, nofollow'
}

export default function DebugMapsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <GoogleMapsDebug />
    </main>
  )
}