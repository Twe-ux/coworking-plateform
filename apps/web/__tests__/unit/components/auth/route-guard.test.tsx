/**
 * Tests unitaires pour le composant RouteGuard
 * Teste la protection des routes et les redirections basées sur les rôles
 */

import { screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/route-guard'
import { UserRole } from '@/types/auth'
import { 
  renderWithAuth, 
  createMockRouter, 
  createTestSession,
  mockUseSession,
  authAssertions 
} from '../../../utils/test-helpers'

// Mock des modules
jest.mock('next/navigation')

// Composant de test simple
const TestComponent = () => <div data-testid="protected-content">Contenu protégé</div>

describe('RouteGuard', () => {
  const mockPush = jest.fn()
  const mockRouter = createMockRouter({ push: mockPush })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Protection d\'authentification', () => {
    it('devrait afficher le contenu pour un utilisateur authentifié', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('devrait rediriger vers login pour un utilisateur non authentifié', async () => {
      mockUseSession(null, 'unauthenticated')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('ne devrait pas rediriger pendant le chargement', () => {
      mockUseSession(null, 'loading')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('devrait afficher un loader pendant le chargement', () => {
      mockUseSession(null, 'loading')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/chargement/i)).toBeInTheDocument()
    })

    it('devrait rediriger un utilisateur inactif', async () => {
      const session = createTestSession('inactive')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })
  })

  describe('Protection par rôle', () => {
    it('devrait autoriser l\'accès pour un rôle exact', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('devrait autoriser l\'accès pour un rôle hiérarchique supérieur', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredRole={UserRole.CLIENT}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('devrait refuser l\'accès pour un rôle insuffisant', async () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
      })

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('devrait rediriger vers le dashboard approprié selon le rôle', async () => {
      const session = createTestSession('manager')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/manager')
      })
    })
  })

  describe('Protection par permission', () => {
    it('devrait autoriser l\'accès avec la bonne permission', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredPermission="admin:read">
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('devrait refuser l\'accès sans la permission requise', async () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredPermission="admin:write">
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
      })

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('devrait gérer les permissions multiples', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredPermissions={['admin:read', 'admin:write']}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('devrait refuser l\'accès si une permission manque', async () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredPermissions={['bookings:own', 'admin:read']}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
      })
    })
  })

  describe('Combinaison rôle et permission', () => {
    it('devrait autoriser l\'accès avec rôle ET permission valides', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN} 
          requiredPermission="admin:read"
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('devrait refuser l\'accès si le rôle est valide mais pas la permission', async () => {
      const session = createTestSession('manager')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.MANAGER} 
          requiredPermission="admin:write"
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/manager')
      })
    })
  })

  describe('Redirection personnalisée', () => {
    it('devrait utiliser la redirection personnalisée pour les utilisateurs non autorisés', async () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          fallbackPath="/custom-error"
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-error')
      })
    })

    it('devrait utiliser la redirection personnalisée pour les non-authentifiés', async () => {
      mockUseSession(null, 'unauthenticated')

      renderWithAuth(
        <RouteGuard fallbackPath="/custom-login">
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login')
      })
    })
  })

  describe('Affichage conditionnel', () => {
    it('devrait masquer le contenu au lieu de rediriger si hideOnFailure est true', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          hideOnFailure={true}
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('devrait afficher un message d\'erreur personnalisé si fourni', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const customErrorMessage = 'Accès refusé pour cette section'

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          hideOnFailure={true}
          errorMessage={customErrorMessage}
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByText(customErrorMessage)).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('devrait afficher un message d\'erreur par défaut', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          hideOnFailure={true}
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByText(/vous n'avez pas les autorisations nécessaires/i)).toBeInTheDocument()
    })
  })

  describe('Mode développement', () => {
    it('devrait autoriser l\'accès en mode développement même sans permissions', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          allowInDevelopment={true}
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('ne devrait pas autoriser l\'accès en production même avec allowInDevelopment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          allowInDevelopment={true}
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
      })

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de session', () => {
      // Simuler une session corrompue
      const brokenSession = { ...createTestSession('client'), user: null }
      mockUseSession(brokenSession, 'authenticated')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session: brokenSession }
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('devrait gérer les rôles invalides', async () => {
      const session = { 
        ...createTestSession('client'), 
        user: { ...createTestSession('client').user!, role: 'INVALID_ROLE' as UserRole }
      }
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir un rôle approprié pour le loader', () => {
      mockUseSession(null, 'loading')

      renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      const loader = screen.getByRole('status')
      expect(loader).toHaveAttribute('aria-label', 'Chargement')
    })

    it('devrait annoncer les erreurs d\'autorisation aux lecteurs d\'écran', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard 
          requiredRole={UserRole.ADMIN}
          hideOnFailure={true}
        >
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      const errorMessage = screen.getByText(/vous n'avez pas les autorisations nécessaires/i)
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })
  })

  describe('Performance', () => {
    it('ne devrait pas rediriger plusieurs fois', async () => {
      mockUseSession(null, 'unauthenticated')

      const { rerender } = renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1)
      })

      // Re-render le composant
      rerender(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>
      )

      // Ne devrait pas rediriger à nouveau
      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration avec les assertions personnalisées', () => {
    it('devrait passer les assertions d\'authentification', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      const { container } = renderWithAuth(
        <RouteGuard>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      authAssertions.toBeAuthenticated(container)
    })

    it('devrait échouer aux assertions d\'authentification pour les non-connectés', () => {
      mockUseSession(null, 'unauthenticated')

      const { container } = renderWithAuth(
        <RouteGuard hideOnFailure={true}>
          <TestComponent />
        </RouteGuard>,
        { session: null }
      )

      expect(() => authAssertions.toBeAuthenticated(container)).toThrow()
    })

    it('devrait vérifier les redirections avec les assertions', async () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(
        <RouteGuard requiredRole={UserRole.ADMIN}>
          <TestComponent />
        </RouteGuard>,
        { session }
      )

      await waitFor(() => {
        authAssertions.toHaveRedirectedTo(mockPush, '/dashboard/client')
      })
    })
  })
})