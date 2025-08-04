/**
 * Tests unitaires pour les composants de statut de sécurité
 * Teste SecurityStatus, SecurityIndicator et useSecurityStatus
 */

import { screen, render } from '@testing-library/react'
import { SecurityStatus, SecurityIndicator, useSecurityStatus } from '@/components/auth/security-status'
import { UserRole } from '@/types/auth'
import { 
  renderWithAuth, 
  createTestSession,
  mockUseSession,
  renderHook
} from '../../../utils/test-helpers'

// Hook de test pour useSecurityStatus
const TestSecurityStatusHook = () => {
  const status = useSecurityStatus()
  return (
    <div data-testid="security-status">
      <span data-testid="is-secure">{status.isSecure.toString()}</span>
      <span data-testid="has-csrf">{status.hasCSRF.toString()}</span>
      <span data-testid="is-active">{status.isActive.toString()}</span>
      <span data-testid="is-authenticated">{status.isAuthenticated.toString()}</span>
      <span data-testid="role">{status.role || 'none'}</span>
      <span data-testid="permissions">{status.permissions.join(',')}</span>
    </div>
  )
}

describe('SecurityStatus Component', () => {
  describe('Rendu de base', () => {
    it('ne devrait rien afficher pour un utilisateur non authentifié', () => {
      mockUseSession(null, 'unauthenticated')

      const { container } = renderWithAuth(<SecurityStatus />, { session: null })

      expect(container.firstChild).toBeNull()
    })

    it('devrait afficher le statut connecté pour un utilisateur authentifié', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      expect(screen.getByText('Connecté')).toBeInTheDocument()
      expect(screen.getByText('CLIENT')).toBeInTheDocument()
    })

    it('devrait afficher le badge de rôle avec la bonne couleur', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const roleBadge = screen.getByText('ADMIN').closest('div')
      expect(roleBadge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('devrait afficher l\'icône de statut connecté animée', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const statusDot = document.querySelector('.bg-green-500.animate-pulse')
      expect(statusDot).toBeInTheDocument()
    })
  })

  describe('Badges de rôles et icônes', () => {
    it('devrait afficher le bon badge et icône pour ADMIN', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const roleBadge = screen.getByText('ADMIN').closest('div')
      expect(roleBadge).toHaveClass('bg-red-100', 'text-red-800')
      expect(screen.getByText('👑')).toBeInTheDocument()
    })

    it('devrait afficher le bon badge et icône pour MANAGER', () => {
      const session = createTestSession('manager')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const roleBadge = screen.getByText('MANAGER').closest('div')
      expect(roleBadge).toHaveClass('bg-blue-100', 'text-blue-800')
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('devrait afficher le bon badge et icône pour STAFF', () => {
      const session = createTestSession('staff')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const roleBadge = screen.getByText('STAFF').closest('div')
      expect(roleBadge).toHaveClass('bg-green-100', 'text-green-800')
      expect(screen.getByText('👷')).toBeInTheDocument()
    })

    it('devrait afficher le bon badge et icône pour CLIENT', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const roleBadge = screen.getByText('CLIENT').closest('div')
      expect(roleBadge).toHaveClass('bg-gray-100', 'text-gray-800')
      expect(screen.getByText('👋')).toBeInTheDocument()
    })

    it('devrait gérer un rôle invalide avec un style par défaut', () => {
      const session = { 
        ...createTestSession('client'), 
        user: { 
          ...createTestSession('client').user!, 
          role: 'INVALID_ROLE' as UserRole 
        }
      }
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus />, { session })

      const roleBadge = screen.getByText('INVALID_ROLE').closest('div')
      expect(roleBadge).toHaveClass('bg-gray-100', 'text-gray-800')
      expect(screen.getByText('❓')).toBeInTheDocument()
    })
  })

  describe('Mode détails', () => {
    it('devrait afficher les détails quand showDetails est true', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      expect(screen.getByText('Utilisateur:')).toBeInTheDocument()
      expect(screen.getByText('Sécurité:')).toBeInTheDocument()
      expect(screen.getByText('Session active:')).toBeInTheDocument()
      expect(screen.getByText('Compte actif:')).toBeInTheDocument()
      expect(screen.getByText('Protection CSRF:')).toBeInTheDocument()
    })

    it('devrait afficher les informations utilisateur complètes', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      expect(screen.getByText(`${session.user!.firstName} ${session.user!.lastName}`)).toBeInTheDocument()
      expect(screen.getByText(session.user!.email)).toBeInTheDocument()
    })

    it('devrait afficher l\'état CSRF correctement', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      // CSRF token présent
      expect(screen.getAllByText('✅')).toHaveLength(3) // Session, compte actif, CSRF
    })

    it('devrait afficher CSRF manquant', () => {
      const session = { ...createTestSession('admin'), csrfToken: undefined }
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      // Devrait y avoir au moins un ❌ pour CSRF
      expect(screen.getByText('❌')).toBeInTheDocument()
    })

    it('devrait afficher l\'état d\'un compte inactif', () => {
      const session = createTestSession('inactive')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      expect(screen.getByText('❌')).toBeInTheDocument()
    })

    it('devrait afficher les permissions utilisateur', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      expect(screen.getByText('Permissions:')).toBeInTheDocument()
      expect(screen.getByText('admin:read')).toBeInTheDocument()
      expect(screen.getByText('admin:write')).toBeInTheDocument()
    })

    it('ne devrait pas afficher la section permissions si vide', () => {
      const session = { 
        ...createTestSession('client'), 
        user: { 
          ...createTestSession('client').user!, 
          permissions: [] 
        }
      }
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      expect(screen.queryByText('Permissions:')).not.toBeInTheDocument()
    })

    it('devrait afficher l\'indicateur CSRF dans l\'en-tête en mode détails', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityStatus showDetails={true} />, { session })

      // Vérifier qu'il y a un indicateur CSRF en haut
      const header = screen.getByText('Connecté').closest('div')?.parentElement
      expect(header).toHaveTextContent('CSRF: ✅')
    })
  })

  describe('Styles et classes CSS', () => {
    it('devrait appliquer les classes CSS personnalisées', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { container } = renderWithAuth(
        <SecurityStatus className="custom-class" />, 
        { session }
      )

      const rootDiv = container.firstElementChild
      expect(rootDiv).toHaveClass('custom-class')
      expect(rootDiv).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'border', 'p-4')
    })

    it('devrait avoir la structure CSS correcte', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { container } = renderWithAuth(<SecurityStatus />, { session })

      const rootDiv = container.firstElementChild
      expect(rootDiv).toHaveClass(
        'bg-white',
        'rounded-lg',
        'shadow-sm',
        'border',
        'p-4'
      )
    })
  })
})

