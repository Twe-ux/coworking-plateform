# Development Guide

This guide provides detailed information for developers working on the Coworking Platform.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Code Quality](#code-quality)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.0.0 or later
- **pnpm**: 8.0.0 or later 
- **Docker**: Latest version (optional but recommended)
- **Git**: Latest version

### Initial Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd coworking-platform
   pnpm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Database setup**
   ```bash
   # Using Docker (recommended)
   pnpm db:setup
   
   # Or manually start MongoDB and Redis
   ```

4. **Start development**
   ```bash
   # All applications
   pnpm dev
   
   # Or individual apps
   pnpm dev:web
   pnpm dev:dashboard  
   pnpm dev:admin
   pnpm dev:api
   ```

### IDE Configuration

The project includes VS Code settings and extensions recommendations:

- **Settings**: `.vscode/settings.json`
- **Extensions**: `.vscode/extensions.json`
- **Debug configurations**: `.vscode/launch.json`

### Recommended Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Hero
- Vitest Test Explorer
- REST Client

## Project Structure

```
coworking-platform/
├── .github/                 # GitHub workflows and templates
│   ├── workflows/
│   │   ├── ci.yml          # Main CI/CD pipeline
│   │   └── dependabot-auto-merge.yml
│   └── dependabot.yml
├── .husky/                 # Git hooks
│   ├── pre-commit
│   └── commit-msg
├── .vscode/                # VS Code configuration
├── apps/
│   ├── web/                # Customer-facing app (3000)
│   ├── dashboard/          # Business dashboard (3001)
│   ├── admin/              # Admin panel (3002)
│   └── api/                # REST API server (3003)
├── packages/
│   ├── ui/                 # Shared React components
│   ├── database/           # MongoDB models & utilities
│   ├── auth/               # Authentication logic
│   ├── config/             # Environment & constants
│   └── utils/              # Helper functions & logging
├── tools/
│   ├── eslint/             # ESLint configurations
│   ├── typescript/         # TypeScript configurations
│   └── tailwind/           # Tailwind CSS configuration
├── docker/                 # Docker configuration files
├── docs/                   # Project documentation
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── Dockerfile             # Multi-stage Docker build
├── Makefile              # Development shortcuts
├── turbo.json            # Turborepo configuration
└── vitest.config.ts      # Testing configuration
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes
# ... code changes ...

# Run quality checks
pnpm lint:fix
pnpm type-check
pnpm test

# Commit (will trigger pre-commit hooks)
git add .
git commit -m "feat: add user authentication system"

# Push and create PR
git push origin feature/user-authentication
```

### 2. Pre-commit Hooks

Husky automatically runs these checks before each commit:

- **ESLint**: Code linting with auto-fix
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Commitlint**: Conventional commit validation

### 3. Conventional Commits

Use conventional commit format:

```bash
feat: add new feature
fix: bug fix
docs: documentation updates
style: formatting changes
refactor: code refactoring
test: test additions/modifications
chore: maintenance tasks
```

### 4. Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all CI checks pass
4. Request code review
5. Address feedback
6. Merge to `main`

## Testing Strategy

### Unit Testing

- **Framework**: Vitest with jsdom
- **Location**: `*.test.ts` or `*.spec.ts` files
- **Coverage**: Aim for >80% coverage

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# UI interface
pnpm test:ui
```

### Integration Testing

- **API Testing**: Supertest for API endpoints
- **Database Testing**: In-memory MongoDB
- **Component Testing**: React Testing Library

### E2E Testing

- **Framework**: Playwright
- **Location**: `tests/` directory
- **Browsers**: Chromium, Firefox, Safari

```bash
# Run E2E tests
pnpm test:e2e

# Interactive mode
pnpm test:e2e --ui
```

### Test Structure

```typescript
// Example unit test
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

## Code Quality

### ESLint Configuration

- **Base**: `tools/eslint/index.js`
- **Next.js**: `tools/eslint/next.js`
- **Rules**: Extends Airbnb, Prettier, and TypeScript recommended

### Prettier Configuration

- **Config**: `.prettierrc`
- **Ignore**: `.prettierignore`
- **Integration**: Auto-format on save

### TypeScript Configuration

- **Base**: `tools/typescript/base.json`
- **Next.js**: `tools/typescript/nextjs.json`
- **Strict mode**: Enabled for type safety

### Import Organization

```typescript
// 1. External libraries
import React from 'react'
import { NextPage } from 'next'

// 2. Internal packages
import { Button } from '@coworking/ui'
import { logger } from '@coworking/utils'

// 3. Relative imports
import { Layout } from '../components/Layout'
import './styles.css'
```

## Database Management

### MongoDB Setup

```bash
# Start MongoDB with Docker
pnpm db:setup

# Seed database
pnpm db:seed

# Connect to MongoDB shell
docker exec -it coworking-mongodb mongosh
```

### Schema Management

- **Models**: Located in `packages/database/models/`
- **Migrations**: Run through `packages/database/migrations/`
- **Seeding**: Test data in `packages/database/seeds/`

### Database Conventions

```typescript
// Model example
import { Schema, model } from 'mongoose'

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const User = model('User', UserSchema)
```

## API Development

### API Structure

```
apps/api/src/
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── routes/         # Route definitions
├── services/       # Business logic
├── validators/     # Request validation
└── index.ts        # App entry point
```

### Endpoint Development

```typescript
// Example controller
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const user = await UserService.findById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    logger.info('User profile retrieved', { userId })
    res.json(user)
  } catch (error) {
    logger.error('Error fetching user profile', { error })
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Error Handling

- **Consistent format**: Standardized error responses
- **Logging**: Structured logging with context
- **Validation**: Zod schemas for request validation

### API Testing

```typescript
// Example API test
import request from 'supertest'
import { app } from '../src/app'

describe('GET /api/users/profile', () => {
  it('should return user profile', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    expect(response.body).toHaveProperty('email')
  })
})
```

## Frontend Development

### Component Development

```typescript
// Component structure
import { forwardRef } from 'react'
import { cn } from '@coworking/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          {
            'bg-primary text-primary-foreground': variant === 'primary',
            'bg-secondary text-secondary-foreground': variant === 'secondary',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### State Management

