# Coworking Platform 🏢

A modern, scalable coworking platform built with Next.js 14, TypeScript, and MongoDB. This monorepo contains multiple applications for different user roles: customers, business owners, and platform administrators.

## Architecture Overview

This project is organized as a monorepo using Turborepo, featuring multiple applications and shared packages for optimal code reuse and maintainability.

### Applications

- **`apps/web`** - Main customer-facing website (Port 3000)
- **`apps/dashboard`** - Multi-role dashboard for users and café owners (Port 3001)
- **`apps/admin`** - Administrative interface for platform management (Port 3002)
- **`apps/api`** - Standalone API server for external integrations (Port 3003)

### Shared Packages

- **`packages/ui`** - Shared UI components built with shadcn/ui and Radix UI
- **`packages/database`** - MongoDB models, schemas, and database utilities
- **`packages/auth`** - NextAuth configuration and authentication providers
- **`packages/config`** - Environment configuration and constants
- **`packages/utils`** - Shared utility functions and helpers

### Development Tools

- **`tools/eslint`** - Shared ESLint configurations
- **`tools/typescript`** - Shared TypeScript configurations
- **`tools/tailwind`** - Shared Tailwind CSS configuration

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Media**: Cloudinary
- **Build Tool**: Turborepo
- **Package Manager**: pnpm with workspaces

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- pnpm 8.0.0 or later (install with: `npm install -g pnpm`)
- MongoDB instance

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd coworking-platform
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
# Copy environment files for each app
cp apps/web/.env.example apps/web/.env.local
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/api/.env.example apps/api/.env
```

4. Start development servers:

```bash
pnpm dev
```

This will start all applications:

- Web: http://localhost:3000
- Dashboard: http://localhost:3001
- Admin: http://localhost:3002
- API: http://localhost:3003

## Development Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications and packages
- `pnpm lint` - Run ESLint across all packages
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all build artifacts

### Package Management

- `pnpm add <package>` - Add dependency to root
- `pnpm add <package> --filter <workspace>` - Add dependency to specific workspace
- `pnpm -r update` - Update all dependencies in all workspaces

## Project Structure

```
coworking-platform/
├── apps/
│   ├── web/                 # Customer website
│   ├── dashboard/          # User/owner dashboard
│   ├── admin/              # Admin panel
│   └── api/                # Standalone API
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── database/           # Database models
│   ├── auth/               # Authentication
│   ├── config/             # Configuration
│   └── utils/              # Utilities
├── tools/
│   ├── eslint/             # ESLint configs
│   ├── typescript/         # TypeScript configs
│   └── tailwind/           # Tailwind config
├── package.json            # Root package.json
├── turbo.json              # Turborepo configuration
└── README.md
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `npm run lint && npm run type-check`
4. Create a pull request

## Environment Variables

Each application requires specific environment variables. Check the `.env.example` files in each app directory for required variables.

## Deployment

The monorepo is designed for easy deployment to various platforms:

- **Vercel**: Each Next.js app can be deployed separately
- **Docker**: Dockerfiles can be added for containerized deployment
- **API**: The standalone API can be deployed to any Node.js hosting platform

## Architecture Decisions

### Monorepo Benefits

- **Code Sharing**: Common components, utilities, and configurations
- **Consistent Dependencies**: Unified package management
- **Atomic Changes**: Cross-package changes in single commits
- **Simplified CI/CD**: Single repository for all applications

### Package Structure

- **UI Package**: Ensures consistent design system across all apps
- **Database Package**: Centralized data models and schemas
- **Auth Package**: Unified authentication across applications
- **Config Package**: Environment-specific configurations
- **Utils Package**: Shared business logic and helpers

## License

[License details here]
