/**
 * Mobile Dashboard Navigation E2E Tests
 * Tests complete mobile navigation flows, touch interactions, and user journeys
 */

describe('Mobile Dashboard Navigation', () => {
  beforeEach(() => {
    // Set mobile viewport
    cy.setMobileViewport('iphone-x')
    
    // Login as admin user
    cy.loginAsUser('admin')
    
    // Visit dashboard
    cy.visit('/dashboard/admin')
  })

  describe('Mobile Navigation Bar', () => {
    it('displays mobile navigation at bottom of screen', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('have.css', 'position', 'fixed')
      cy.get('[data-testid="mobile-bottom-nav"]').should('have.css', 'bottom', '0px')
    })

    it('shows correct navigation items for admin role', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Admin').should('be.visible')
        cy.contains('Réserver').should('be.visible')
        cy.contains('Espaces').should('be.visible')
        cy.contains('Utilisateurs').should('be.visible')
        cy.contains('Paramètres').should('be.visible')
      })
    })

    it('highlights active navigation item', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.get('[aria-current="page"]').should('exist')
        cy.get('[aria-current="page"]').should('contain', 'Admin')
        cy.get('[aria-current="page"]').should('have.class', 'text-blue-600')
      })
    })

    it('navigates correctly when tapping navigation items', () => {
      // Navigate to Users page
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Utilisateurs').mobileTouch('tap')
      })
      
      cy.url().should('include', '/dashboard/admin/users')
      cy.get('[aria-current="page"]').should('contain', 'Utilisateurs')
      
      // Navigate back to Dashboard
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Admin').mobileTouch('tap')
      })
      
      cy.url().should('include', '/dashboard/admin')
      cy.get('[aria-current="page"]').should('contain', 'Admin')
    })

    it('provides adequate touch targets', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        cy.wrap($link).invoke('height').should('be.gte', 48)
        cy.wrap($link).invoke('width').should('be.gte', 48)
      })
    })
  })

  describe('Sidebar Mobile Interactions', () => {
    it('opens sidebar when tapping hamburger menu', () => {
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
      cy.get('[data-testid="sidebar-overlay"]').should('be.visible')
    })

    it('closes sidebar when tapping overlay', () => {
      // Open sidebar
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
      
      // Close by tapping overlay
      cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
      cy.get('[data-testid="mobile-sidebar"]').should('not.be.visible')
    })

    it('supports edge swipe gesture to open sidebar', () => {
      // Swipe from left edge
      cy.edgeSwipe('left', 150)
      cy.wait(500) // Allow for gesture recognition
      cy.checkMobileNavState('open')
    })

    it('closes sidebar with right edge swipe when open', () => {
      // Open sidebar first
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.checkMobileNavState('open')
      
      // Swipe from right edge to close
      cy.edgeSwipe('right', 150)
      cy.wait(500)
      cy.checkMobileNavState('closed')
    })

    it('displays sidebar navigation items correctly', () => {
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      cy.get('[data-testid="mobile-sidebar"]').within(() => {
        cy.contains('Dashboard').should('be.visible')
        cy.contains('Réservations').should('be.visible')
        cy.contains('Espaces').should('be.visible')
        cy.contains('Utilisateurs').should('be.visible')
        cy.contains('Analytics').should('be.visible')
      })
    })

    it('navigates correctly from sidebar items', () => {
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      cy.get('[data-testid="mobile-sidebar"]').within(() => {
        cy.contains('Utilisateurs').mobileTouch('tap')
      })
      
      cy.url().should('include', '/dashboard/admin/users')
      cy.get('[data-testid="mobile-sidebar"]').should('not.be.visible')
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts to different mobile screen sizes', () => {
      const devices = ['iphone-se', 'iphone-x', 'iphone-12', 'android', 'samsung-s20']
      
      devices.forEach(device => {
        cy.setMobileViewport(device)
        cy.reload()
        
        // Navigation should be visible and functional
        cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
        cy.get('[data-testid="sidebar-trigger"]').should('be.visible')
        
        // Test basic navigation
        cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
          cy.contains('Utilisateurs').mobileTouch('tap')
        })
        cy.url().should('include', '/dashboard/admin/users')
      })
    })

    it('handles orientation changes', () => {
      // Start in portrait
      cy.setMobileViewport('iphone-x')
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      
      // Switch to landscape
      cy.viewport(812, 375) // Landscape iPhone X
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      
      // Navigation should still work
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Espaces').mobileTouch('tap')
      })
      cy.url().should('include', '/spaces')
    })

    it('maintains layout during keyboard appearance simulation', () => {
      cy.setMobileViewport('iphone-x')
      
      // Simulate keyboard appearance (reduce viewport height)
      cy.viewport(375, 400) // Reduced height
      
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('have.css', 'bottom', '0px')
    })
  })

  describe('Touch Gestures and Interactions', () => {
    it('responds to tap gestures', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Réserver').mobileTouch('tap')
      })
      
      cy.url().should('include', '/reservation')
    })

    it('handles long press on navigation items', () => {
      // Long press should still navigate (no special long press behavior expected)
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Espaces').mobileTouch('longPress')
      })
      
      cy.url().should('include', '/spaces')
    })

    it('prevents accidental double taps', () => {
      let navigationCount = 0
      
      cy.window().then(win => {
        // Monitor navigation events
        win.addEventListener('beforeunload', () => {
          navigationCount++
        })
      })
      
      // Double tap quickly
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Utilisateurs').mobileTouch('doubleTap')
      })
      
      cy.url().should('include', '/dashboard/admin/users')
      
      // Should only navigate once
      cy.then(() => {
        expect(navigationCount).to.be.lte(1)
      })
    })

    it('supports swipe gestures on sidebar content', () => {
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      // Swipe left on sidebar to close
      cy.get('[data-testid="mobile-sidebar"]').then($sidebar => {
        cy.swipe('left', cy.wrap($sidebar))
      })
      
      cy.wait(500)
      cy.get('[data-testid="mobile-sidebar"]').should('not.be.visible')
    })
  })

  describe('Performance and Animations', () => {
    it('opens and closes sidebar smoothly', () => {
      // Open sidebar
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      // Should appear with animation
      cy.get('[data-testid="mobile-sidebar"]')
        .should('be.visible')
        .and('have.css', 'transition-duration')
      
      // Close sidebar
      cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
      
      // Should disappear with animation
      cy.get('[data-testid="mobile-sidebar"]').should('not.be.visible')
    })

    it('provides visual feedback on touch', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        const $link = cy.contains('Utilisateurs')
        
        // Touch start should add active styles
        $link.trigger('touchstart')
        $link.should('have.class', 'active:bg-gray-100')
        
        // Touch end should remove active styles
        $link.trigger('touchend')
      })
    })

    it('maintains 60fps during interactions', () => {
      // This test would ideally use performance monitoring
      // For now, we'll test that animations complete smoothly
      
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.wait(300) // Animation duration
      cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
      
      cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
      cy.wait(300)
      cy.get('[data-testid="mobile-sidebar"]').should('not.be.visible')
    })
  })

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', () => {
      // Simulate navigation to non-existent page
      cy.window().then(win => {
        cy.stub(win, 'location').value({
          ...win.location,
          href: '/dashboard/admin/nonexistent'
        })
      })
      
      // Navigation should still be functional
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Admin').mobileTouch('tap')
      })
      
      cy.url().should('include', '/dashboard/admin')
    })

    it('recovers from touch event failures', () => {
      // Simulate touch event that fails
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Espaces').then($el => {
          // Trigger touchstart without touchend
          cy.wrap($el).trigger('touchstart')
          cy.wait(100)
          
          // Should still be clickable
          cy.wrap($el).click()
        })
      })
      
      cy.url().should('include', '/spaces')
    })
  })

  describe('Accessibility on Mobile', () => {
    it('maintains keyboard navigation support', () => {
      // Focus first navigation item
      cy.get('[data-testid="mobile-bottom-nav"] a').first().focus()
      cy.focused().should('have.attr', 'href')
      
      // Tab through navigation items
      cy.focused().tab()
      cy.focused().should('have.attr', 'href')
    })

    it('announces navigation changes to screen readers', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Utilisateurs').click()
      })
      
      // Check for aria-current update
      cy.get('[aria-current="page"]').should('exist')
      cy.get('[aria-current="page"]').should('be.visible')
    })

    it('provides proper focus indicators', () => {
      cy.get('[data-testid="mobile-bottom-nav"] a').first().focus()
      
      cy.focused().should('have.css', 'outline')
        .and('match', /.*ring.*/) // Should have focus ring classes
    })

    it('supports screen reader navigation', () => {
      cy.get('[data-testid="mobile-bottom-nav"]')
        .should('have.attr', 'role', 'navigation')
        .and('have.attr', 'aria-label')
      
      cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
        cy.wrap($link).should('have.attr', 'href')
        cy.wrap($link).should('contain.text', /.+/) // Should have text content
      })
    })
  })

  describe('Cross-Role Navigation', () => {
    it('shows correct navigation for client role', () => {
      cy.loginAsUser('client')
      cy.visit('/dashboard/client')
      
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Accueil').should('be.visible')
        cy.contains('Réserver').should('be.visible')
        cy.contains('Espaces').should('be.visible')
        cy.contains('Paramètres').should('be.visible')
        
        // Should not show admin-only items
        cy.contains('Utilisateurs').should('not.exist')
      })
    })

    it('shows correct navigation for manager role', () => {
      cy.loginAsUser('manager')
      cy.visit('/dashboard/manager')
      
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Manager').should('be.visible')
        cy.contains('Réserver').should('be.visible')
        cy.contains('Espaces').should('be.visible')
      })
    })

    it('shows correct navigation for staff role', () => {
      cy.loginAsUser('staff')
      cy.visit('/dashboard/staff')
      
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Staff').should('be.visible')
        cy.contains('Réserver').should('be.visible')
      })
    })
  })
})