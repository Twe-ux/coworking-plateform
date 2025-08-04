/**
 * Utilitaires de test pour l'authentification
 * Fournit des helpers et des wrappers pour faciliter les tests
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { UserRole } from '@/types/auth'
import { mockUsers, createMockSession } from '../mocks/auth-handlers'

// Types pour les helpers de test
export interface TestUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: string[]
  isActive: boolean
}

export interface MockSessionOptions {
  user?: TestUser
  expires?: string
  csrfToken?: string
  accessToken?: string
}

export interface AuthWrapperProps {
  children: React.ReactNode
  session?: MockSessionOptions | null
}

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: MockSessionOptions | null
  initialProps?: Record<string, any>
}

/**
 * Wrapper d'authentification pour les tests
 */
export function AuthWrapper({ children, session }: AuthWrapperProps) {
  const mockSession = session ? {
    user: session.user || mockUsers.client,
    expires: session.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    csrfToken: session.csrfToken || 'test-csrf-token',
    accessToken: session.accessToken || 'test-access-token',
  } : null

  return (
    <SessionProvider session={mockSession}>
      {children}
    </SessionProvider>
  )
}

/**
 * Fonction de rendu personnalisée avec authentification
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { session, ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthWrapper session={session}>
      {children}
    </AuthWrapper>
  )

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Crée un utilisateur de test avec des données valides
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CLIENT,
    permissions: ['bookings:own'],
    isActive: true,
    ...overrides,
  }
}

/**
 * Crée une session de test
 */
export function createTestSession(userType: keyof typeof mockUsers = 'client'): MockSessionOptions {
  const user = mockUsers[userType]
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    csrfToken: 'test-csrf-token-123',
    accessToken: `test-access-${user.id}`,
  }
}

/**
 * Mock de useRouter avec des fonctions par défaut
 */
export function createMockRouter(overrides: Record<string, any> = {}) {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    ...overrides,
  }
}

/**
 * Mock de useSession avec différents états
 */
export function mockUseSession(sessionData: any = null, status: string = 'unauthenticated') {
  const useSession = require('next-auth/react').useSession
  useSession.mockReturnValue({
    data: sessionData,
    status,
    update: jest.fn(),
  })
}

/**
 * Mock de signIn pour les tests de connexion
 */
export function mockSignIn(returnValue: any = { ok: true, error: null }) {
  const signIn = require('next-auth/react').signIn
  signIn.mockResolvedValue(returnValue)
}

/**
 * Mock de signOut pour les tests de déconnexion
 */
export function mockSignOut(returnValue: any = { url: '/auth/login' }) {
  const signOut = require('next-auth/react').signOut
  signOut.mockResolvedValue(returnValue)
}

/**
 * Attend qu'un élément soit présent ou absent
 */
export async function waitForAuthState(
  getByTestId: (id: string) => HTMLElement,
  testId: string,
  shouldExist: boolean = true,
  timeout: number = 5000
) {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      try {
        const element = getByTestId(testId)
        if (shouldExist) {
          resolve()
        } else {
          if (Date.now() - startTime < timeout) {
            setTimeout(check, 100)
          } else {
            reject(new Error(`Element ${testId} still exists after ${timeout}ms`))
          }
        }
      } catch (error) {
        if (!shouldExist) {
          resolve()
        } else {
          if (Date.now() - startTime < timeout) {
            setTimeout(check, 100)
          } else {
            reject(new Error(`Element ${testId} not found after ${timeout}ms`))
          }
        }
      }
    }
    
    check()
  })
}

/**
 * Simule une requête d'authentification réussie
 */
export function mockSuccessfulAuth(userType: keyof typeof mockUsers = 'client') {
  const user = mockUsers[userType]
  mockUseSession({
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    csrfToken: 'test-csrf-token',
    accessToken: `test-access-${user.id}`,
  }, 'authenticated')
}

