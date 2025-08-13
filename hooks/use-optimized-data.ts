'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface UseOptimizedDataOptions<T> {
  fetcher: () => Promise<T>
  dependencies: any[]
  cacheTime?: number
  staleTime?: number
  onError?: (error: Error) => void
}

export function useOptimizedData<T>({
  fetcher,
  dependencies,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 1 * 60 * 1000, // 1 minute
  onError,
}: UseOptimizedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(
    new Map()
  )
  const lastFetchRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cacheKey = useMemo(() => {
    return JSON.stringify(dependencies)
  }, dependencies)

  const loadData = useCallback(async () => {
    const now = Date.now()

    // Vérifier le cache
    const cached = cacheRef.current.get(cacheKey)
    if (cached && now - cached.timestamp < staleTime) {
      setData(cached.data)
      setLoading(false)
      return
    }

    // Éviter les requêtes multiples
    if (now - lastFetchRef.current < 100) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Annuler la requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      lastFetchRef.current = now

      const result = await fetcher()

      // Mettre en cache
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: now,
      })

      // Nettoyer le cache ancien
      cacheRef.current.forEach((value, key) => {
        if (now - value.timestamp > cacheTime) {
          cacheRef.current.delete(key)
        }
      })

      setData(result)
    } catch (err) {
      const error = err as Error
      if (error.name !== 'AbortError') {
        setError(error)
        onError?.(error)
      }
    } finally {
      setLoading(false)
    }
  }, [fetcher, cacheKey, staleTime, cacheTime, onError])

  const refresh = useCallback(() => {
    cacheRef.current.delete(cacheKey)
    loadData()
  }, [cacheKey, loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Nettoyage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    isStale: useMemo(() => {
      const cached = cacheRef.current.get(cacheKey)
      return cached ? Date.now() - cached.timestamp > staleTime : true
    }, [cacheKey, staleTime]),
  }
}

// Hook pour debouncer les valeurs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Hook pour throttle les fonctions
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastRan = useRef<number>(0)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastRan.current >= delay) {
        func(...args)
        lastRan.current = now
      }
    }) as T,
    [func, delay]
  )
}
