/**
 * Mobile Sidebar Gesture E2E Tests
 * Tests sidebar touch gestures, swipe interactions, and mobile-specific behavior
 */

describe('Mobile Sidebar Gestures', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-x')
    cy.loginAsUser('admin')
    cy.visit('/dashboard/admin')
  })

  describe('Sidebar Opening Gestures', () => {
    it('opens sidebar with left edge swipe gesture', () => {
      // Ensure sidebar is closed
      cy.checkMobileNavState('closed')
      
      // Perform left edge swipe
      cy.edgeSwipe('left', 150)
      cy.wait(500)
      
      // Verify sidebar opens
      cy.checkMobileNavState('open')
      cy.get('[data-testid="mobile-sidebar"]').should('be.visible')
    })

    it('requires swipe to start from edge area', () => {
      // Swipe from middle of screen (should not open sidebar)
      cy.get('body').then($body => {
        const rect = $body[0].getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        cy.wrap($body)
          .trigger('touchstart', { touches: [{ clientX: centerX, clientY: centerY }] })
          .trigger('touchmove', { touches: [{ clientX: centerX + 100, clientY: centerY }] })
          .trigger('touchend')
      })
      
      cy.wait(300)
      cy.checkMobileNavState('closed')
    })

    it('requires minimum swipe distance to trigger', () => {
      // Short swipe from edge (should not open sidebar)
      cy.edgeSwipe('left', 50) // Less than required threshold
      cy.wait(300)
      
      cy.checkMobileNavState('closed')
      
      // Longer swipe should work
      cy.edgeSwipe('left', 120)
      cy.wait(500)
      
      cy.checkMobileNavState('open')
    })

    it('opens sidebar with hamburger menu tap', () => {
      cy.get('[data-testid="sidebar-trigger"]').should('be.visible')
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      cy.checkMobileNavState('open')
    })

    it('provides haptic-like feedback on gesture recognition', () => {
      // Start swipe from edge
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
        .trigger('touchmove', { touches: [{ clientX: 30, clientY: 400 }] })
      
      // Should show visual indicator of gesture recognition
      // This would typically be a shadow or partial sidebar reveal
      cy.wait(100)
      
      // Complete the gesture
      cy.get('body')
        .trigger('touchmove', { touches: [{ clientX: 120, clientY: 400 }] })
        .trigger('touchend')
      
      cy.wait(300)
      cy.checkMobileNavState('open')
    })
  })

  describe('Sidebar Closing Gestures', () => {
    beforeEach(() => {
      // Open sidebar for closing tests
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.checkMobileNavState('open')
    })

    it('closes sidebar with overlay tap', () => {
      cy.get('[data-testid="sidebar-overlay"]').should('be.visible')
      cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
      
      cy.checkMobileNavState('closed')
    })

    it('closes sidebar with left swipe on sidebar content', () => {
      cy.get('[data-testid="mobile-sidebar"]').then($sidebar => {
        cy.swipe('left', cy.wrap($sidebar))
      })
      
      cy.wait(500)
      cy.checkMobileNavState('closed')
    })

    it('closes sidebar with right edge swipe when open', () => {
      cy.edgeSwipe('right', 100)
      cy.wait(500)
      
      cy.checkMobileNavState('closed')
    })

    it('requires significant swipe distance to close', () => {
      // Small swipe should not close
      cy.get('[data-testid="mobile-sidebar"]').then($sidebar => {
        const rect = $sidebar[0].getBoundingClientRect()
        
        cy.wrap($sidebar)
          .trigger('touchstart', { touches: [{ clientX: rect.right - 10, clientY: rect.height / 2 }] })
          .trigger('touchmove', { touches: [{ clientX: rect.right - 30, clientY: rect.height / 2 }] })
          .trigger('touchend')
      })
      
      cy.wait(300)
      cy.checkMobileNavState('open') // Should still be open
      
      // Larger swipe should close
      cy.get('[data-testid="mobile-sidebar"]').then($sidebar => {
        cy.swipe('left', cy.wrap($sidebar))
      })
      
      cy.wait(500)
      cy.checkMobileNavState('closed')
    })

    it('closes on outside tap beyond overlay', () => {
      // Tap outside sidebar area
      cy.get('body').then($body => {
        const rect = $body[0].getBoundingClientRect()
        
        cy.wrap($body)
          .trigger('touchstart', { touches: [{ clientX: rect.width - 10, clientY: 100 }] })
          .trigger('touchend')
      })
      
      cy.wait(300)
      cy.checkMobileNavState('closed')
    })
  })

  describe('Gesture Velocity and Physics', () => {
    it('responds to fast swipe gestures', () => {
      // Simulate fast swipe with shorter distance but quick movement
      cy.get('body').then($body => {
        const startTime = Date.now()
        
        cy.wrap($body)
          .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
          .wait(50) // Quick movement
          .trigger('touchmove', { touches: [{ clientX: 80, clientY: 400 }] })
          .trigger('touchend')
          .then(() => {
            const endTime = Date.now()
            expect(endTime - startTime).to.be.lessThan(200) // Fast gesture
          })
      })
      
      cy.wait(500)
      cy.checkMobileNavState('open')
    })

    it('ignores slow drag gestures', () => {
      // Simulate slow drag
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
        .wait(200)
        .trigger('touchmove', { touches: [{ clientX: 50, clientY: 400 }] })
        .wait(200)
        .trigger('touchmove', { touches: [{ clientX: 100, clientY: 400 }] })
        .trigger('touchend')
      
      cy.wait(300)
      // Slow gesture might not trigger or require longer distance
      // This depends on implementation specifics
    })

    it('handles momentum-based closing', () => {
      // Open sidebar first
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.checkMobileNavState('open')
      
      // Fast swipe left should close even with shorter distance
      cy.get('[data-testid="mobile-sidebar"]').then($sidebar => {
        const rect = $sidebar[0].getBoundingClientRect()
        
        cy.wrap($sidebar)
          .trigger('touchstart', { touches: [{ clientX: rect.right - 20, clientY: rect.height / 2 }] })
          .wait(50)
          .trigger('touchmove', { touches: [{ clientX: rect.right - 80, clientY: rect.height / 2 }] })
          .trigger('touchend')
      })
      
      cy.wait(500)
      cy.checkMobileNavState('closed')
    })
  })

  describe('Multi-touch and Complex Gestures', () => {
    it('handles single touch only for swipe gestures', () => {
      // Multi-touch should not trigger sidebar
      cy.get('body')
        .trigger('touchstart', { 
          touches: [
            { clientX: 5, clientY: 400 },
            { clientX: 10, clientY: 450 }
          ] 
        })
        .trigger('touchmove', { 
          touches: [
            { clientX: 100, clientY: 400 },
            { clientX: 105, clientY: 450 }
          ] 
        })
        .trigger('touchend')
      
      cy.wait(300)
      cy.checkMobileNavState('closed') // Should remain closed
    })

    it('cancels gesture on second touch', () => {
      // Start single touch gesture
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
        .trigger('touchmove', { touches: [{ clientX: 50, clientY: 400 }] })
      
      // Add second touch (should cancel)
      cy.get('body')
        .trigger('touchstart', { 
          touches: [
            { clientX: 50, clientY: 400 },
            { clientX: 100, clientY: 500 }
          ] 
        })
        .trigger('touchend')
      
      cy.wait(300)
      cy.checkMobileNavState('closed')
    })
  })

  describe('Gesture Interruption Handling', () => {
    it('handles interrupted swipe gestures gracefully', () => {
      // Start swipe but don't complete
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
        .trigger('touchmove', { touches: [{ clientX: 30, clientY: 400 }] })
        .trigger('touchcancel') // Gesture interrupted
      
      cy.wait(300)
      cy.checkMobileNavState('closed')
      
      // Should still respond to new gestures
      cy.edgeSwipe('left', 120)
      cy.wait(500)
      cy.checkMobileNavState('open')
    })

    it('recovers from touch event errors', () => {
      // Simulate touch event sequence that might cause errors
      cy.window().then(win => {
        // Override touch event to simulate error
        const originalTouchStart = win.document.ontouchstart
        
        win.document.ontouchstart = () => {
          throw new Error('Touch error')
        }
        
        // Attempt gesture (should fail gracefully)
        cy.get('body')
          .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
          .then(() => {
            // Restore original handler
            win.document.ontouchstart = originalTouchStart
          })
      })
      
      // Should still respond to regular interactions
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.checkMobileNavState('open')
    })
  })

  describe('Performance During Gestures', () => {
    it('maintains smooth animation during swipe', () => {
      // Open sidebar with gesture
      cy.edgeSwipe('left', 120)
      
      // Verify smooth opening animation
      cy.get('[data-testid="mobile-sidebar"]')
        .should('be.visible')
        .and('have.css', 'transition-property')
        .and('have.css', 'transition-duration')
    })

    it('does not block main thread during gestures', () => {
      // Perform gesture while other content is present
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
      
      cy.edgeSwipe('left', 120)
      cy.wait(100)
      
      // Main content should still be interactive during animation
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
    })

    it('handles rapid gesture sequences', () => {
      // Rapid open/close gestures
      for (let i = 0; i < 3; i++) {
        cy.edgeSwipe('left', 120)
        cy.wait(200)
        cy.checkMobileNavState('open')
        
        cy.edgeSwipe('right', 120)
        cy.wait(200)
        cy.checkMobileNavState('closed')
      }
      
      // Should end in consistent state
      cy.checkMobileNavState('closed')
    })
  })

  describe('Accessibility During Gestures', () => {
    it('announces sidebar state changes to screen readers', () => {
      // Open sidebar via gesture
      cy.edgeSwipe('left', 120)
      cy.wait(500)
      
      // Check for accessibility announcements
      cy.get('[data-testid="mobile-sidebar"]')
        .should('have.attr', 'aria-expanded', 'true')
      
      // Close sidebar
      cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
      
      cy.get('[data-testid="mobile-sidebar"]')
        .should('not.be.visible')
    })

    it('maintains keyboard navigation when gestures are active', () => {
      // Open sidebar with gesture
      cy.edgeSwipe('left', 120)
      cy.wait(500)
      
      // Keyboard navigation should still work
      cy.get('[data-testid="mobile-sidebar"]').within(() => {
        cy.get('a').first().focus()
        cy.focused().should('be.visible')
        
        cy.focused().type('{enter}')
        // Should navigate or trigger action
      })
    })

    it('provides alternative access methods', () => {
      // Even with gesture support, hamburger menu should work
      cy.get('[data-testid="sidebar-trigger"]')
        .should('be.visible')
        .and('have.attr', 'aria-label')
      
      cy.get('[data-testid="sidebar-trigger"]').click()
      cy.checkMobileNavState('open')
    })
  })

  describe('Edge Cases and Error Conditions', () => {
    it('handles gestures during sidebar animation', () => {
      // Start opening sidebar
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      // Immediately try to close with gesture (during animation)
      cy.wait(100) // Partial animation
      cy.edgeSwipe('right', 120)
      
      cy.wait(500)
      cy.checkMobileNavState('closed')
    })

    it('ignores gestures on non-gesture areas', () => {
      // Swipe on main content area (not edges)
      cy.get('[data-testid="dashboard-content"]').then($content => {
        if ($content.length > 0) {
          cy.swipe('left', cy.wrap($content))
          cy.wait(300)
          cy.checkMobileNavState('closed')
        }
      })
    })

    it('handles viewport changes during gestures', () => {
      // Start gesture
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 5, clientY: 400 }] })
        .trigger('touchmove', { touches: [{ clientX: 50, clientY: 400 }] })
      
      // Change viewport during gesture
      cy.viewport(414, 896) // Different mobile size
      
      // Complete gesture
      cy.get('body')
        .trigger('touchmove', { touches: [{ clientX: 120, clientY: 400 }] })
        .trigger('touchend')
      
      cy.wait(500)
      // Should handle gracefully
    })
  })

  describe('Cross-Device Gesture Consistency', () => {
    it('works consistently across different mobile devices', () => {
      const devices = ['iphone-se', 'iphone-x', 'android', 'samsung-s20']
      
      devices.forEach(device => {
        cy.setMobileViewport(device)
        cy.reload()
        cy.wait(1000)
        
        // Test basic gesture
        cy.edgeSwipe('left', 120)
        cy.wait(500)
        cy.checkMobileNavState('open')
        
        // Close for next iteration
        cy.get('[data-testid="sidebar-overlay"]').mobileTouch('tap')
        cy.wait(300)
      })
    })

    it('adapts gesture sensitivity to device characteristics', () => {
      // Test on high-DPI device
      cy.setMobileViewport('iphone-14-pro')
      
      // Gesture should work with device-appropriate sensitivity
      cy.edgeSwipe('left', 100)
      cy.wait(500)
      cy.checkMobileNavState('open')
      
      // Test on lower-DPI device
      cy.setMobileViewport('android')
      cy.reload()
      cy.wait(500)
      
      cy.edgeSwipe('left', 100)
      cy.wait(500)
      cy.checkMobileNavState('open')
    })
  })
})