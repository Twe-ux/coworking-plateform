/**
 * Tests unitaires pour la page d'inscription
 * Teste le formulaire, les validations, et la création de compte
 */

import { screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/auth/register/page'
import { 
  renderWithAuth, 
  createMockRouter, 
  mockApiCall,
  testData,
  fillRegisterForm,
  testFormValidation 
} from '../../../utils/test-helpers'

// Mock des modules
jest.mock('next/navigation')

describe('RegisterPage', () => {
  const mockPush = jest.fn()
  const mockRouter = createMockRouter({ push: mockPush })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    // Mock fetch par défaut (succès)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({
        message: 'Compte créé avec succès.',
        user: {
          id: 'new-user-123',
          email: testData.validUser.email,
          firstName: testData.validUser.firstName,
          lastName: testData.validUser.lastName,
        }
      })
    })
  })

  describe('Rendu du composant', () => {
    it('devrait afficher le formulaire d\'inscription', () => {
      renderWithAuth(<RegisterPage />)

      expect(screen.getByRole('heading', { name: /créer un compte/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^mot de passe/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument()
    })

    it('devrait afficher les liens de navigation', () => {
      renderWithAuth(<RegisterPage />)

      expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /conditions d'utilisation/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /politique de confidentialité/i })).toBeInTheDocument()
    })

    it('devrait afficher la case d\'acceptation des conditions', () => {
      renderWithAuth(<RegisterPage />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('Validation du formulaire', () => {
    it('devrait valider tous les champs requis', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/le prénom est requis/i)).toBeInTheDocument()
        expect(screen.getByText(/le nom est requis/i)).toBeInTheDocument()
        expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument()
        expect(screen.getByText(/le mot de passe doit contenir au moins 8 caractères/i)).toBeInTheDocument()
        expect(screen.getByText(/veuillez confirmer votre mot de passe/i)).toBeInTheDocument()
      })
    })

    it('devrait valider la longueur des noms', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      await testFormValidation(
        user,
        screen.getByLabelText,
        screen.getByRole,
        screen.getByText,
        'prénom',
        'A',
        /le prénom doit contenir au moins 2 caractères/i
      )

      await testFormValidation(
        user,
        screen.getByLabelText,
        screen.getByRole,
        screen.getByText,
        'nom',
        'B',
        /le nom doit contenir au moins 2 caractères/i
      )
    })

    it('devrait valider le format email', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

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

    it('devrait valider la complexité du mot de passe', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      const passwordField = screen.getByLabelText(/^mot de passe/i)
      await user.type(passwordField, 'simple')

      // Vérifier que les indicateurs de validation apparaissent
      await waitFor(() => {
        expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument()
        expect(screen.getByText(/une lettre majuscule/i)).toBeInTheDocument()
        expect(screen.getByText(/une lettre minuscule/i)).toBeInTheDocument()
        expect(screen.getByText(/un chiffre/i)).toBeInTheDocument()
      })
    })

    it('devrait afficher la validation en temps réel du mot de passe', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      const passwordField = screen.getByLabelText(/^mot de passe/i)
      
      // Taper un mot de passe progressivement
      await user.type(passwordField, 'Password123')

      await waitFor(() => {
        // Vérifier que certains critères sont maintenant valides
        const lengthIndicator = screen.getByText(/au moins 8 caractères/i).closest('div')
        const uppercaseIndicator = screen.getByText(/une lettre majuscule/i).closest('div')
        const lowercaseIndicator = screen.getByText(/une lettre minuscule/i).closest('div')
        const numberIndicator = screen.getByText(/un chiffre/i).closest('div')
        
        expect(lengthIndicator).toHaveClass('text-green-600')
        expect(uppercaseIndicator).toHaveClass('text-green-600')
        expect(lowercaseIndicator).toHaveClass('text-green-600')
        expect(numberIndicator).toHaveClass('text-green-600')
      })
    })

    it('devrait valider la correspondance des mots de passe', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      const passwordField = screen.getByLabelText(/^mot de passe/i)
      const confirmPasswordField = screen.getByLabelText(/confirmer/i)

      await user.type(passwordField, 'Password123!')
      await user.type(confirmPasswordField, 'DifferentPassword123!')

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument()
      })
    })

    it('devrait exiger l\'acceptation des conditions', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      await fillRegisterForm(user, screen.getByLabelText)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/vous devez accepter les conditions d'utilisation/i)).toBeInTheDocument()
      })
    })
  })

  describe('Fonctionnalité de visibilité des mots de passe', () => {
    it('devrait permettre d\'afficher et masquer les mots de passe', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      const passwordField = screen.getByLabelText(/^mot de passe/i)
      const confirmPasswordField = screen.getByLabelText(/confirmer/i)
      const toggleButtons = screen.getAllByRole('button', { name: '' })

      expect(passwordField).toHaveAttribute('type', 'password')
      expect(confirmPasswordField).toHaveAttribute('type', 'password')

      // Toggle premier mot de passe
      await user.click(toggleButtons[0])
      expect(passwordField).toHaveAttribute('type', 'text')

      // Toggle confirmation mot de passe
      await user.click(toggleButtons[1])
      expect(confirmPasswordField).toHaveAttribute('type', 'text')

      // Re-masquer
      await user.click(toggleButtons[0])
      await user.click(toggleButtons[1])
      expect(passwordField).toHaveAttribute('type', 'password')
      expect(confirmPasswordField).toHaveAttribute('type', 'password')
    })
  })

  describe('Soumission du formulaire', () => {
    it('devrait soumettre avec les bonnes données', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: testData.validUser.firstName,
            lastName: testData.validUser.lastName,
            email: testData.validUser.email,
            password: testData.validUser.password,
          }),
        })
      })
    })

    it('devrait afficher un message de succès et rediriger', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/compte créé avec succès/i)).toBeInTheDocument()
      })

      // Attendre la redirection automatique
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      }, { timeout: 3000 })
    })

    it('devrait gérer les erreurs d\'email existant', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          message: 'Un compte avec cette adresse email existe déjà.'
        })
      })

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/un compte avec cette adresse email existe déjà/i)).toBeInTheDocument()
      })
    })

    it('devrait gérer les erreurs de validation serveur', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          message: 'Le mot de passe ne respecte pas les critères de sécurité.'
        })
      })

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/le mot de passe ne respecte pas les critères de sécurité/i)).toBeInTheDocument()
      })
    })

    it('devrait gérer les erreurs réseau', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/une erreur inattendue s'est produite/i)).toBeInTheDocument()
      })
    })
  })

  describe('États du formulaire', () => {
    it('devrait désactiver le formulaire pendant la soumission', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      // Mock fetch qui prend du temps
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ message: 'Success' })
        }), 100))
      )

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      const firstNameField = screen.getByLabelText(/prénom/i)

      await user.click(submitButton)

      // Vérifier que les champs sont désactivés pendant le chargement
      expect(submitButton).toBeDisabled()
      expect(firstNameField).toBeDisabled()
      expect(screen.getByText(/création en cours/i)).toBeInTheDocument()
    })

    it('devrait réactiver le formulaire après une erreur', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Error' })
      })

      await fillRegisterForm(user, screen.getByLabelText)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Vérifier que le formulaire est réactivé
      expect(submitButton).not.toBeDisabled()
      expect(screen.getByLabelText(/prénom/i)).not.toBeDisabled()
    })
  })

  describe('Navigation et liens', () => {
    it('devrait avoir les bons liens de redirection', () => {
      renderWithAuth(<RegisterPage />)

      const loginLink = screen.getByRole('link', { name: /se connecter/i })
      const termsLink = screen.getByRole('link', { name: /conditions d'utilisation/i })
      const privacyLink = screen.getByRole('link', { name: /politique de confidentialité/i })

      expect(loginLink).toHaveAttribute('href', '/auth/login')
      expect(termsLink).toHaveAttribute('href', '/terms')
      expect(privacyLink).toHaveAttribute('href', '/privacy')
    })

    it('devrait ouvrir les liens legaux dans un nouvel onglet', () => {
      renderWithAuth(<RegisterPage />)

      const termsLink = screen.getByRole('link', { name: /conditions d'utilisation/i })
      const privacyLink = screen.getByRole('link', { name: /politique de confidentialité/i })

      expect(termsLink).toHaveAttribute('target', '_blank')
      expect(privacyLink).toHaveAttribute('target', '_blank')
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir une structure sémantique correcte', () => {
      renderWithAuth(<RegisterPage />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      
      // Vérifier les labels de formulaire
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('devrait associer correctement les messages d\'erreur aux champs', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      await user.click(submitButton)

      await waitFor(() => {
        const firstNameField = screen.getByLabelText(/prénom/i)
        expect(firstNameField).toHaveAttribute('aria-invalid', 'true')
        expect(firstNameField).toHaveAttribute('aria-describedby')
      })
    })

    it('devrait permettre la navigation au clavier', async () => {
      const { user } = renderWithAuth(<RegisterPage />)

      // Tab vers les champs dans l'ordre
      await user.tab()
      expect(screen.getByLabelText(/prénom/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/nom/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()
    })

    it('devrait avoir des attributs autocomplete appropriés', () => {
      renderWithAuth(<RegisterPage />)

      expect(screen.getByLabelText(/prénom/i)).toHaveAttribute('autoComplete', 'given-name')
      expect(screen.getByLabelText(/nom/i)).toHaveAttribute('autoComplete', 'family-name')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email')
      expect(screen.getByLabelText(/^mot de passe/i)).toHaveAttribute('autoComplete', 'new-password')
      expect(screen.getByLabelText(/confirmer/i)).toHaveAttribute('autoComplete', 'new-password')
    })
  })

  describe('Responsive Design', () => {
    it('devrait adapter la mise en page sur mobile', () => {
      renderWithAuth(<RegisterPage />)

      const nameFields = screen.getByLabelText(/prénom/i).closest('.grid')
      expect(nameFields).toHaveClass('grid-cols-2')

      const submitButton = screen.getByRole('button', { name: /créer mon compte/i })
      expect(submitButton).toHaveClass('w-full')
    })
  })

  describe('Sécurité', () => {
    it('devrait utiliser les attributs de sécurité appropriés', () => {
      renderWithAuth(<RegisterPage />)

      const passwordField = screen.getByLabelText(/^mot de passe/i)
      const confirmPasswordField = screen.getByLabelText(/confirmer/i)

      expect(passwordField).toHaveAttribute('autoComplete', 'new-password')
      expect(confirmPasswordField).toHaveAttribute('autoComplete', 'new-password')
    })

    it('ne devrait pas exposer de données sensibles', () => {
      renderWithAuth(<RegisterPage />)

      // Vérifier qu'il n'y a pas de données hardcodées sensibles
      expect(document.body).not.toHaveTextContent('admin')
      expect(document.body).not.toHaveTextContent('secret')
      expect(document.body).not.toHaveTextContent('token')
    })
  })
})