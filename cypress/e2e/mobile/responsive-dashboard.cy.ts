/**
 * Responsive Dashboard E2E Tests
 * Tests dashboard adaptation across different screen sizes and orientations
 */

describe('Responsive Dashboard', () => {
  const viewports = {
    mobile: {
      'iPhone SE': { width: 375, height: 667 },
      'iPhone X': { width: 375, height: 812 },
      'iPhone 12': { width: 390, height: 844 },
      'Android': { width: 360, height: 640 },
      'Samsung S20': { width: 360, height: 800 }
    },
    tablet: {
      'iPad Mini': { width: 768, height: 1024 },
      'iPad': { width: 820, height: 1180 },
      'iPad Landscape': { width: 1024, height: 768 }
    },
    desktop: {
      'Small Desktop': { width: 1024, height: 768 },
      'Medium Desktop': { width: 1280, height: 1024 },
      'Large Desktop': { width: 1920, height: 1080 }
    }
  }

  beforeEach(() => {
    cy.loginAsUser('admin')
  })

  describe('Mobile Responsive Behavior', () => {
    Object.entries(viewports.mobile).forEach(([deviceName, dimensions]) => {
      it(`adapts correctly for ${deviceName} (${dimensions.width}x${dimensions.height})`, () => {
        cy.viewport(dimensions.width, dimensions.height)
        cy.visit('/dashboard/admin')

        // Mobile navigation should be visible
        cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
        
        // Desktop sidebar should be hidden
        cy.get('[data-testid="desktop-sidebar"]').should('not.be.visible')
        
        // Mobile sidebar trigger should be visible
        cy.get('[data-testid="sidebar-trigger"]').should('be.visible')
        
        // Content should be properly laid out
        cy.get('[data-testid="dashboard-content"]').should('be.visible')
        cy.get('[data-testid="dashboard-content"]').isInViewport()
        
        // Navigation items should be touch-friendly
        cy.get('[data-testid="mobile-bottom-nav"] a').each($link => {
          cy.wrap($link).invoke('height').should('be.gte', 48)
        })
      })
    })

    it('maintains layout integrity on very small screens', () => {
      cy.viewport(320, 568) // iPhone SE (smallest common mobile)
      cy.visit('/dashboard/admin')

      // All essential elements should still be accessible
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="sidebar-trigger"]').should('be.visible')
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
      
      // Text should not overflow
      cy.get('[data-testid="mobile-bottom-nav"] span').each($span => {
        cy.wrap($span).should('have.class', 'truncate')
      })
    })

    it('adapts to very wide mobile screens', () => {
      cy.viewport(428, 926) // iPhone 12 Pro Max
      cy.visit('/dashboard/admin')

      // Should still use mobile layout
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      
      // But may have more space for content
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
      
      // Navigation items might have more spacing
      cy.get('[data-testid="mobile-bottom-nav"] a').should('have.length.at.least', 4)
    })
  })

  describe('Tablet Responsive Behavior', () => {
    Object.entries(viewports.tablet).forEach(([deviceName, dimensions]) => {
      it(`adapts correctly for ${deviceName} (${dimensions.width}x${dimensions.height})`, () => {
        cy.viewport(dimensions.width, dimensions.height)
        cy.visit('/dashboard/admin')

        if (dimensions.width >= 768) {
          // Tablet might show desktop-like layout
          cy.get('[data-testid="desktop-sidebar"]').should('be.visible')
          cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
        } else {
          // Smaller tablets might use mobile layout
          cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
        }

        // Content should be properly sized
        cy.get('[data-testid="dashboard-content"]').should('be.visible')
        cy.get('[data-testid="dashboard-content"]').isInViewport()
      })
    })

    it('handles tablet portrait to landscape transitions', () => {
      // Start in portrait
      cy.viewport(768, 1024)
      cy.visit('/dashboard/admin')
      
      let initialLayout: string
      cy.get('[data-testid="mobile-bottom-nav"]').then($nav => {
        initialLayout = $nav.is(':visible') ? 'mobile' : 'desktop'
      })

      // Switch to landscape
      cy.viewport(1024, 768)
      cy.wait(500) // Allow for responsive transitions

      // Layout might change based on width
      if (initialLayout === 'mobile') {
        // Should switch to desktop layout in landscape
        cy.get('[data-testid="desktop-sidebar"]').should('be.visible')
        cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
      }

      // Content should reflow properly
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
    })
  })

  describe('Desktop Responsive Behavior', () => {
    Object.entries(viewports.desktop).forEach(([deviceName, dimensions]) => {
      it(`displays correctly for ${deviceName} (${dimensions.width}x${dimensions.height})`, () => {
        cy.viewport(dimensions.width, dimensions.height)
        cy.visit('/dashboard/admin')

        // Desktop layout should be active
        cy.get('[data-testid="desktop-sidebar"]').should('be.visible')
        cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
        
        // Mobile sidebar trigger might be hidden
        cy.get('[data-testid="sidebar-trigger"]').should('not.be.visible')
        
        // Content should use available space efficiently
        cy.get('[data-testid="dashboard-content"]').should('be.visible')
        cy.get('[data-testid="dashboard-content"]').isInViewport()
      })
    })

    it('maintains usability on ultra-wide screens', () => {
      cy.viewport(2560, 1440) // Ultra-wide desktop
      cy.visit('/dashboard/admin')

      // Layout should not become too stretched
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
      
      // Sidebar should maintain reasonable width
      cy.get('[data-testid="desktop-sidebar"]').then($sidebar => {
        if ($sidebar.length > 0) {
          cy.wrap($sidebar).invoke('width').should('be.lessThan', 400)
        }
      })
    })
  })

  describe('Orientation Changes', () => {
    it('handles mobile portrait to landscape transition', () => {
      // Start in portrait
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      
      // Switch to landscape
      cy.viewport(812, 375)
      cy.wait(500)
      
      // Should maintain mobile layout but adapt spacing
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
      
      // Check that content is not cut off
      cy.get('[data-testid="dashboard-content"]').isInViewport()
    })

    it('handles landscape to portrait transition smoothly', () => {
      // Start in landscape
      cy.viewport(812, 375)
      cy.visit('/dashboard/admin')
      
      // Switch to portrait
      cy.viewport(375, 812)
      cy.wait(500)
      
      // Should maintain functionality
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
    })

    it('preserves interaction state during orientation changes', () => {
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      // Open sidebar
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      cy.checkMobileNavState('open')
      
      // Change orientation
      cy.viewport(812, 375)
      cy.wait(500)
      
      // Sidebar state should be preserved or handled gracefully
      // (Implementation detail - might close on orientation change)
      cy.get('[data-testid="mobile-sidebar"]').should('exist')
    })
  })

  describe('Responsive Components', () => {
    it('adapts cards and widgets to screen size', () => {
      const testSizes = [
        { width: 320, height: 568 },   // Very small mobile
        { width: 375, height: 812 },   // Standard mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1280, height: 1024 }  // Desktop
      ]

      testSizes.forEach(size => {
        cy.viewport(size.width, size.height)
        cy.visit('/dashboard/admin')

        // Dashboard cards should adapt
        cy.get('[data-testid="dashboard-card"]').then($cards => {
          if ($cards.length > 0) {
            cy.wrap($cards).each($card => {
              cy.wrap($card).should('be.visible')
              cy.wrap($card).isInViewport()
            })
          }
        })

        // Tables should be responsive
        cy.get('table').then($tables => {
          if ($tables.length > 0) {
            if (size.width < 768) {
              // Mobile tables might be horizontally scrollable
              cy.wrap($tables).should('have.css', 'overflow-x', 'auto')
            }
          }
        })
      })
    })

    it('adjusts typography for different screen sizes', () => {
      // Mobile
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      cy.get('h1').should('be.visible')
      cy.get('h1').invoke('css', 'font-size').then(mobileFontSize => {
        
        // Desktop
        cy.viewport(1280, 1024)
        cy.wait(300)
        
        cy.get('h1').invoke('css', 'font-size').then(desktopFontSize => {
          // Desktop font might be larger (depending on design)
          // At minimum, should be readable on both
          expect(parseFloat(mobileFontSize)).to.be.greaterThan(14)
          expect(parseFloat(desktopFontSize)).to.be.greaterThan(14)
        })
      })
    })

    it('adapts button sizes for touch targets', () => {
      cy.viewport(375, 812) // Mobile
      cy.visit('/dashboard/admin')
      
      cy.get('button').each($button => {
        if ($button.is(':visible')) {
          cy.wrap($button).invoke('height').should('be.gte', 44) // Minimum touch target
          cy.wrap($button).invoke('width').should('be.gte', 44)
        }
      })
    })
  })

  describe('Content Overflow and Scrolling', () => {
    it('handles content overflow on small screens', () => {
      cy.viewport(320, 568) // Very small screen
      cy.visit('/dashboard/admin')
      
      // Page should not have horizontal scroll
      cy.get('body').invoke('css', 'overflow-x').should('not.equal', 'scroll')
      
      // Content should wrap or truncate appropriately
      cy.get('[data-testid="dashboard-content"]').should('be.visible')
      cy.get('[data-testid="dashboard-content"]').isInViewport()
    })

    it('maintains vertical scrolling on mobile', () => {
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      // Should be able to scroll vertically if content is long
      cy.get('body').invoke('css', 'overflow-y').should('be.oneOf', ['auto', 'scroll', 'visible'])
      
      // Mobile navigation should remain fixed at bottom
      cy.scrollTo('bottom')
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('have.css', 'position', 'fixed')
    })

    it('handles long content lists on mobile', () => {
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin/users') // Assuming this has a list
      
      // Lists should be scrollable
      cy.get('[data-testid="user-list"], table, .list-container').then($lists => {
        if ($lists.length > 0) {
          // Should not break mobile layout
          cy.wrap($lists).first().should('be.visible')
        }
      })
    })
  })

  describe('Performance Across Viewports', () => {
    it('loads efficiently on mobile devices', () => {
      cy.viewport(375, 812)
      
      const startTime = Date.now()
      cy.visit('/dashboard/admin')
      
      cy.get('[data-testid="dashboard-content"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(5000) // 5 second threshold
      })
    })

    it('handles rapid viewport changes smoothly', () => {
      cy.visit('/dashboard/admin')
      
      const viewportSequence = [
        { width: 375, height: 812 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1280, height: 1024 }, // Desktop
        { width: 375, height: 812 }    // Back to mobile
      ]
      
      viewportSequence.forEach(size => {
        cy.viewport(size.width, size.height)
        cy.wait(200) // Allow for transitions
        
        // Core elements should remain functional
        cy.get('[data-testid="dashboard-content"]').should('be.visible')
      })
    })

    it('maintains interaction responsiveness during resize', () => {
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      // Start an interaction
      cy.get('[data-testid="sidebar-trigger"]').mobileTouch('tap')
      
      // Change viewport during interaction
      cy.viewport(768, 1024)
      cy.wait(300)
      
      // Interaction should complete or be handled gracefully
      cy.get('[data-testid="mobile-sidebar"], [data-testid="desktop-sidebar"]')
        .should('be.visible')
    })
  })

  describe('Breakpoint-Specific Features', () => {
    it('shows/hides features based on breakpoints', () => {
      // Mobile - some features might be hidden
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      cy.get('[data-testid="desktop-sidebar"]').should('not.be.visible')
      
      // Desktop - different feature set
      cy.viewport(1280, 1024)
      cy.wait(300)
      
      cy.get('[data-testid="desktop-sidebar"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
    })

    it('adapts navigation patterns to screen size', () => {
      // Mobile - bottom navigation
      cy.viewport(375, 812)
      cy.visit('/dashboard/admin')
      
      cy.get('[data-testid="mobile-bottom-nav"]').within(() => {
        cy.contains('Admin').mobileTouch('tap')
      })
      cy.url().should('include', '/dashboard/admin')
      
      // Desktop - sidebar navigation
      cy.viewport(1280, 1024)
      cy.visit('/dashboard/admin')
      cy.wait(300)
      
      cy.get('[data-testid="desktop-sidebar"]').within(() => {
        cy.contains('Users').click()
      })
      cy.url().should('include', '/users')
    })
  })
})