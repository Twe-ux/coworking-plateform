/**
 * Tests unitaires pour la page de connexion
 * Teste le formulaire, les validations, et les interactions utilisateur
 */

import { screen, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/auth/login/page'
import { 
  renderWithAuth, 
  createMockRouter, 
  mockSignIn, 
  testData,
  fillLoginForm,
  testFormValidation 
} from '../../../utils/test-helpers'

// Mock des modules
jest.mock('next-auth/react')
jest.mock('next/navigation')

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockRouter = createMockRouter({ push: mockPush })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(signIn as jest.Mock).mockClear()
  })

  describe('Rendu du composant', () => {
    it('devrait afficher le formulaire de connexion', () => {
      renderWithAuth(<LoginPage />)

      expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    })

    it('devrait afficher les liens de navigation', () => {
      renderWithAuth(<LoginPage />)

      expect(screen.getByRole('link', { name: /mot de passe oublié/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /créer un compte/i })).toBeInTheDocument()
    })

    it('devrait avoir les bons attributs d\'accessibilité', () => {
      renderWithAuth(<LoginPage />)

      const emailField = screen.getByLabelText(/email/i)
      const passwordField = screen.getByLabelText(/mot de passe/i)

      expect(emailField).toHaveAttribute('type', 'email')
      expect(emailField).toHaveAttribute('autoComplete', 'email')
      expect(passwordField).toHaveAttribute('type', 'password')
      expect(passwordField).toHaveAttribute('autoComplete', 'current-password')
    })
  })

  describe('Validation du formulaire', () => {
    it('devrait valider les champs requis', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument()
        expect(screen.getByText(/le mot de passe est requis/i)).toBeInTheDocument()
      })
    })

    it('devrait valider le format email', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      await testFormValidation(
        user,
        screen.getByLabelText,
        screen.getByRole,
        screen.getByText,
        'email',
        'email-invalide',
        /veuillez entrer une adresse email valide/i
      )
    })

    it('devrait valider la longueur du mot de passe', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      await testFormValidation(
        user,
        screen.getByLabelText,
        screen.getByRole,
        screen.getByText,
        'mot de passe',
        '123',
        /le mot de passe doit contenir au moins 6 caractères/i
      )
    })

    it('devrait nettoyer les erreurs lors de la saisie', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      const emailField = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /se connecter/i })

      // Déclencher une erreur
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument()
      })

      // Corriger l'erreur
      await user.type(emailField, testData.validUser.email)
      await waitFor(() => {
        expect(screen.queryByText(/l'email est requis/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Fonctionnalité de visibilité du mot de passe', () => {
    it('devrait permettre d\'afficher et masquer le mot de passe', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      const passwordField = screen.getByLabelText(/mot de passe/i)
      const toggleButton = screen.getByRole('button', { name: '' }) // Le bouton de toggle

      expect(passwordField).toHaveAttribute('type', 'password')

      await user.click(toggleButton)
      expect(passwordField).toHaveAttribute('type', 'text')

      await user.click(toggleButton)
      expect(passwordField).toHaveAttribute('type', 'password')
    })
  })

  describe('Soumission du formulaire', () => {
    it('devrait soumettre avec les bonnes données', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      mockSignIn({ ok: true, error: null })

      await fillLoginForm(user, screen.getByLabelText, testData.validUser.email, testData.validUser.password)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: testData.validUser.email,
          password: testData.validUser.password,
          redirect: false,
        })
      })
    })

    it('devrait rediriger vers le dashboard après connexion réussie', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      mockSignIn({ ok: true, error: null })

      await fillLoginForm(user, screen.getByLabelText)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('devrait afficher une erreur pour des credentials invalides', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      mockSignIn({ ok: false, error: 'CredentialsSignin' })

      await fillLoginForm(user, screen.getByLabelText)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument()
      })
    })

    it('devrait gérer les erreurs réseau', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      ;(signIn as jest.Mock).mockRejectedValue(new Error('Network error'))

      await fillLoginForm(user, screen.getByLabelText)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/une erreur inattendue s'est produite/i)).toBeInTheDocument()
      })
    })
  })

  describe('États du formulaire', () => {
    it('devrait désactiver le formulaire pendant la soumission', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      // Mock signIn qui prend du temps
      ;(signIn as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )

      await fillLoginForm(user, screen.getByLabelText)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      const emailField = screen.getByLabelText(/email/i)
      const passwordField = screen.getByLabelText(/mot de passe/i)

      await user.click(submitButton)

      // Vérifier que les champs sont désactivés pendant le chargement
      expect(submitButton).toBeDisabled()
      expect(emailField).toBeDisabled()
      expect(passwordField).toBeDisabled()

      // Vérifier le texte de chargement
      expect(screen.getByText(/connexion en cours/i)).toBeInTheDocument()
    })

    it('devrait réactiver le formulaire après une erreur', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      mockSignIn({ ok: false, error: 'CredentialsSignin' })

      await fillLoginForm(user, screen.getByLabelText)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument()
      })

      // Vérifier que le formulaire est réactivé
      expect(submitButton).not.toBeDisabled()
      expect(screen.getByLabelText(/email/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/mot de passe/i)).not.toBeDisabled()
    })
  })

  describe('Navigation', () => {
    it('devrait avoir les bons liens de redirection', () => {
      renderWithAuth(<LoginPage />)

      const forgotPasswordLink = screen.getByRole('link', { name: /mot de passe oublié/i })
      const registerLink = screen.getByRole('link', { name: /créer un compte/i })

      expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password')
      expect(registerLink).toHaveAttribute('href', '/auth/register')
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir une structure sémantique correcte', () => {
      renderWithAuth(<LoginPage />)

      // Vérifier la hiérarchie des titres
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      
      // Vérifier les labels de formulaire
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()

      // Vérifier les messages d'erreur associés aux champs
      const emailField = screen.getByLabelText(/email/i)
      expect(emailField).toHaveAttribute('aria-invalid', 'false')
    })

    it('devrait annoncer les erreurs aux lecteurs d\'écran', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailField = screen.getByLabelText(/email/i)
        expect(emailField).toHaveAttribute('aria-invalid', 'true')
        expect(emailField).toHaveAttribute('aria-describedby')
      })
    })

    it('devrait permettre la navigation au clavier', async () => {
      const { user } = renderWithAuth(<LoginPage />)

      // Tab vers le premier champ
      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()

      // Tab vers le deuxième champ
      await user.tab()
      expect(screen.getByLabelText(/mot de passe/i)).toHaveFocus()

      // Tab vers le bouton de visibilité
      await user.tab()
      expect(screen.getByRole('button', { name: '' })).toHaveFocus()

      // Tab vers le bouton de soumission
      await user.tab()
      expect(screen.getByRole('button', { name: /se connecter/i })).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('devrait s\'adapter aux petits écrans', () => {
      // Simuler un écran mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      renderWithAuth(<LoginPage />)

      const form = screen.getByRole('form') || screen.getByLabelText(/email/i).closest('form')
      expect(form).toBeInTheDocument()

      // Vérifier que les éléments sont empilés verticalement
      const submitButton = screen.getByRole('button', { name: /se connecter/i })
      expect(submitButton).toHaveClass('w-full') // Bouton pleine largeur
    })
  })

  describe('Sécurité', () => {
    it('ne devrait pas exposer de données sensibles dans le DOM', () => {
      renderWithAuth(<LoginPage />)

      // Vérifier qu'il n'y a pas de données hardcodées sensibles
      expect(document.body).not.toHaveTextContent('password')
      expect(document.body).not.toHaveTextContent('secret')
      expect(document.body).not.toHaveTextContent('token')
    })

    it('devrait utiliser les attributs de sécurité appropriés', () => {
      renderWithAuth(<LoginPage />)

      const passwordField = screen.getByLabelText(/mot de passe/i)
      expect(passwordField).toHaveAttribute('autoComplete', 'current-password')
    })
  })
})