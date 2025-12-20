# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an EPM (Enterprise Performance Management) SaaS application built using CCSDD (Contract-Centered Specification Driven Development). The project follows a strict specification-driven approach where specifications are the Single Source of Truth (SSoT) and code is subordinate to specs.

**Core Philosophy:**
- Specifications in `.kiro/` are SSoT, not code
- Contracts-first development: contracts → backend → frontend
- v0.dev UI generation is isolated, validated, then migrated
- Multi-tenant SaaS with Row Level Security (RLS)

## Architecture

This is a pnpm monorepo with three main applications and two shared packages:

```
apps/
├── web/          # Next.js frontend (App Router)
├── api/          # NestJS Domain API
└── bff/          # NestJS Backend-for-Frontend

packages/
├── contracts/    # API/BFF type contracts (SSoT for boundaries)
└── db/          # Prisma schema and migrations
```

**Layer Boundaries (strictly enforced):**
- UI → BFF only (via `@contracts/bff`)
- BFF → Domain API (via `@contracts/api`)
- UI cannot import from `@contracts/api` (violation)

## Development Commands

### Root Level (pnpm workspace)
```bash
# Development
pnpm dev:web        # Start Next.js dev server (port 3000)
pnpm dev:api        # Start Domain API in watch mode
pnpm dev:bff        # Start BFF in watch mode

# Build
pnpm build:web      # Build Next.js production bundle
pnpm build:api      # Build NestJS API
pnpm build:bff      # Build NestJS BFF
```

### Web App (apps/web)
```bash
cd apps/web
pnpm dev            # Next.js development server
pnpm build          # Production build
pnpm start          # Production server
pnpm lint           # ESLint
```

### API/BFF (apps/api or apps/bff)
```bash
cd apps/api         # or apps/bff
pnpm start:dev      # NestJS watch mode
pnpm start:debug    # Debug mode with watch
pnpm build          # Production build
```

### Database (packages/db)
```bash
cd packages/db
pnpm db:generate        # Generate Prisma Client
pnpm db:migrate:dev     # Create and apply migration
pnpm db:push            # Push schema without migration
pnpm db:studio          # Open Prisma Studio
```

### v0.dev UI Integration
```bash
# Fetch UI components from v0.dev
./scripts/v0-fetch.sh <v0_url> <context>/<feature>

# Complete workflow (fetch + review + migrate)
./scripts/v0-integrate.sh <v0_url> <context>/<feature>

# First time setup: login to v0
npx v0 login
```

## Key Architectural Patterns

### 1. CCSDD Development Order (NON-NEGOTIABLE)

All feature development MUST follow this exact order:

1. **Contracts** (`packages/contracts/src/`)
   - BFF contracts first (`bff/<feature>/`)
   - API contracts second (`api/<feature>/`)
   - Shared types last (`shared/`)

2. **Database** (`packages/db/prisma/`)
   - Schema definition
   - Migration creation
   - RLS policies (MUST include tenant_id checks)

3. **Domain API** (`apps/api/src/modules/`)
   - Service layer (business logic)
   - Repository layer (DB access with tenant_id)
   - Controller layer (uses `@epm/contracts/api`)

4. **BFF** (`apps/bff/src/modules/`)
   - Controller (uses `@epm/contracts/bff`)
   - Mapper (transforms API DTOs to BFF DTOs)

5. **UI** (`apps/web/src/features/`)
   - LAST step only after contracts are stable

### 2. v0.dev UI Generation Workflow (Two-Phase)

**Phase 1: Isolated Generation (Testing)**
- Output to: `apps/web/_v0_drop/<context>/<feature>/src/`
- Use `MockBffClient.ts` for testing
- Run structure guards validation
- DO NOT mix with production code yet

**Phase 2: Migration (Integration)**
- Move validated code to: `apps/web/src/features/<context>/<feature>/`
- Replace MockBffClient with HttpBffClient
- Update imports to use `@contracts/bff`
- Register route in `apps/web/src/app/`

### 3. Multi-Tenant Rules (NON-NEGOTIABLE)

**Database Access:**
- All tables MUST have `tenant_id` column
- Repositories MUST accept tenant_id parameter
- RLS policies MUST be enabled (no exceptions)
- Never disable RLS

**Repository Pattern:**
```typescript
// apps/api/src/modules/<context>/<feature>/repository/
class FeatureRepository {
  async findAll(tenantId: string) {
    // MUST use tenant_id in WHERE clause
    return prisma.table.findMany({ where: { tenant_id: tenantId } });
  }
}
```

### 4. Contract Path Aliases

**Frontend (apps/web):**
```typescript
import { EmployeeDto } from '@contracts/bff/employee-master/dto';  // ✅ ALLOWED
import { ApiDto } from '@contracts/api/employee-master/dto';       // ❌ FORBIDDEN
import { Component } from '@/features/master-data/employee-master'; // ✅ ALLOWED
```