describe('SecurityIndicator Component', () => {
  describe('États de chargement', () => {
    it('devrait afficher l\'état de chargement', () => {
      mockUseSession(null, 'loading')

      renderWithAuth(<SecurityIndicator />, { session: null })

      expect(screen.getByText('Chargement...')).toBeInTheDocument()
      
      const statusDot = document.querySelector('.bg-gray-400.animate-pulse')
      expect(statusDot).toBeInTheDocument()
    })
  })

  describe('États non authentifiés', () => {
    it('devrait afficher l\'état non connecté', () => {
      mockUseSession(null, 'unauthenticated')

      renderWithAuth(<SecurityIndicator />, { session: null })

      expect(screen.getByText('Non connecté')).toBeInTheDocument()
      
      const statusDot = document.querySelector('.bg-red-500')
      expect(statusDot).toBeInTheDocument()
      expect(statusDot).not.toHaveClass('animate-pulse')
    })
  })

  describe('États authentifiés', () => {
    it('devrait afficher l\'état sécurisé pour un utilisateur authentifié', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<SecurityIndicator />, { session })

      expect(screen.getByText('Sécurisé')).toBeInTheDocument()
      
      const statusDot = document.querySelector('.bg-green-500.animate-pulse')
      expect(statusDot).toBeInTheDocument()
    })
  })

  describe('Styles cohérents', () => {
    it('devrait avoir une structure CSS cohérente', () => {
      const session = createTestSession('client')
      mockUseSession(session, 'authenticated')

      const { container } = renderWithAuth(<SecurityIndicator />, { session })

      const wrapper = container.firstElementChild
      expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-2')
    })
  })
})

