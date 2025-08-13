# Mobile Testing Guide for Coworking Dashboard

This guide covers the comprehensive mobile testing setup for the coworking platform dashboard, including unit tests, integration tests, and end-to-end mobile testing.

## 📱 Overview

The mobile testing suite covers:
- **Sidebar touch gestures** - Swipe interactions and mobile-specific navigation
- **Mobile navigation** - Bottom navigation bar and responsive behavior
- **Responsive components** - Adaptive layouts across different screen sizes
- **Accessibility mobile** - WCAG compliance and mobile accessibility features

## 🧪 Testing Stack

### Unit Testing (Jest + Vitest)
- **Framework**: Vitest with jsdom environment
- **Testing Library**: React Testing Library
- **Accessibility**: jest-axe for automated accessibility testing
- **Mocks**: MSW for API mocking

### E2E Testing (Cypress)
- **Framework**: Cypress v13.6+
- **Accessibility**: cypress-axe for accessibility testing
- **Mobile Simulation**: Custom commands for mobile interactions
- **Real Events**: cypress-real-events for authentic touch gestures

## 📂 File Structure

```
__tests__/
├── components/
│   └── dashboard/
│       └── mobile/
│           ├── mobile-nav.test.tsx         # Mobile navigation tests
│           ├── sidebar-touch.test.tsx      # Sidebar touch interaction tests
│           ├── responsive.test.tsx         # Responsive behavior tests
│           └── accessibility.test.tsx      # Mobile accessibility tests
│
cypress/
├── e2e/
│   └── mobile/
│       ├── dashboard-navigation.cy.ts     # E2E navigation tests
│       ├── sidebar-gestures.cy.ts         # E2E gesture tests
│       ├── responsive-dashboard.cy.ts     # E2E responsive tests
│       └── accessibility.cy.ts            # E2E accessibility tests
├── support/
│   ├── commands.ts                        # Custom Cypress commands
│   ├── e2e.ts                            # E2E support configuration
│   └── component.ts                      # Component testing support
└── cypress.config.ts                     # Cypress configuration
```

## 🚀 Running Tests

### Unit Tests

```bash
# Run all mobile unit tests
npm run test:mobile

# Watch mode for mobile tests
npm run test:mobile:watch

# Run all tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all mobile E2E tests
npm run test:e2e:mobile

# Open Cypress for mobile testing
npm run cypress:mobile:open

# Run all E2E tests
npm run cypress:run
```

### Complete Test Suite

```bash
# Run all mobile tests (unit + E2E)
npm run test:all:mobile

# Run complete test suite
npm run test:all
```

## 📱 Mobile Viewports Tested

### Smartphones
- **iPhone SE**: 375x667px - Smallest common mobile screen
- **iPhone X**: 375x812px - Standard modern mobile
- **iPhone 12**: 390x844px - Current generation iPhone
- **iPhone 14 Pro**: 393x852px - Latest iPhone with Dynamic Island
- **Android**: 360x640px - Standard Android viewport
- **Samsung S20**: 360x800px - Popular Android device

### Tablets
- **iPad Mini**: 768x1024px - Compact tablet
- **iPad**: 820x1180px - Standard iPad
- **iPad Landscape**: 1024x768px - Tablet in landscape mode

### Desktop (for responsive comparison)
- **Small Desktop**: 1024x768px
- **Medium Desktop**: 1280x1024px
- **Large Desktop**: 1920x1080px

## 🎯 Test Categories

### 1. Mobile Navigation Tests (`mobile-nav.test.tsx`)

Tests the mobile bottom navigation component:

```typescript
// Example test structure
describe('MobileBottomNav', () => {
  it('renders correct navigation items for admin role', () => {
    render(<MobileBottomNav />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Réserver')).toBeInTheDocument()
  })
})
```

**Coverage includes:**
- Role-based navigation items
- Touch-friendly target sizes (48px minimum)
- Active state indication with `aria-current="page"`
- Keyboard navigation support
- Visual feedback for interactions

### 2. Sidebar Touch Tests (`sidebar-touch.test.tsx`)

Tests sidebar mobile interactions and gestures:

```typescript
// Example gesture test
it('opens sidebar with swipe gesture from left edge', async () => {
  render(<SidebarComponent />)
  
  await act(async () => {
    fireEvent.touchStart(document, {
      touches: [{ clientX: 10, clientY: 400 }]
    })
    fireEvent.touchMove(document, {
      touches: [{ clientX: 120, clientY: 400 }]
    })
    fireEvent.touchEnd(document)
  })
  
  expect(mockSetOpenMobile).toHaveBeenCalledWith(true)
})
```

**Coverage includes:**
- Edge swipe gesture recognition
- Touch event handling
- Sidebar open/close states
- Performance during interactions
- Accessibility during gestures

### 3. Responsive Tests (`responsive.test.tsx`)

Tests component adaptation across screen sizes:

```typescript
// Example responsive test
it('adapts to different mobile screen sizes', () => {
  const mobileViewports = [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 414, height: 896 }
  ]
  
  mobileViewports.forEach(viewport => {
    Object.defineProperties(window, {
      innerWidth: { value: viewport.width },
      innerHeight: { value: viewport.height }
    })
    
    const { unmount } = render(<Component />)
    // Test component adaptation
    unmount()
  })
})
```

**Coverage includes:**
- Viewport-specific rendering
- Breakpoint transitions
- Content reflow and truncation
- Touch target scaling
- Orientation change handling

### 4. Accessibility Tests (`accessibility.test.tsx`)

Tests WCAG compliance and mobile accessibility:

```typescript
// Example accessibility test
it('meets WCAG AA accessibility standards', async () => {
  const { container } = render(<MobileNavigation />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

**Coverage includes:**
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Color contrast ratios
- Touch target accessibility
- Focus management

## 🔧 Custom Cypress Commands

### Mobile Viewport Commands

```typescript
// Set predefined mobile viewport
cy.setMobileViewport('iphone-x')

// Test across multiple breakpoints
cy.testResponsiveBreakpoints((viewport) => {
  // Test logic for each viewport
})
```

### Touch Interaction Commands

```typescript
// Mobile touch gestures
cy.mobileTouch('[data-testid="nav-item"]', 'tap')
cy.mobileTouch('[data-testid="button"]', 'longPress')
cy.mobileTouch('[data-testid="link"]', 'doubleTap')

// Swipe gestures
cy.swipe('left', cy.get('[data-testid="sidebar"]'))
cy.edgeSwipe('left', 150) // Swipe from left edge
```

### Accessibility Commands

```typescript
// Check accessibility compliance
cy.checkA11y('[data-testid="navigation"]')

// Check mobile navigation state
cy.checkMobileNavState('open')
cy.checkMobileNavState('closed')
```

## 🎭 Mock Configuration

### Session Mocking

```typescript
const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' // client, staff, manager, admin
  },
  expires: '2024-12-31'
}

mockUseSession.mockReturnValue({
  data: mockSession,
  status: 'authenticated'
})
```

### Sidebar State Mocking

```typescript
const mockSidebarState = {
  isMobile: true,
  setOpenMobile: vi.fn(),
  openMobile: false,
  toggleSidebar: vi.fn(),
  state: 'collapsed'
}
```

## 📊 Test Data Attributes

Use these data-testid attributes in components for reliable testing:

```typescript
// Navigation
[data-testid="mobile-bottom-nav"]
[data-testid="sidebar-trigger"]
[data-testid="mobile-sidebar"]
[data-testid="sidebar-overlay"]

// Content
[data-testid="dashboard-content"]
[data-testid="dashboard-card"]

// States
[aria-current="page"]
[aria-expanded="true|false"]
```

## 🔍 Debugging Tests

### Unit Test Debugging

```bash
# Run tests in debug mode
npm run test:mobile:watch

# View test UI
npm run test:ui
```

### Cypress Debugging

```bash
# Open Cypress in interactive mode
npm run cypress:mobile:open

# Run with video recording
npm run cypress:mobile -- --record
```

### Common Issues

1. **Touch events not working**: Ensure proper touch event setup in test environment
2. **Responsive tests failing**: Check viewport mocking and window resize event handling
3. **Accessibility violations**: Use browser dev tools to inspect ARIA attributes
4. **Gesture recognition**: Verify touch coordinates and timing in gesture tests

## 📈 Coverage Goals

### Unit Tests
- **Components**: 90%+ coverage for mobile components
- **Interactions**: All touch interactions tested
- **Responsive**: All breakpoints covered
- **Accessibility**: All WCAG criteria tested

### E2E Tests
- **User Journeys**: Complete mobile navigation flows
- **Cross-Device**: Testing on multiple viewport sizes
- **Error States**: Network failures and recovery
- **Performance**: Smooth animations and interactions

## 🚀 Continuous Integration

### GitHub Actions Example

```yaml
name: Mobile Tests
on: [push, pull_request]

jobs:
  mobile-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run mobile unit tests
        run: npm run test:mobile
      
      - name: Run mobile E2E tests
        run: npm run test:e2e:mobile
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## 📚 Best Practices

### 1. Test Organization
- Group tests by component and functionality
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mobile-First Testing
- Start tests with mobile viewport
- Test responsive scaling up to desktop
- Consider touch-first interactions

### 3. Accessibility Focus
- Test with screen readers in mind
- Verify keyboard navigation
- Check color contrast and focus indicators

### 4. Performance Considerations
- Test animation smoothness
- Verify 60fps during interactions
- Monitor memory usage during gesture tests

### 5. Real-World Scenarios
- Test with actual mobile devices when possible
- Consider network conditions
- Test with various accessibility settings enabled

## 🔗 Related Documentation

- [Component Documentation](../components/README.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Mobile Design System](./MOBILE_DESIGN.md)

---

This comprehensive testing setup ensures that the coworking platform dashboard provides an excellent mobile experience across all devices and accessibility requirements.