/**
 * Simule une requête d'authentification échouée
 */
export function mockFailedAuth() {
  mockUseSession(null, 'unauthenticated')
}

/**
 * Simule un état de chargement d'authentification
 */
export function mockLoadingAuth() {
  mockUseSession(null, 'loading')
}

/**
 * Mock de fetch pour les appels API
 */
export function mockApiCall(url: string, response: any, status: number = 200) {
  const fetch = global.fetch as jest.MockedFunction<typeof global.fetch>
  
  fetch.mockImplementation((input: RequestInfo | URL) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()
    
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        headers: new Headers(),
      } as Response)
    }
    
    return Promise.reject(new Error(`Unexpected API call to ${requestUrl}`))
  })
}

/**
 * Nettoie tous les mocks après chaque test
 */
export function cleanup() {
  jest.clearAllMocks()
  const fetch = global.fetch as jest.MockedFunction<typeof global.fetch>
  fetch.mockClear()
}

/**
 * Assertions personnalisées pour l'authentification
 */
export const authAssertions = {
  toBeAuthenticated: (element: HTMLElement) => {
    expect(element).not.toHaveTextContent(/connexion|login/i)
    expect(element).not.toHaveTextContent(/accès refusé|access denied/i)
  },
  
  toBeUnauthenticated: (element: HTMLElement) => {
    expect(element).toHaveTextContent(/connexion|login|accès refusé|access denied/i)
  },
  
  toHaveRole: (element: HTMLElement, role: UserRole) => {
    // Cette assertion dépend de l'implémentation de votre UI
    // Adapter selon votre façon d'afficher les rôles
    const roleText = role.charAt(0).toUpperCase() + role.slice(1)
    expect(element).toHaveTextContent(new RegExp(roleText, 'i'))
  },
  
  toHaveRedirectedTo: (mockPush: jest.Mock, expectedPath: string) => {
    expect(mockPush).toHaveBeenCalledWith(expectedPath)
  },
}

/**
 * Générateur de données de test pour les formulaires
 */
export const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  
  invalidUser: {
    email: 'invalid-email',
    password: '123',
    firstName: '',
    lastName: '',
  },
  
  existingUser: {
    email: 'client@coworking.com',
    password: 'ClientPassword123!',
  },
  
  adminUser: {
    email: 'admin@coworking.com',
    password: 'AdminPassword123!',
  },
  
  inactiveUser: {
    email: 'inactive@coworking.com',
    password: 'InactivePassword123!',
  },
}

/**
 * Helper pour tester les validations de formulaire
 */
export async function testFormValidation(
  user: ReturnType<typeof userEvent.setup>,
  getByLabelText: (text: string) => HTMLElement,
  getByRole: (role: string, options?: any) => HTMLElement,
  getByText: (text: string) => HTMLElement,
  fieldName: string,
  invalidValue: string,
  expectedErrorMessage: string
) {
  const field = getByLabelText(new RegExp(fieldName, 'i'))
  const submitButton = getByRole('button', { name: /submit|connexion|créer|envoyer/i })
  
  await user.clear(field)
  await user.type(field, invalidValue)
  await user.click(submitButton)
  
  expect(getByText(expectedErrorMessage)).toBeInTheDocument()
}

/**
 * Helper pour remplir un formulaire de connexion
 */
export async function fillLoginForm(
  user: ReturnType<typeof userEvent.setup>,
  getByLabelText: (text: string) => HTMLElement,
  email: string = testData.validUser.email,
  password: string = testData.validUser.password
) {
  const emailField = getByLabelText(/email/i)
  const passwordField = getByLabelText(/mot de passe|password/i)
  
  await user.clear(emailField)
  await user.type(emailField, email)
  await user.clear(passwordField)
  await user.type(passwordField, password)
}

/**
 * Helper pour remplir un formulaire d'inscription
 */