**Backend API (apps/api):**
```typescript
import { ApiDto } from '@epm/contracts/api/employee-master/dto';   // ✅ ALLOWED
import { PrismaClient } from '@epm/db';                            // ✅ ALLOWED
```

**Backend BFF (apps/bff):**
```typescript
import { BffDto } from '@epm/contracts/bff/employee-master/dto';   // ✅ ALLOWED
import { ApiDto } from '@epm/contracts/api/employee-master/dto';   // ✅ ALLOWED
```

## Directory Structure Deep Dive

### Frontend Structure (apps/web/src)
```
src/
├── app/                              # Next.js App Router (routes only)
│   └── <context>/<feature>/page.tsx  # Re-exports from features/
├── features/                         # Feature implementations
│   └── <context>/<feature>/
│       ├── page.tsx                  # Main page component
│       ├── components/               # Feature-specific components
│       └── api/                      # BFF client implementations
├── shared/                           # Shared across features
│   ├── ui/                          # Reusable UI components (Tier 1-3)
│   ├── shell/                       # App shell, layout
│   └── navigation/                  # Menu, routing
└── _v0_drop/                        # v0.dev isolation zone (temporary)
```

### Backend API Structure (apps/api/src)
```
src/
└── modules/<context>/<feature>/
    ├── service/                     # Business logic
    ├── repository/                  # Data access (tenant_id required)
    └── controller/                  # REST endpoints
```

### Backend BFF Structure (apps/bff/src)
```
src/
└── modules/<context>/<feature>/
    ├── controller/                  # UI-optimized endpoints
    └── mapper/                      # API DTO → BFF DTO transformation
```

### Contracts Structure (packages/contracts/src)
```
src/
├── api/<feature>/                   # Domain API contracts (BFF → API)
│   ├── dto/
│   ├── enums/
│   └── errors/
├── bff/<feature>/                   # BFF contracts (UI → BFF)
│   ├── dto/
│   ├── enums/
│   └── errors/
└── shared/                          # Minimal shared types only
```

## Specification Files (.kiro/)

**Never modify code without checking specs first.**

### Steering Files (Project Constitution)
- `.kiro/steering/tech.md` - Technology stack (Next.js, NestJS, Prisma, PostgreSQL)
- `.kiro/steering/structure.md` - Directory structure rules
- `.kiro/steering/development-process.md` - CCSDD workflow
- `.kiro/steering/v0-workflow.md` - v0.dev integration rules
- `.kiro/steering/epm-design-system.md` - Design tokens (Deep Teal, Royal Indigo)

### Feature Specs (.kiro/specs/<context>/<feature>/)
```
.kiro/specs/master-data/employee-master/
├── spec.json          # Feature metadata
├── requirements.md    # Requirements (EARS format, Given-When-Then)
├── design.md          # Architecture, responsibilities, contracts
└── tasks.md           # Implementation plan with gates
```

**Development Rule:** When implementing a feature, read these files IN ORDER before writing code.

## Common Patterns

### Adding a New Feature

1. **Create Specification** (before any code):
   ```bash
   # Create spec directory
   mkdir -p .kiro/specs/<context>/<feature>

   # Copy templates from .kiro/settings/templates/specs/
   # Fill in: spec.json, requirements.md, design.md, tasks.md
   ```

2. **Implement Contracts** (SSoT for boundaries):
   ```bash
   # BFF contracts
   mkdir -p packages/contracts/src/bff/<feature>/{dto,enums,errors}

   # API contracts
   mkdir -p packages/contracts/src/api/<feature>/{dto,enums,errors}
   ```

3. **Database Schema**:
   ```bash
   cd packages/db
   # Edit prisma/schema.prisma
   # MUST include: tenant_id, created_at, updated_at
   pnpm db:migrate:dev --name <feature_name>
   ```

4. **Backend API**:
   ```bash
   mkdir -p apps/api/src/modules/<context>/<feature>/{service,repository,controller}
   ```

5. **BFF**:
   ```bash
   mkdir -p apps/bff/src/modules/<context>/<feature>/{controller,mapper}
   ```

6. **Generate UI with v0.dev**:
   ```bash
   # Use template from .kiro/steering/v0-prompt-template-enhanced.md
   # Generate on https://v0.dev
   # Click "Add to Codebase" and copy the command

   cd apps/web
   npx shadcn@latest add "https://v0.app/chat/b/<chat_id>?token=<token>"
   # Files appear in _v0_drop/<context>/<feature>/src/
   ```

7. **Migrate UI to Features**:
   ```bash
   ./scripts/v0-integrate.sh <v0_url> <context>/<feature>
   # or manually:
   mv apps/web/_v0_drop/<context>/<feature>/src/* \
      apps/web/src/features/<context>/<feature>/
   ```

