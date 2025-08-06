# Deployment Guide

This guide covers deployment strategies and configurations for the Coworking Platform across different environments.

## Table of Contents

- [Overview](#overview)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

The Coworking Platform supports multiple deployment strategies:

- **Local Development**: Docker Compose for full stack development
- **Staging**: Vercel for frontend apps, Railway/Heroku for API
- **Production**: Vercel + AWS/GCP for scalable deployment
- **Self-hosted**: Docker Compose for complete control

## Environment Configuration

### Environment Variables

Each environment requires specific configuration:

#### Development
```bash
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/coworking-platform
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
API_SECRET_KEY=dev-secret-key
LOG_LEVEL=debug
```

#### Staging
```bash
NODE_ENV=staging
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/coworking-staging
REDIS_URL=redis://redis-staging.cloud.com:6379
NEXTAUTH_URL=https://staging.coworking-platform.com
API_SECRET_KEY=staging-secret-key
LOG_LEVEL=info
SENTRY_DSN=https://...@sentry.io/...
```

#### Production
```bash
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/coworking-production
REDIS_URL=redis://redis-prod.cloud.com:6379
NEXTAUTH_URL=https://coworking-platform.com
API_SECRET_KEY=super-secure-production-key
LOG_LEVEL=warn
SENTRY_DSN=https://...@sentry.io/...
```

### Security Configuration

#### Required Secrets
- `NEXTAUTH_SECRET`: Random 32+ character string
- `API_SECRET_KEY`: Strong API authentication key
- `DATABASE_URL`: MongoDB connection string with authentication
- `STRIPE_SECRET_KEY`: Stripe payment processing key
- `CLOUDINARY_API_SECRET`: Media storage authentication

#### Optional Secrets
- `SENTRY_DSN`: Error tracking
- `GOOGLE_CLIENT_SECRET`: OAuth authentication
- `SMTP_PASSWORD`: Email service authentication

## Local Development

### Quick Start
```bash
# Clone and setup
git clone <repository-url>
cd coworking-platform
pnpm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your configuration

# Start with Docker
pnpm dev:docker

# Or start manually
pnpm db:setup  # Start databases
pnpm dev       # Start all apps
```

### Docker Compose Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart web

# Stop all services
docker-compose down

# Clean everything
docker-compose down -v
docker system prune -af
```

### Manual Development Setup
```bash
# Start databases
docker-compose up -d mongodb redis

# Start applications in separate terminals
pnpm dev:web      # Terminal 1
pnpm dev:dashboard # Terminal 2  
pnpm dev:admin    # Terminal 3
pnpm dev:api      # Terminal 4
```

## Staging Deployment

### Vercel Deployment (Frontend Apps)

#### Setup
1. Connect GitHub repository to Vercel
2. Configure build settings for each app
3. Set environment variables in Vercel dashboard

#### Build Configuration
```json
// vercel.json
{
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/dashboard/package.json", 
      "use": "@vercel/next"
    },
    {
      "src": "apps/admin/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/dashboard/(.*)",
      "dest": "apps/dashboard/$1"
    },
    {
      "src": "/admin/(.*)",
      "dest": "apps/admin/$1"
    },
    {
      "src": "/(.*)",
      "dest": "apps/web/$1"
    }
  ]
}
```

#### Environment Variables (Vercel)
```bash
# Set in Vercel dashboard
NEXTAUTH_URL=https://staging.coworking-platform.vercel.app
NEXT_PUBLIC_API_URL=https://api-staging.railway.app
DATABASE_URL=mongodb+srv://...
NEXTAUTH_SECRET=...
```

### Railway Deployment (API)

#### Setup
1. Connect GitHub repository to Railway
2. Select `apps/api` as root directory
3. Configure environment variables

#### Railway Configuration
```json
// railway.toml
[build]
builder = "nixpacks"
buildCommand = "cd apps/api && pnpm build"

[deploy]
startCommand = "cd apps/api && pnpm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "always"