export async function fillRegisterForm(
  user: ReturnType<typeof userEvent.setup>,
  getByLabelText: (text: string) => HTMLElement,
  userData: typeof testData.validUser = testData.validUser
) {
  const emailField = getByLabelText(/email/i)
  const passwordField = getByLabelText(/^mot de passe|^password/i)
  const confirmPasswordField = getByLabelText(/confirmer|confirm/i)
  const firstNameField = getByLabelText(/prénom|first name/i)
  const lastNameField = getByLabelText(/nom|last name/i)
  
  await user.clear(firstNameField)
  await user.type(firstNameField, userData.firstName)
  await user.clear(lastNameField)
  await user.type(lastNameField, userData.lastName)
  await user.clear(emailField)
  await user.type(emailField, userData.email)
  await user.clear(passwordField)
  await user.type(passwordField, userData.password)
  await user.clear(confirmPasswordField)
  await user.type(confirmPasswordField, userData.password)
}

/**
 * Helper pour tester les scénarios d'authentification complexes
 */
export async function testAuthenticationFlow(
  component: React.ReactElement,
  scenario: {
    userType: keyof typeof mockUsers
    shouldSucceed: boolean
    expectedRedirect?: string
    customAssertions?: (container: HTMLElement) => void
  }
) {
  const session = scenario.shouldSucceed ? createTestSession(scenario.userType) : null
  mockUseSession(session, scenario.shouldSucceed ? 'authenticated' : 'unauthenticated')

  const { container, user } = renderWithAuth(component, { session })

  if (scenario.customAssertions) {
    scenario.customAssertions(container)
  }

  if (scenario.expectedRedirect) {
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(scenario.expectedRedirect)
    })
  }

  return { container, user }
}

/**
 * Helper pour simuler des erreurs d'API spécifiques
 */
export function mockApiError(url: string, error: { status: number; message: string }) {
  const fetch = global.fetch as jest.MockedFunction<typeof global.fetch>
  
  fetch.mockImplementation((input: RequestInfo | URL) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()
    
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: false,
        status: error.status,
        statusText: error.status === 500 ? 'Internal Server Error' : 'Error',
        json: () => Promise.resolve({ message: error.message }),
        text: () => Promise.resolve(JSON.stringify({ message: error.message })),
        headers: new Headers(),
      } as Response)
    }
    
    return Promise.reject(new Error(`Unexpected API call to ${requestUrl}`))
  })
}

/**
 * Helper pour tester les timeouts et erreurs réseau
 */
export function mockNetworkError(url: string, timeout: number = 5000) {
  const fetch = global.fetch as jest.MockedFunction<typeof global.fetch>
  
  fetch.mockImplementation((input: RequestInfo | URL) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()
    
    if (requestUrl.includes(url)) {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Network timeout'))
        }, timeout)
      })
    }
    
    return Promise.reject(new Error(`Unexpected API call to ${requestUrl}`))
  })
}

/**
 * Helper pour créer des scénarios de test complets
 */
export interface TestScenario {
  name: string
  setup: () => void | Promise<void>
  userActions: (user: ReturnType<typeof userEvent.setup>, screen: any) => Promise<void>
  assertions: (screen: any, container: HTMLElement) => void | Promise<void>
  cleanup?: () => void
}

export async function runTestScenario(
  component: React.ReactElement,
  scenario: TestScenario,
  renderOptions?: CustomRenderOptions
) {
  // Setup
  if (scenario.setup) {
    await scenario.setup()
  }

  // Render
  const { user, container, ...screen } = renderWithAuth(component, renderOptions)

  try {
    // User actions
    await scenario.userActions(user, screen)

    // Assertions
    await scenario.assertions(screen, container)
  } finally {
    // Cleanup
    if (scenario.cleanup) {
      scenario.cleanup()
    }
  }

  return { user, container, ...screen }
}

/**
 * Helper pour générer des données de test aléatoires
 */