describe('useSecurityStatus Hook', () => {
  describe('Utilisateur non authentifié', () => {
    it('devrait retourner un statut non sécurisé', () => {
      mockUseSession(null, 'unauthenticated')

      renderWithAuth(<TestSecurityStatusHook />, { session: null })

      expect(screen.getByTestId('is-secure')).toHaveTextContent('false')
      expect(screen.getByTestId('has-csrf')).toHaveTextContent('false')
      expect(screen.getByTestId('is-active')).toHaveTextContent('false')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('role')).toHaveTextContent('none')
      expect(screen.getByTestId('permissions')).toHaveTextContent('')
    })
  })

  describe('Utilisateur authentifié', () => {
    it('devrait retourner un statut sécurisé complet', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<TestSecurityStatusHook />, { session })

      expect(screen.getByTestId('is-secure')).toHaveTextContent('true')
      expect(screen.getByTestId('has-csrf')).toHaveTextContent('true')
      expect(screen.getByTestId('is-active')).toHaveTextContent('true')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('role')).toHaveTextContent('ADMIN')
      expect(screen.getByTestId('permissions')).toHaveTextContent('admin:read,admin:write')
    })

    it('devrait retourner un statut non sécurisé sans CSRF', () => {
      const session = { ...createTestSession('admin'), csrfToken: undefined }
      mockUseSession(session, 'authenticated')

      renderWithAuth(<TestSecurityStatusHook />, { session })

      expect(screen.getByTestId('is-secure')).toHaveTextContent('false')
      expect(screen.getByTestId('has-csrf')).toHaveTextContent('false')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })

    it('devrait retourner un statut non sécurisé pour un compte inactif', () => {
      const session = createTestSession('inactive')
      mockUseSession(session, 'authenticated')

      renderWithAuth(<TestSecurityStatusHook />, { session })

      expect(screen.getByTestId('is-secure')).toHaveTextContent('false')
      expect(screen.getByTestId('is-active')).toHaveTextContent('false')
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })

    it('devrait gérer les permissions vides', () => {
      const session = { 
        ...createTestSession('client'), 
        user: { 
          ...createTestSession('client').user!, 
          permissions: [] 
        }
      }
      mockUseSession(session, 'authenticated')

      renderWithAuth(<TestSecurityStatusHook />, { session })

      expect(screen.getByTestId('permissions')).toHaveTextContent('')
    })

    it('devrait gérer l\'absence de permissions', () => {
      const session = { 
        ...createTestSession('client'), 
        user: { 
          ...createTestSession('client').user!, 
          permissions: undefined as any
        }
      }
      mockUseSession(session, 'authenticated')

      renderWithAuth(<TestSecurityStatusHook />, { session })

      expect(screen.getByTestId('permissions')).toHaveTextContent('')
    })
  })

  describe('États de transition', () => {
    it('devrait gérer la transition de non-authentifié à authentifié', () => {
      // Commencer non authentifié
      mockUseSession(null, 'unauthenticated')

      const { rerender } = renderWithAuth(<TestSecurityStatusHook />, { session: null })

      expect(screen.getByTestId('is-secure')).toHaveTextContent('false')

      // Passer à authentifié
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      rerender(<TestSecurityStatusHook />)

      expect(screen.getByTestId('is-secure')).toHaveTextContent('true')
    })
  })

  describe('Performance et optimisation', () => {
    it('devrait retourner des valeurs stables pour le même état', () => {
      const session = createTestSession('admin')
      mockUseSession(session, 'authenticated')

      const { rerender } = renderWithAuth(<TestSecurityStatusHook />, { session })

      const firstRender = {
        isSecure: screen.getByTestId('is-secure').textContent,
        hasCSRF: screen.getByTestId('has-csrf').textContent,
        role: screen.getByTestId('role').textContent,
      }

      rerender(<TestSecurityStatusHook />)

      expect(screen.getByTestId('is-secure')).toHaveTextContent(firstRender.isSecure!)
      expect(screen.getByTestId('has-csrf')).toHaveTextContent(firstRender.hasCSRF!)
      expect(screen.getByTestId('role')).toHaveTextContent(firstRender.role!)
    })
  })
})

describe('Integration des composants de sécurité', () => {
  it('devrait permettre l\'utilisation combinée des composants', () => {
    const session = createTestSession('admin')
    mockUseSession(session, 'authenticated')

    renderWithAuth(
      <div>
        <SecurityIndicator />
        <SecurityStatus showDetails={true} />
        <TestSecurityStatusHook />
      </div>,
      { session }
    )

    // Tous les composants devraient afficher des informations cohérentes
    expect(screen.getByText('Sécurisé')).toBeInTheDocument()
    expect(screen.getByText('Connecté')).toBeInTheDocument()
    expect(screen.getByTestId('is-secure')).toHaveTextContent('true')
  })
})