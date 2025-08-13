// Custom Cypress Commands for Mobile Dashboard Testing

// Command to simulate mobile touch events
Cypress.Commands.add('mobileTouch', (selector: string, action: 'tap' | 'longPress' | 'doubleTap' = 'tap') => {
  cy.get(selector).then($el => {
    const element = $el[0]
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    switch (action) {
      case 'tap':
        cy.wrap(element)
          .trigger('touchstart', { touches: [{ clientX: x, clientY: y }] })
          .wait(50)
          .trigger('touchend', { changedTouches: [{ clientX: x, clientY: y }] })
        break
      case 'longPress':
        cy.wrap(element)
          .trigger('touchstart', { touches: [{ clientX: x, clientY: y }] })
          .wait(500)
          .trigger('touchend', { changedTouches: [{ clientX: x, clientY: y }] })
        break
      case 'doubleTap':
        cy.wrap(element)
          .trigger('touchstart', { touches: [{ clientX: x, clientY: y }] })
          .trigger('touchend', { changedTouches: [{ clientX: x, clientY: y }] })
          .wait(100)
          .trigger('touchstart', { touches: [{ clientX: x, clientY: y }] })
          .trigger('touchend', { changedTouches: [{ clientX: x, clientY: y }] })
        break
    }
  })
})

// Command to test responsive breakpoints
Cypress.Commands.add('testResponsiveBreakpoints', (callback: (viewport: string) => void) => {
  const breakpoints = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1024, height: 768 },
    { name: 'large', width: 1440, height: 900 }
  ]

  breakpoints.forEach(breakpoint => {
    cy.viewport(breakpoint.width, breakpoint.height)
    cy.wait(200) // Allow for responsive transitions
    callback(breakpoint.name)
  })
})

// Command to check if element is within viewport
Cypress.Commands.add('isInViewport', (selector: string) => {
  cy.get(selector).then($el => {
    const element = $el[0]
    const rect = element.getBoundingClientRect()
    const viewportHeight = Cypress.config('viewportHeight')
    const viewportWidth = Cypress.config('viewportWidth')
    
    expect(rect.top).to.be.at.least(0)
    expect(rect.left).to.be.at.least(0)
    expect(rect.bottom).to.be.at.most(viewportHeight)
    expect(rect.right).to.be.at.most(viewportWidth)
  })
})

// Command to simulate edge swipe gestures
Cypress.Commands.add('edgeSwipe', (edge: 'left' | 'right', distance: number = 100) => {
  const viewportWidth = Cypress.config('viewportWidth')
  const viewportHeight = Cypress.config('viewportHeight')
  
  let startX, endX
  const startY = viewportHeight / 2
  const endY = viewportHeight / 2
  
  if (edge === 'left') {
    startX = 5 // Start from left edge
    endX = startX + distance
  } else {
    startX = viewportWidth - 5 // Start from right edge
    endX = startX - distance
  }
  
  cy.get('body')
    .trigger('touchstart', { 
      touches: [{ clientX: startX, clientY: startY }],
      changedTouches: [{ clientX: startX, clientY: startY }]
    })
    .trigger('touchmove', { 
      touches: [{ clientX: endX, clientY: endY }],
      changedTouches: [{ clientX: endX, clientY: endY }]
    })
    .trigger('touchend', {
      changedTouches: [{ clientX: endX, clientY: endY }]
    })
})

// Command to check mobile navigation state
Cypress.Commands.add('checkMobileNavState', (expectedState: 'open' | 'closed') => {
  if (expectedState === 'open') {
    cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
    cy.get('[data-testid="sidebar-overlay"]').should('be.visible')
  } else {
    cy.get('[data-testid="mobile-sidebar"]').should('not.be.visible')
    cy.get('[data-testid="sidebar-overlay"]').should('not.exist')
  }
})

// TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable {
      mobileTouch(selector: string, action?: 'tap' | 'longPress' | 'doubleTap'): Chainable<void>
      testResponsiveBreakpoints(callback: (viewport: string) => void): Chainable<void>
      isInViewport(selector: string): Chainable<void>
      edgeSwipe(edge: 'left' | 'right', distance?: number): Chainable<void>
      checkMobileNavState(expectedState: 'open' | 'closed'): Chainable<void>
    }
  }
}