export const generateTestData = {
  email: () => `test${Date.now()}@example.com`,
  password: () => 'TestPassword123!',
  name: () => `TestUser${Date.now()}`,
  
  user: (overrides: Partial<TestUser> = {}) => ({
    id: `test-user-${Date.now()}`,
    email: generateTestData.email(),
    firstName: generateTestData.name(),
    lastName: generateTestData.name(),
    role: UserRole.CLIENT,
    permissions: ['bookings:own'],
    isActive: true,
    ...overrides,
  }),

  session: (userType: keyof typeof mockUsers = 'client') => createTestSession(userType),

  form: {
    login: () => ({
      email: testData.validUser.email,
      password: testData.validUser.password,
    }),
    
    register: () => ({
      firstName: generateTestData.name(),
      lastName: generateTestData.name(),
      email: generateTestData.email(),
      password: generateTestData.password(),
      confirmPassword: generateTestData.password(),
      acceptTerms: true,
    }),
    
    forgotPassword: () => ({
      email: generateTestData.email(),
    }),
  },
}

/**
 * Helper pour les tests de performance
 */
export async function measureRenderTime<T>(
  renderFn: () => T
): Promise<{ result: T; renderTime: number }> {
  const startTime = performance.now()
  const result = renderFn()
  const endTime = performance.now()
  
  return {
    result,
    renderTime: endTime - startTime
  }
}

/**
 * Helper pour tester l'accessibilité
 */
export function testAccessibility(container: HTMLElement) {
  // Vérifier les rôles ARIA
  const elements = container.querySelectorAll('[role]')
  elements.forEach(element => {
    const role = element.getAttribute('role')
    expect(role).toBeTruthy()
  })

  // Vérifier les labels
  const inputs = container.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const hasLabel = 
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      container.querySelector(`label[for="${input.id}"]`)
    
    expect(hasLabel).toBeTruthy()
  })

  // Vérifier les titres
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length > 0) {
    expect(headings[0].tagName).toBe('H1') // Premier titre doit être H1
  }
}

/**
 * Helper pour tester la réactivité
 */
export function testResponsiveBreakpoints(
  component: React.ReactElement,
  breakpoints: { width: number; assertions: (container: HTMLElement) => void }[]
) {
  breakpoints.forEach(({ width, assertions }) => {
    // Simuler la taille d'écran
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })

    window.dispatchEvent(new Event('resize'))

    const { container } = renderWithAuth(component)
    assertions(container)
  })
}

/**
 * Helper pour les tests de sécurité
 */
export const securityHelpers = {
  testCSRFProtection: (apiUrl: string) => {
    mockApiCall(apiUrl, { error: 'CSRF token invalid' }, 403)
  },

  testRateLimiting: (apiUrl: string) => {
    mockApiCall(apiUrl, { error: 'Too many requests' }, 429)
  },

  testInputSanitization: (input: HTMLElement, maliciousInput: string) => {
    // Tester l'injection XSS
    const scriptTag = '<script>alert("xss")</script>'
    const testValue = maliciousInput || scriptTag
    
    // Le composant ne devrait pas exécuter le script
    expect(input.textContent).not.toContain('script')
    expect(document.body.innerHTML).not.toContain('alert("xss")')
  },

  testDataExposure: (container: HTMLElement, sensitiveData: string[]) => {
    sensitiveData.forEach(data => {
      expect(container.textContent).not.toContain(data)
    })
  },
}

/**
 * Helper pour créer des mocks de hooks personnalisés
 */
export function createHookMock<T>(hookName: string, defaultValue: T) {
  const mockHook = jest.fn().mockReturnValue(defaultValue)
  
  return {
    mock: mockHook,
    mockReturnValue: (value: T) => mockHook.mockReturnValue(value),
    mockImplementation: (impl: () => T) => mockHook.mockImplementation(impl),
    restore: () => mockHook.mockRestore(),
  }
}