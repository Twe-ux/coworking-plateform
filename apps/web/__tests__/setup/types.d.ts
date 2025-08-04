/**
 * Types TypeScript pour les tests
 * Étend les types globaux pour les tests d'authentification
 */

declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toHaveAuthRedirect(): T
      toHaveCSRFToken(): T
      toHaveSecurityHeaders(): T
    }
  }
}

export {}