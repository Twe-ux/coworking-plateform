// Simple in-memory cache pour réduire les appels MongoDB
const cache = new Map<string, { data: any, timestamp: number }>()

export function getCached(key: string, ttlMs: number = 10000): any {
  const cached = cache.get(key)
  if (!cached) return null
  
  const isExpired = Date.now() - cached.timestamp > ttlMs
  if (isExpired) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

export function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }
  
  // Supprimer les clés qui matchent le pattern
  for (const key of Array.from(cache.keys())) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// Nettoyer le cache périodiquement
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of Array.from(cache.entries())) {
    // Supprimer les entrées de plus de 30 secondes
    if (now - value.timestamp > 30000) {
      cache.delete(key)
    }
  }
}, 30000)