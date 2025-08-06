/**
 * Utilitaires de test pour React Testing Library
 * Wrappers personnalisés et helpers pour les tests
 */

import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/ui/toast'
import { MockSessionProvider, createMockSession } from '../mocks/next-auth'

// Interface pour les options de rendu personnalisées
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
  initialEntries?: string[]
}

// Wrapper personnalisé avec tous les providers nécessaires
function AllTheProviders({
  children,
  session = null,
}: {
  children: ReactNode
  session?: any
}) {
  return (
    <MockSessionProvider session={session}>
      <ToastProvider>{children}</ToastProvider>
    </MockSessionProvider>
  )
}

// Fonction de rendu personnalisée
const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { session, ...renderOptions } = options || {}

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllTheProviders session={session}>{children}</AllTheProviders>
  )

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Helpers pour renderiser avec différents états d'authentification
export const renderWithAuth = (
  ui: ReactElement,
  user = global.testUser.client
) => {
  return customRender(ui, { session: createMockSession({ user }) })
}

export const renderWithoutAuth = (ui: ReactElement) => {
  return customRender(ui, { session: null })
}

export const renderWithRole = (
  ui: ReactElement,
  role: keyof typeof global.testUser
) => {
  return customRender(ui, {
    session: createMockSession({ user: global.testUser[role] }),
  })
}

// Helper pour attendre que les éléments async se chargent
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Helper pour simuler les erreurs de réseau
export const mockNetworkError = () => {
  const originalFetch = global.fetch
  global.fetch = vi.fn(() => Promise.reject(new Error('Network Error')))
  return () => {
    global.fetch = originalFetch
  }
}

// Helper pour vérifier la redirection
export const expectRedirect = async (path: string) => {
  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith(path)
  })
}

// Helper pour tester l'accessibilité
export const checkA11y = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = await import('jest-axe')
  expect.extend(toHaveNoViolations)

  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

// Matchers personnalisés pour les tests
export const customMatchers = {
  toBeDisabled: (received: Element) => {
    const pass =
      received.hasAttribute('disabled') ||
      received.getAttribute('aria-disabled') === 'true'
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be disabled`
          : `Expected element to be disabled`,
    }
  },

  toHaveRole: (received: Element, expectedRole: string) => {
    const actualRole = received.getAttribute('role')
    const pass = actualRole === expectedRole
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have role "${expectedRole}"`
          : `Expected element to have role "${expectedRole}", but got "${actualRole}"`,
    }
  },
}

// Re-export tout ce dont on a besoin
export * from '@testing-library/react'
export { customRender as render }
export { userEvent }

// Import des mocks pour faciliter l'utilisation
import {
  mockRouter,
  setMockPathname,
  setMockSearchParams,
} from '../mocks/next-router'
import { userSessions } from '../mocks/next-auth'
import { vi, waitFor } from 'vitest'

export {
  mockRouter,
  setMockPathname,
  setMockSearchParams,
  userSessions,
  vi,
  waitFor,
}
