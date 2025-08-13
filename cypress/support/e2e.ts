// Cypress E2E Support Configuration for Mobile Testing
import './commands'
import 'cypress-real-events/support'

// Configure mobile viewport presets
Cypress.Commands.add('setMobileViewport', (device = 'iphone-x') => {
  const devices = {
    'iphone-se': { width: 375, height: 667 },
    'iphone-x': { width: 375, height: 812 },
    'iphone-12': { width: 390, height: 844 },
    'iphone-14-pro': { width: 393, height: 852 },
    android: { width: 360, height: 640 },
    'samsung-s20': { width: 360, height: 800 },
    'pixel-5': { width: 393, height: 851 },
    'ipad-mini': { width: 768, height: 1024 },
    ipad: { width: 820, height: 1180 },
  }

  const viewport =
    devices[device as keyof typeof devices] || devices['iphone-x']
  cy.viewport(viewport.width, viewport.height)
})

Cypress.Commands.add('loginAsUser', (role = 'admin') => {
  const users = {
    admin: { email: 'admin@test.com', password: 'password123' },
    manager: { email: 'manager@test.com', password: 'password123' },
    staff: { email: 'staff@test.com', password: 'password123' },
    client: { email: 'client@test.com', password: 'password123' },
  }

  const user = users[role as keyof typeof users]

  cy.session([role], () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type(user.email)
    cy.get('[data-testid="password-input"]').type(user.password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})

// Custom command for mobile swipe gestures
Cypress.Commands.add('swipe', (direction, element?) => {
  const swipeDistance = 200
  const target = element || cy.get('body')

  target.then(($el) => {
    const rect = $el[0].getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let startX, startY, endX, endY

    switch (direction) {
      case 'left':
        startX = centerX + swipeDistance / 2
        startY = centerY
        endX = centerX - swipeDistance / 2
        endY = centerY
        break
      case 'right':
        startX = centerX - swipeDistance / 2
        startY = centerY
        endX = centerX + swipeDistance / 2
        endY = centerY
        break
      case 'up':
        startX = centerX
        startY = centerY + swipeDistance / 2
        endX = centerX
        endY = centerY - swipeDistance / 2
        break
      case 'down':
        startX = centerX
        startY = centerY - swipeDistance / 2
        endX = centerX
        endY = centerY + swipeDistance / 2
        break
      default:
        throw new Error(`Invalid swipe direction: ${direction}`)
    }

    cy.wrap($el)
      .trigger('touchstart', {
        touches: [{ clientX: startX, clientY: startY }],
      })
      .trigger('touchmove', { touches: [{ clientX: endX, clientY: endY }] })
      .trigger('touchend')
  })
})

// Custom command for testing touch interactions
Cypress.Commands.add('touchTap', (selector) => {
  cy.get(selector).trigger('touchstart').trigger('touchend')
})

// Accessibility testing commands
Cypress.Commands.add('checkA11y', (context?, options?) => {
  cy.injectAxe()
  cy.checkA11y(context, options)
})

// Add TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(device?: string): Chainable<void>
      loginAsUser(role?: string): Chainable<void>
      swipe(
        direction: 'left' | 'right' | 'up' | 'down',
        element?: Chainable
      ): Chainable<void>
      touchTap(selector: string): Chainable<void>
      checkA11y(context?: string, options?: any): Chainable<void>
    }
  }
}