8. **Register Route**:
   ```bash
   mkdir -p apps/web/src/app/<context>/<feature>
   # Create page.tsx that re-exports from features/
   echo "import Page from '@/features/<context>/<feature>/page'; export default Page;" \
     > apps/web/src/app/<context>/<feature>/page.tsx
   ```

### Working with Prisma

**Schema Changes:**
```bash
cd packages/db

# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm db:migrate:dev --name add_project_master

# 3. Generate client (required after schema changes)
pnpm db:generate
```

**Important:** All tables need:
- `id String @id @default(cuid())`
- `tenant_id String` (with index)
- `created_at DateTime @default(now())`
- `updated_at DateTime @updatedAt`
- RLS policy in migration SQL

### BFF Client Pattern (Frontend)

Every feature needs 3 client files in `apps/web/src/features/<context>/<feature>/api/`:

1. **BffClient.ts** (interface):
   ```typescript
   export interface BffClient {
     getEmployees(params: SearchParams): Promise<EmployeeDto[]>;
   }
   ```

2. **MockBffClient.ts** (for v0 testing):
   ```typescript
   export class MockBffClient implements BffClient {
     async getEmployees() { return mockData; }
   }
   ```

3. **HttpBffClient.ts** (production):
   ```typescript
   export class HttpBffClient implements BffClient {
     async getEmployees(params) {
       return fetch('/api/bff/employees', { ... });
     }
   }
   ```

## Important Constraints

### DO NOT
- ❌ Create code before contracts are defined
- ❌ Import `@contracts/api` from frontend (apps/web)
- ❌ Access database without tenant_id in WHERE clause
- ❌ Disable Row Level Security (RLS)
- ❌ Put v0 generated code directly in `apps/web/src/features/`
- ❌ Use raw color literals like `bg-[#...]` (use CSS variables)
- ❌ Create `layout.tsx` in feature directories
- ❌ Mix domain logic into BFF (BFF is mapping/aggregation only)

### DO
- ✅ Read `.kiro/specs/<context>/<feature>/design.md` before coding
- ✅ Follow contracts-first order: contracts → DB → API → BFF → UI
- ✅ Isolate v0 output in `_v0_drop/` first
- ✅ Use design tokens from `.kiro/steering/epm-design-system.md`
- ✅ Include tenant_id in all repository queries
- ✅ Use TypeScript path aliases (`@/`, `@contracts/`)
- ✅ Keep DTOs in camelCase, DB columns in snake_case

## Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components
- v0.dev (UI generation tool)

**Backend:**
- Node.js
- NestJS (modular monolith for API and BFF)
- TypeScript

**Database:**
- PostgreSQL
- Prisma ORM
- Row Level Security (RLS)

**Authentication:**
- Clerk (external IdP)
- Authorization handled in-app

**Package Manager:**
- pnpm (workspaces)

## Design System

The project uses a custom EPM Design System with these colors:
- Primary: Deep Teal `oklch(0.52 0.13 195)`
- Secondary: Royal Indigo `oklch(0.48 0.15 280)`

Component tiers:
- **Tier 1**: Base components (button, input, card, etc.)
- **Tier 2**: Pattern components (data-table, form, dialog, etc.)
- **Tier 3**: Feature-specific compositions

See `.kiro/steering/epm-design-system.md` for complete definitions.

## Testing Strategy

**Database Testing:**
```bash
# PostgreSQL should be running (Docker recommended)
docker run -d \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=epm_trial \
  -p 5432:5432 \
  postgres:16

# Set DATABASE_URL in .env
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/epm_trial"' > packages/db/.env
```

## Common Issues

**Import Path Issues:**
- If `@contracts/*` imports fail, check `tsconfig.json` paths configuration
- Frontend uses `@contracts/*`, backend uses `@epm/contracts/*`

**v0 Integration:**
- If `npx shadcn add` fails, ensure `package.json` includes `"@contracts/bff": "file:../../packages/contracts"`
- When prompted to overwrite package.json, select "N"

**Prisma Client:**
- After schema changes, always run `pnpm db:generate` in packages/db
- If types are stale, delete `node_modules/.prisma` and regenerate

**Multi-tenant:**
- If you see cross-tenant data leaks, check Repository WHERE clauses
- Verify RLS policies in migration files

## Documentation

**Quick Reference:**
- `doc/DEVELOPMENT_PROCESS_GUIDE.md` - Complete CCSDD workflow
- `doc/DOCUMENTATION_INDEX.md` - All documentation organized
- `scripts/README.md` - v0 integration scripts

**Key Steering Docs:**
- `.kiro/steering/tech.md` - Technology decisions
- `.kiro/steering/structure.md` - Architecture rules
- `.kiro/steering/development-process.md` - Development flow
