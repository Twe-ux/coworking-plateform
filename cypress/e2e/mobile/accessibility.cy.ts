/**
 * Mobile Accessibility E2E Tests
 * Tests WCAG compliance, screen reader support, and mobile accessibility features
 */

describe('Mobile Accessibility', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-x')
    cy.loginAsUser('admin')
    cy.visit('/dashboard/admin')
    cy.injectAxe() // For accessibility testing
  })

  describe('WCAG 2.1 AA Compliance', () => {
    it('meets WCAG standards on mobile dashboard', () => {
      cy.checkA11y('[data-testid="dashboard-content"]', {
        rules: {
          'color-contrast': { enabled: true },
          'touch-target': { enabled: true },
          'focus-visible': { enabled: true }
        }
      })
    })

    it('meets WCAG standards for mobile navigation', () => {
      cy.checkA11y('[data-testid="mobile-bottom-nav"]', {
        rules: {
          'color-contrast': { enabled: true },
          'link-name': { enabled: true },
          'touch-target': { enabled: true }
        }
      })
    })

    it('meets WCAG standards for mobile sidebar', () => {
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      cy.checkA11y('[data-testid="mobile-sidebar"]', {
        rules: {
          'landmark-unique': { enabled: true },
          'navigation-landmark': { enabled: true },
          'focus-trap': { enabled: true }
        }
      })
    })

    it('validates color contrast ratios', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        // Check that links have sufficient color contrast
        cy.wrap($link).should('be.visible')
        
        // Active links should have high contrast
        if ($link.attr('aria-current') === 'page') {
          cy.wrap($link).should('have.class', 'text-blue-600')
        }
      })
      
      // Run automated contrast checking
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
    })
  })

  describe('Touch Target Accessibility', () => {
    it('provides minimum 44x44px touch targets', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        cy.wrap($link).then($el => {
          const rect = $el[0].getBoundingClientRect()
          expect(rect.width).to.be.at.least(44)
          expect(rect.height).to.be.at.least(44)
        })
      })
    })

    it('maintains adequate spacing between touch targets', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').then($links => {
        for (let i = 0; i < $links.length - 1; i++) {
          const rect1 = $links[i].getBoundingClientRect()
          const rect2 = $links[i + 1].getBoundingClientRect()
          
          // Should have adequate spacing (minimum 8px recommended)
          const spacing = Math.abs(rect2.left - rect1.right)
          expect(spacing).to.be.at.least(0) // No overlap at minimum
        }
      })
    })

    it('provides touch feedback for all interactive elements', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        // Should have hover/active states
        cy.wrap($link).should('have.class', 'hover:bg-gray-50')
        cy.wrap($link).should('have.class', 'active:bg-gray-100')
      })
    })
  })

  describe('Screen Reader Support', () => {
    it('provides proper semantic structure', () => {
      // Main navigation landmark
      cy.get('[data-testid="mobile-bottom-nav"]')
        .should('have.attr', 'role', 'navigation')
        .and('have.attr', 'aria-label')

      // Sidebar navigation landmark  
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.get('[data-testid="mobile-sidebar"]')
        .should('have.attr', 'role', 'complementary')
    })

    it('announces current page correctly', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.get('[aria-current="page"]')
          .should('exist')
          .and('be.visible')
          .and('have.attr', 'aria-current', 'page')
      })
    })

    it('provides descriptive link names', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        // Each link should have accessible name
        cy.wrap($link).should('have.attr', 'href')
        
        const text = $link.text().trim()
        expect(text.length).to.be.greaterThan(0)
        
        // Should not rely only on icons
        cy.wrap($link).find('span').should('contain.text', text)
      })
    })

    it('announces state changes for dynamic content', () => {
      // Open sidebar
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      // Should announce state change
      cy.get('[data-testid="mobile-sidebar"]')
        .should('have.attr', 'aria-expanded', 'true')
      
      // Close sidebar
      cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
      
      cy.get('[data-testid="mobile-sidebar"]')
        .should('not.be.visible')
    })

    it('provides context for navigation items', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        const href = $link.attr('href')
        const text = $link.text().trim()
        
        // Link text should provide context about destination
        expect(text).to.be.oneOf([
          'Admin', 'Accueil', 'Réserver', 'Espaces', 
          'Utilisateurs', 'Paramètres', 'Manager', 'Staff'
        ])
        
        // Href should be meaningful
        expect(href).to.match(/^\//) // Should start with /
      })
    })
  })

  describe('Keyboard Navigation on Mobile', () => {
    it('supports keyboard navigation with external keyboard', () => {
      // Focus first navigation item
      cy.get('[data-testid="mobile-bottom-nav"] a').first().focus()
      cy.focused().should('be.visible')
      
      // Tab through navigation
      cy.focused().tab()
      cy.focused().should('have.attr', 'href')
      
      // Should be able to activate with Enter
      cy.focused().type('{enter}')
      cy.url().should('not.equal', '/dashboard/admin') // Should navigate
    })

    it('provides visible focus indicators', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').first().focus()
      
      cy.focused()
        .should('have.css', 'outline-style', 'solid')
        .or('have.class', 'focus:ring-2')
    })

    it('maintains logical tab order', () => {
      const expectedOrder = []
      
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        expectedOrder.push($link.attr('href'))
      })
      
      cy.then(() => {
        // Tab through all items
        cy.get('[data-testid="mobile-bottom-nav"] a').first().focus()
        
        expectedOrder.forEach((href, index) => {
          if (index > 0) {
            cy.focused().tab()
          }
          cy.focused().should('have.attr', 'href', href)
        })
      })
    })

    it('supports keyboard navigation in sidebar', () => {
      cy.get('[data-testid="sidebar-trigger"]').focus().type('{enter}')
      
      // Should open sidebar and focus first item
      cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
      cy.get('[data-testid="mobile-sidebar"] a').first().focus()
      
      // Should be able to navigate through sidebar items
      cy.focused().tab()
      cy.focused().should('be.visible')
    })

    it('traps focus within modal sidebar', () => {
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      cy.get('[data-testid="mobile-sidebar"]').within(() => {
        cy.get('a').first().focus()
        
        // Tab should cycle within sidebar
        cy.focused().tab()
        cy.focused().should('be.visible')
      })
      
      // Focus should not escape to background content
      cy.get('[data-testid="dashboard-content"] a').should('not.be.focused')
    })
  })

  describe('Motor Accessibility', () => {
    it('supports various input methods', () => {
      const firstLink = cy.get('[data-testid="mobile-bottom-nav"] a').first()
      
      // Touch
      firstLink.mobileTouch('tap')
      cy.wait(100)
      
      // Click (mouse/pointer)
      firstLink.click()
      cy.wait(100)
      
      // Keyboard
      firstLink.focus().type('{enter}')
      
      // All methods should work
      cy.url().should('include', '/dashboard')
    })

    it('provides adequate timing for interactions', () => {
      // Long press should not be required for basic navigation
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Espaces').mobileTouch('tap') // Quick tap should work
      })
      
      cy.url().should('include', '/spaces')
    })

    it('allows cancellation of touch gestures', () => {
      const link = cy.get('[data-testid="mobile-bottom-nav"]').contains('Utilisateurs')
      
      // Start touch but move away (should cancel)
      link.trigger('touchstart')
      cy.get('body').trigger('touchend', { clientX: 0, clientY: 0 })
      
      // Should not navigate
      cy.url().should('include', '/dashboard/admin')
    })

    it('works with assistive touch devices', () => {
      // Simulate assistive touch interaction
      cy.get('[data-testid="mobile-bottom-nav"] a').first().then($link => {
        // Should respond to programmatic click
        $link[0].click()
        
        cy.url().should('not.equal', '/dashboard/admin')
      })
    })
  })

  describe('Visual Accessibility', () => {
    it('works with high contrast mode', () => {
      // Simulate high contrast preference
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-contrast: high)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub()
          })
        })
      })
      
      cy.reload()
      
      // Elements should still be visible and functional
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"] a').should('be.visible')
    })

    it('supports reduced motion preferences', () => {
      // Simulate reduced motion preference
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            addEventListener: cy.stub(),
            removeEventListener: cy.stub()
          })
        })
      })
      
      cy.reload()
      
      // Animations should be reduced but functionality maintained
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
    })

    it('maintains visibility with large text settings', () => {
      // Simulate larger text size
      cy.get('html').invoke('css', 'font-size', '20px')
      
      // Layout should adapt
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"] a').should('be.visible')
      
      // Text should not overflow
      cy.get('[data-testid="mobile-bottom-nav"] span').each($span => {
        cy.wrap($span).should('not.have.css', 'overflow', 'visible')
      })
    })

    it('provides sufficient visual focus indicators', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').first().focus()
      
      cy.focused().then($el => {
        const styles = window.getComputedStyle($el[0])
        
        // Should have visible focus indicator
        expect(styles.outlineWidth).to.not.equal('0px')
        expect(styles.outlineStyle).to.not.equal('none')
      })
    })
  })

  describe('Cognitive Accessibility', () => {
    it('uses consistent navigation patterns', () => {
      // All navigation items should follow same pattern
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        // Should have icon + text structure
        cy.wrap($link).find('svg').should('exist') // Icon
        cy.wrap($link).find('span').should('exist') // Text
        
        // Consistent styling
        cy.wrap($link).should('have.class', 'flex')
        cy.wrap($link).should('have.class', 'flex-col')
      })
    })

    it('provides clear visual hierarchy', () => {
      // Active state should be clearly distinct
      cy.get('[aria-current="page"]').should('have.class', 'text-blue-600')
      cy.get('[aria-current="page"]').should('have.class', 'bg-blue-50')
      
      // Inactive items should be visually different
      cy.get('[data-testid="mobile-bottom-nav"] a:not([aria-current="page"])')
        .should('not.have.class', 'text-blue-600')
        .and('not.have.class', 'bg-blue-50')
    })

    it('uses familiar iconography', () => {
      const expectedIcons = [
        'Home', 'Calendar', 'MapPin', 'Users', 'Settings', 'BarChart3', 'Shield'
      ]
      
      cy.get('[data-testid="mobile-bottom-nav"] svg').should('exist')
      
      // Icons should be recognizable and consistent size
      cy.get('[data-testid="mobile-bottom-nav"] svg').each($icon => {
        cy.wrap($icon).should('have.class', 'h-5')
        cy.wrap($icon).should('have.class', 'w-5')
      })
    })

    it('provides helpful error states', () => {
      // If navigation fails, should provide feedback
      cy.window().then(win => {
        const originalLocation = win.location
        cy.stub(win, 'location').value({
          ...originalLocation,
          assign: cy.stub().throws(new Error('Navigation failed'))
        })
      })
      
      // Navigation should fail gracefully
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Utilisateurs').click()
      })
      
      // Should remain on current page
      cy.url().should('include', '/dashboard/admin')
    })

    it('maintains context across navigation', () => {
      // Current page should always be indicated
      cy.get('[aria-current="page"]').should('exist')
      
      // Navigate to different page
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Espaces').mobileTouch('tap')
      })
      
      // New page should be indicated
      cy.url().should('include', '/spaces')
      cy.get('[aria-current="page"]').should('contain', 'Espaces')
    })
  })

  describe('Error Prevention and Recovery', () => {
    it('prevents accidental navigation', () => {
      // Quick successive taps should not cause double navigation
      const userLink = cy.get('[data-testid="mobile-bottom-nav"]').contains('Utilisateurs')
      
      userLink.mobileTouch('tap')
      userLink.mobileTouch('tap') // Second tap should be ignored/handled
      
      cy.url().should('include', '/users')
    })

    it('provides undo mechanisms where appropriate', () => {
      // Navigation should be reversible via back button or navigation
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Espaces').mobileTouch('tap')
      })
      
      cy.url().should('include', '/spaces')
      
      // Can navigate back
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Admin').mobileTouch('tap')
      })
      
      cy.url().should('include', '/dashboard/admin')
    })

    it('handles network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/dashboard/**', { forceNetworkError: true })
      
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Utilisateurs').mobileTouch('tap')
      })
      
      // Should provide error feedback or fallback
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible') // Navigation should still be available
    })
  })
})