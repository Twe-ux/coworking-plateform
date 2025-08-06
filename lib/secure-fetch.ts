/**
 * Utilitaire pour les requêtes HTTP sécurisées
 * Gestion automatique des tokens CSRF et headers de sécurité
 */

'use client'

import { getSession } from 'next-auth/react'

interface SecureFetchOptions extends RequestInit {
  requireAuth?: boolean
  includeCsrf?: boolean
  timeout?: number
}

interface SecureFetchResponse<T = any> {
  data?: T
  error?: string
  status: number
  ok: boolean
}

/**
 * Fonction fetch sécurisée avec gestion automatique de l'authentification et CSRF
 */
export async function secureFetch<T = any>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<SecureFetchResponse<T>> {
  const {
    requireAuth = true,
    includeCsrf = true,
    timeout = 10000,
    headers = {},
    ...fetchOptions
  } = options

  try {
    // Vérifier l'authentification si requise
    if (requireAuth) {
      const session = await getSession()
      if (!session) {
        return {
          status: 401,
          ok: false,
          error: 'Non authentifié',
        }
      }
    }

    // Préparer les headers sécurisés
    const secureHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    }

    // Ajouter le token CSRF pour les requêtes de modification
    if (
      includeCsrf &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        fetchOptions.method?.toUpperCase() || 'GET'
      )
    ) {
      const csrfToken = await getCSRFToken()
      if (csrfToken) {
        secureHeaders['X-CSRF-Token'] = csrfToken
      }
    }

    // Ajouter des headers de sécurité supplémentaires
    secureHeaders['X-Requested-With'] = 'XMLHttpRequest'

    // Créer un AbortController pour le timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Effectuer la requête
    const response = await fetch(url, {
      ...fetchOptions,
      headers: secureHeaders,
      signal: controller.signal,
      credentials: 'same-origin', // Inclure les cookies de session
    })

    clearTimeout(timeoutId)

    // Traiter la réponse
    let data: T | undefined
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else if (contentType?.includes('text/')) {
      data = (await response.text()) as any
    }

    if (!response.ok) {
      return {
        status: response.status,
        ok: false,
        error:
          (data as any)?.error ||
          (data as any)?.message ||
          `Erreur HTTP ${response.status}`,
        data,
      }
    }

    return {
      status: response.status,
      ok: true,
      data,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          status: 408,
          ok: false,
          error: 'Timeout de la requête',
        }
      }

      return {
        status: 0,
        ok: false,
        error: error.message,
      }
    }

    return {
      status: 0,
      ok: false,
      error: 'Erreur inconnue',
    }
  }
}

/**
 * Récupère le token CSRF depuis le serveur ou le cache
 */
let csrfTokenCache: { token: string; expires: number } | null = null

async function getCSRFToken(): Promise<string | null> {
  try {
    // Vérifier le cache
    if (csrfTokenCache && csrfTokenCache.expires > Date.now()) {
      return csrfTokenCache.token
    }

    // Essayer de récupérer depuis les meta tags
    const metaCSRF = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content')
    if (metaCSRF) {
      csrfTokenCache = {
        token: metaCSRF,
        expires: Date.now() + 60 * 60 * 1000, // 1 heure
      }
      return metaCSRF
    }

    // Récupérer depuis l'API
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (response.ok) {
      const data = await response.json()
      csrfTokenCache = {
        token: data.csrfToken,
        expires: Date.now() + 60 * 60 * 1000, // 1 heure
      }
      return data.csrfToken
    }

    return null
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error)
    return null
  }
}

/**
 * Méthodes HTTP sécurisées pré-configurées
 */
export const secureApi = {
  get: <T = any>(url: string, options?: Omit<SecureFetchOptions, 'method'>) =>
    secureFetch<T>(url, { ...options, method: 'GET', includeCsrf: false }),

  post: <T = any>(
    url: string,
    data?: any,
    options?: Omit<SecureFetchOptions, 'method' | 'body'>
  ) =>
    secureFetch<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(
    url: string,
    data?: any,
    options?: Omit<SecureFetchOptions, 'method' | 'body'>
  ) =>
    secureFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(
    url: string,
    data?: any,
    options?: Omit<SecureFetchOptions, 'method' | 'body'>
  ) =>
    secureFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(
    url: string,
    options?: Omit<SecureFetchOptions, 'method'>
  ) => secureFetch<T>(url, { ...options, method: 'DELETE' }),
}

/**
 * Hook React pour les requêtes sécurisées
 */
import { useCallback, useEffect, useState } from 'react'

interface UseSecureFetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSecureFetch<T = any>(
  url: string | null,
  options?: SecureFetchOptions
): UseSecureFetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!url) return

    setLoading(true)
    setError(null)

    try {
      const response = await secureFetch<T>(url, options)

      if (response.ok) {
        setData(response.data || null)
      } else {
        setError(response.error || 'Erreur inconnue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [url, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

/**
 * Utilitaire pour invalider le cache CSRF
 */
export function invalidateCSRFToken(): void {
  csrfTokenCache = null
}