- **Local state**: React useState/useReducer
- **Global state**: React Context or Zustand
- **Server state**: TanStack Query (React Query)

### Styling Guidelines

- **Utility-first**: Tailwind CSS classes
- **Components**: Consistent design system
- **Responsive**: Mobile-first approach
- **Dark mode**: Support for theme switching

## Deployment

### Local Development

```bash
# Development mode
pnpm dev

# Production build
pnpm build

# Production preview
pnpm start
```

### Docker Deployment

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Install dependencies**
2. **Lint and type check**
3. **Run tests**
4. **Build applications**
5. **Security scan**
6. **Deploy to staging/production**

### Environment-specific Deployment

- **Development**: Local/Docker Compose
- **Staging**: Vercel/Railway (develop branch)
- **Production**: Vercel/AWS (main branch)

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Dependency issues**
   ```bash
   # Clean and reinstall
   pnpm reset
   ```

3. **Docker issues**
   ```bash
   # Clean Docker environment
   pnpm dev:clean
   ```

4. **Type errors**
   ```bash
   # Clear TypeScript cache
   rm -rf .next/types
   pnpm type-check
   ```

### Performance Issues

1. **Slow builds**
   - Check Turborepo cache: `turbo build --dry`
   - Clear cache: `turbo clean`

2. **Large bundle sizes**
   - Analyze bundles: `pnpm build:analyze`
   - Optimize imports: Tree shaking

### Debugging

1. **VS Code debugging**
   - Use provided launch configurations
   - Set breakpoints in TypeScript files

2. **Console debugging**
   ```bash
   # API debugging
   DEBUG=* pnpm dev:api
   
   # Database queries
   MONGOOSE_DEBUG=true pnpm dev:api
   ```

### Getting Help

1. **Documentation**: Check `/docs` directory
2. **Issues**: Search existing GitHub issues
3. **Team**: Contact development team
4. **Logs**: Check application logs for errors

## Best Practices

### Code Organization

- **Single responsibility**: One concern per function/component
- **Consistent naming**: Use descriptive, consistent names
- **Type safety**: Leverage TypeScript fully
- **Error handling**: Graceful error handling everywhere

### Performance

- **Lazy loading**: Dynamic imports for large components
- **Memoization**: React.memo, useMemo, useCallback
- **Bundle optimization**: Code splitting and tree shaking
- **Image optimization**: Next.js Image component

### Security

- **Input validation**: Validate all user inputs
- **Authentication**: Secure JWT handling
- **Environment variables**: Never commit secrets
- **HTTPS**: Always use HTTPS in production

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: For screen readers
- **Keyboard navigation**: Full keyboard support
- **Color contrast**: Meet WCAG guidelines