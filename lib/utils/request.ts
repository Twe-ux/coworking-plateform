import { NextRequest } from 'next/server'

/**
 * Utilitaire pour récupérer les paramètres de recherche de manière sécurisée
 */
export function getSearchParams(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    return searchParams
  } catch {
    return new URLSearchParams()
  }
}

/**
 * Récupère un paramètre de recherche avec une valeur par défaut
 */
export function getSearchParam(request: NextRequest, key: string, defaultValue = ''): string {
  const searchParams = getSearchParams(request)
  return searchParams.get(key) || defaultValue
}

/**
 * Récupère un paramètre de recherche en tant que nombre
 */
export function getSearchParamAsNumber(request: NextRequest, key: string, defaultValue = 0): number {
  const value = getSearchParam(request, key)
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Récupère un paramètre de recherche en tant que booléen
 */
export function getSearchParamAsBoolean(request: NextRequest, key: string, defaultValue = false): boolean {
  const value = getSearchParam(request, key).toLowerCase()
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return defaultValue
}