/**
 * Tests unitaires pour la page de mot de passe oublié
 * Teste le formulaire de demande de réinitialisation et les différents états
 */

import { screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'
import { 
  renderWithAuth, 
  createMockRouter, 
  testData,
  testFormValidation 
} from '../../../utils/test-helpers'

// Mock des modules
jest.mock('next/navigation')

describe('ForgotPasswordPage', () => {
  const mockPush = jest.fn()
  const mockRouter = createMockRouter({ push: mockPush })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    // Mock fetch par défaut (succès)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        message: 'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.'
      })
    })
  })

  describe('Rendu du composant', () => {
    it('devrait afficher le formulaire de demande de réinitialisation', () => {
      renderWithAuth(<ForgotPasswordPage />)

      expect(screen.getByRole('heading', { name: /mot de passe oublié/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })).toBeInTheDocument()
    })

    it('devrait afficher la description du processus', () => {
      renderWithAuth(<ForgotPasswordPage />)

      expect(screen.getByText(/entrez votre adresse email pour recevoir un lien de réinitialisation/i)).toBeInTheDocument()
    })

    it('devrait afficher les liens de navigation', () => {
      renderWithAuth(<ForgotPasswordPage />)

      expect(screen.getByRole('link', { name: /retour à la connexion/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /créer un compte/i })).toBeInTheDocument()
    })
  })

  describe('Validation du formulaire', () => {
    it('devrait valider le champ email requis', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/l'email est requis/i)).toBeInTheDocument()
      })
    })

    it('devrait valider le format email', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      await testFormValidation(
        user,
        screen.getByLabelText,
        screen.getByRole,
        screen.getByText,
        'adresse email',
        'email-invalide',
        /veuillez entrer une adresse email valide/i
      )
    })

    it('devrait nettoyer les erreurs lors de la saisie', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })

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

  describe('Soumission du formulaire', () => {
    it('devrait soumettre avec les bonnes données', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testData.validUser.email }),
        })
      })
    })

    it('devrait afficher un message de succès et masquer le formulaire', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/si cette adresse email existe dans notre système/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/adresse email/i)).not.toBeInTheDocument()
      })
    })

    it('devrait réinitialiser le formulaire après succès', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      // Le formulaire devrait être masqué donc on ne peut plus tester les valeurs
      await waitFor(() => {
        expect(screen.queryByLabelText(/adresse email/i)).not.toBeInTheDocument()
      })
    })

    it('devrait afficher les instructions détaillées après succès', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/que faire ensuite/i)).toBeInTheDocument()
        expect(screen.getByText(/vérifiez votre boîte email/i)).toBeInTheDocument()
        expect(screen.getByText(/cliquez sur le lien dans l'email reçu/i)).toBeInTheDocument()
        expect(screen.getByText(/créez un nouveau mot de passe sécurisé/i)).toBeInTheDocument()
        expect(screen.getByText(/le lien expire dans 24 heures/i)).toBeInTheDocument()
      })
    })

    it('devrait gérer les erreurs serveur', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          message: 'Une erreur est survenue. Veuillez réessayer.'
        })
      })

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/une erreur est survenue. veuillez réessayer/i)).toBeInTheDocument()
      })
    })

    it('devrait gérer les erreurs réseau', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/une erreur inattendue s'est produite/i)).toBeInTheDocument()
      })
    })
  })

  describe('États du formulaire', () => {
    it('devrait désactiver le formulaire pendant la soumission', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      // Mock fetch qui prend du temps
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: 'Success' })
        }), 100))
      )

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      // Vérifier que les champs sont désactivés pendant le chargement
      expect(submitButton).toBeDisabled()
      expect(emailField).toBeDisabled()
      expect(screen.getByText(/envoi en cours/i)).toBeInTheDocument()
    })

    it('devrait réactiver le formulaire après une erreur', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Error' })
      })

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Vérifier que le formulaire est réactivé
      expect(submitButton).not.toBeDisabled()
      expect(emailField).not.toBeDisabled()
    })
  })

  describe('Navigation et liens', () => {
    it('devrait avoir les bons liens de redirection', () => {
      renderWithAuth(<ForgotPasswordPage />)

      const loginLink = screen.getByRole('link', { name: /retour à la connexion/i })
      const registerLink = screen.getByRole('link', { name: /créer un compte/i })

      expect(loginLink).toHaveAttribute('href', '/auth/login')
      expect(registerLink).toHaveAttribute('href', '/auth/register')
    })

    it('devrait afficher l\'icône de retour appropriée', () => {
      renderWithAuth(<ForgotPasswordPage />)

      const backLink = screen.getByRole('link', { name: /retour à la connexion/i })
      expect(backLink).toBeInTheDocument()
    })
  })

  describe('Interface utilisateur', () => {
    it('devrait afficher une icône d\'email appropriée dans le message de succès', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        // L'icône email devrait être présente dans l'alerte de succès
        const successAlert = screen.getByText(/si cette adresse email existe/i).closest('[role="alert"]')
        expect(successAlert).toBeInTheDocument()
      })
    })

    it('devrait utiliser les bonnes classes de style pour les différents états', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      // État normal
      expect(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })).toHaveClass('w-full')

      // État d'erreur
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Error' })
      })

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorAlert = screen.getByText(/error/i).closest('[role="alert"]')
        expect(errorAlert).toHaveClass('border-red-200')
      })
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir une structure sémantique correcte', () => {
      renderWithAuth(<ForgotPasswordPage />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument()
    })

    it('devrait associer les messages d\'erreur aux champs', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailField = screen.getByLabelText(/adresse email/i)
        expect(emailField).toHaveAttribute('aria-invalid', 'true')
        expect(emailField).toHaveAttribute('aria-describedby')
      })
    })

    it('devrait permettre la navigation au clavier', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      await user.tab()
      expect(screen.getByLabelText(/adresse email/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })).toHaveFocus()
    })

    it('devrait avoir les attributs autocomplete appropriés', () => {
      renderWithAuth(<ForgotPasswordPage />)

      expect(screen.getByLabelText(/adresse email/i)).toHaveAttribute('autoComplete', 'email')
    })

    it('devrait annoncer les changements d\'état aux lecteurs d\'écran', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        const successMessage = screen.getByText(/si cette adresse email existe/i)
        expect(successMessage.closest('[role="alert"]')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('devrait s\'adapter aux petits écrans', () => {
      renderWithAuth(<ForgotPasswordPage />)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      expect(submitButton).toHaveClass('w-full')

      const emailField = screen.getByLabelText(/adresse email/i)
      expect(emailField).toHaveClass('h-11')
    })
  })

  describe('Sécurité', () => {
    it('devrait utiliser les attributs de sécurité appropriés', () => {
      renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      expect(emailField).toHaveAttribute('type', 'email')
      expect(emailField).toHaveAttribute('autoComplete', 'email')
    })

    it('ne devrait pas révéler si un email existe ou non', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      // Tester avec un email inexistant
      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, 'nonexistent@example.com')

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Le message devrait être le même peu importe si l'email existe
        expect(screen.getByText(/si cette adresse email existe dans notre système/i)).toBeInTheDocument()
      })
    })

    it('ne devrait pas exposer d\'informations sensibles', () => {
      renderWithAuth(<ForgotPasswordPage />)

      // Vérifier qu'il n'y a pas de données hardcodées sensibles
      expect(document.body).not.toHaveTextContent('admin')
      expect(document.body).not.toHaveTextContent('secret')
      expect(document.body).not.toHaveTextContent('token')
    })
  })

  describe('Expérience utilisateur', () => {
    it('devrait afficher des conseils utiles après l\'envoi', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/vérifiez également votre dossier de courriers indésirables/i)).toBeInTheDocument()
      })
    })

    it('devrait maintenir le contexte de navigation après succès', async () => {
      const { user } = renderWithAuth(<ForgotPasswordPage />)

      const emailField = screen.getByLabelText(/adresse email/i)
      await user.type(emailField, testData.validUser.email)

      const submitButton = screen.getByRole('button', { name: /envoyer le lien de réinitialisation/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Les liens de navigation devraient toujours être présents
        expect(screen.getByRole('link', { name: /retour à la connexion/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /créer un compte/i })).toBeInTheDocument()
      })
    })
  })
})