[env]
NODE_ENV = "staging"
PORT = "3003"
```

## Production Deployment

### AWS Deployment

#### Architecture
- **Frontend**: Vercel or AWS CloudFront + S3
- **API**: AWS ECS or Lambda
- **Database**: MongoDB Atlas
- **Cache**: AWS ElastiCache (Redis)
- **CDN**: CloudFront
- **Monitoring**: CloudWatch + Sentry

#### ECS Deployment
```yaml
# ecs-task-definition.json
{
  "family": "coworking-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/coworking-api:latest",
      "portMappings": [
        {
          "containerPort": 3003,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:region:account:parameter/coworking/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/coworking-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### GCP Deployment

#### Cloud Run
```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: coworking-api
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "1Gi"
        run.googleapis.com/cpu: "1000m"
    spec:
      containerConcurrency: 100
      containers:
      - image: gcr.io/project-id/coworking-api:latest
        ports:
        - containerPort: 3003
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: url
        resources:
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Docker Deployment

### Production Docker Setup

#### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
EXPOSE 3003
CMD ["pnpm", "start"]
```

#### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
      - dashboard
      - admin
      - api

  web:
    build:
      context: .
      target: web
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  dashboard:
    build:
      context: .
      target: dashboard
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  admin:
    build:
      context: .
      target: admin
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  api:
    build:
      context: .
      target: api
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  mongodb:
    image: mongo:7.0
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

### SSL Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream web {
        server web:3000;
    }
    
    upstream dashboard {
        server dashboard:3001;
    }
    
    upstream admin {
        server admin:3002;
    }
    
    upstream api {
        server api:3003;
    }

    server {
        listen 80;
        server_name coworking-platform.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name coworking-platform.com;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        location /api/ {
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /dashboard {
            proxy_pass http://dashboard;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /admin {
            proxy_pass http://admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:

1. **Code Quality Checks**
   - ESLint linting
   - TypeScript type checking
   - Unit tests
   - Security scanning

2. **Build Process**
   - Install dependencies
   - Build all applications
   - Generate artifacts

3. **Deployment**
   - Staging: Deploy on `develop` branch
   - Production: Deploy on `main` branch
   - Rollback: On deployment failure

### Manual Deployment

#### Staging Deployment
```bash
# Deploy to staging
git checkout develop
git pull origin develop
pnpm build
pnpm deploy:staging
```

#### Production Deployment
```bash
# Deploy to production
git checkout main
git pull origin main
pnpm build
pnpm deploy:production
```

## Monitoring & Logging

### Application Monitoring

#### Sentry Setup
```typescript
// sentry.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

#### Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  })
})
```

### Log Management

#### Structured Logging
```typescript
import { logger } from '@coworking/utils'

// Application logs
logger.info('User authenticated', { userId, email })
logger.error('Database connection failed', { error })
logger.warn('High API usage detected', { userId, requestCount })
```

#### Log Aggregation
- **Development**: Console with Pino Pretty
- **Production**: JSON logs to CloudWatch/GCP Logging
- **Monitoring**: Grafana + Loki stack

## Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Docker Rollback
```bash
# Tag previous working image
docker tag coworking-api:latest coworking-api:rollback

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d api
```

### Database Rollback
```bash
# Create backup before deployment
mongodump --uri="mongodb://..." --out=backup-$(date +%Y%m%d)

# Restore if needed
mongorestore --uri="mongodb://..." backup-20231201/
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check build logs
pnpm build --verbose

# Clear cache and rebuild
pnpm clean
pnpm install
pnpm build
```

#### Environment Variable Issues
```bash
# Verify environment variables
printenv | grep -E "(DATABASE|REDIS|NEXTAUTH)"

# Test database connection
mongosh "$DATABASE_URL" --eval "db.adminCommand('ping')"
```

#### Docker Issues
```bash
# Check container logs
docker-compose logs -f api

# Rebuild containers
docker-compose build --no-cache

# Check resource usage
docker stats
```

### Performance Issues

#### Database Performance
```javascript
// Enable slow query logging
db.setProfilingLevel(2, { slowms: 100 })

// Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

#### Application Performance
```bash
# Check memory usage
node --max-old-space-size=4096 dist/index.js

# Profile application
node --prof dist/index.js
```

### Security Issues

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in cert.pem -text -noout | grep "Not After"

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

#### Environment Security
```bash
# Scan for exposed secrets
git secrets --scan

# Check for vulnerabilities
pnpm audit
```

## Maintenance

### Database Maintenance
```bash
# Create regular backups
mongodump --uri="$DATABASE_URL" --gzip --out=backup-$(date +%Y%m%d)

# Optimize database
db.runCommand({ compact: "collection_name" })

# Update indexes
db.collection.createIndex({ field: 1 }, { background: true })
```

### Dependency Updates
```bash
# Check for updates
pnpm deps:outdated

# Update dependencies
pnpm deps:update

# Security updates
pnpm audit fix
```

### Log Rotation
```bash
# Setup logrotate
sudo tee /etc/logrotate.d/coworking-platform << EOF
/var/log/coworking-platform/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 node node
    postrotate
        systemctl reload coworking-platform
    endscript
}
EOF
```