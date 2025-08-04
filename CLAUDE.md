# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs on http://localhost:5173)
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on all files
- `npm run check` - Full validation (TypeScript check + build + dry-run deploy)

### Cloudflare Workers
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare Worker types with Wrangler

## Architecture Overview

This is a full-stack React application designed to run on Cloudflare Workers with the following architecture:

### Dual Build System
The project uses separate TypeScript configurations for different parts:
- `tsconfig.app.json` - React application (src/react-app/)
- `tsconfig.worker.json` - Cloudflare Worker backend (src/worker/)
- `tsconfig.node.json` - Build tools configuration

### Frontend (React + Vite)
- **Entry point**: `src/react-app/main.tsx`
- **Main component**: `src/react-app/App.tsx`
- **Assets**: `src/react-app/assets/`
- Built with Vite and served as static assets from `dist/client/`

### Backend (Hono + Cloudflare Workers)
- **Entry point**: `src/worker/index.ts`
- Uses Hono framework for API routing
- Example API endpoint: `/api/` returns JSON with name
- Configured in `wrangler.json` with Node.js compatibility

### Key Configuration Files
- `vite.config.ts` - Vite build configuration with React and Cloudflare plugins
- `wrangler.json` - Cloudflare Workers deployment configuration
- `eslint.config.js` - ESLint configuration with React hooks and TypeScript support

### Development Flow
1. Frontend and backend code are developed separately in their respective directories
2. `npm run dev` starts Vite dev server with HMR
3. API calls from React app to `/api/` routes are handled by the Hono worker
4. Production builds create static React assets served by the Cloudflare Worker

### Deployment
- Assets are built to `dist/client/` and configured as static assets in Wrangler
- Single Page Application routing is enabled for client-side navigation
- Observability and source maps are enabled for production debugging

## Type Safety with Zod

### Shared Schema Architecture
The project uses a centralized type system powered by Zod schemas:

- **Single Source of Truth**: `src/shared/schemas.ts` contains all Zod schemas and type definitions
- **Runtime Validation**: All API requests and responses are validated using Zod schemas
- **Type Inference**: TypeScript types are automatically inferred from Zod schemas using `z.infer<>`
- **Shared Usage**: Same schemas used in both frontend and backend for consistency

### Key Files
- `src/shared/schemas.ts` - Zod schemas and type definitions
- `src/shared/hooks/useDifyApi.ts` - Type-safe React hook for API calls
- `src/shared/index.ts` - Central export point for all shared types and utilities
- `src/worker/services/DifyService.ts` - Backend service with Zod validation
- `src/react-app/components/DifyDatasetManager.tsx` - Example React component

### Benefits
- **Runtime Safety**: Invalid data is caught at runtime, not just compile time
- **API Consistency**: Frontend and backend share identical type definitions
- **Developer Experience**: Auto-completion and type checking throughout the stack
- **Maintainability**: Single place to update types when API changes

## Database & Storage with D1

### D1 Database Integration
The project uses Cloudflare D1 (SQLite) for persistent data storage:

- **Database Configuration**: `wrangler.json` defines D1 database binding
- **Schema Definition**: `src/db/schema.ts` contains Drizzle ORM schema definitions
- **Migration System**: `migrations/` directory contains SQL migration files
- **Type Safety**: Database operations are type-safe using Drizzle ORM

### Key D1 Files
- `src/db/schema.ts` - Database schema definitions with Drizzle ORM
- `src/db/index.ts` - Database connection and query utilities
- `migrations/0001_init.sql` - Initial database schema migration
- `drizzle.config.ts` - Drizzle configuration for schema generation

### Database Operations
- **Automatic Migrations**: Run `wrangler d1 migrations apply DB --remote` for production
- **Local Development**: Database runs locally in `.wrangler/state/`
- **Type Generation**: Schema types are automatically inferred from Drizzle definitions

## Cloudflare Workflows

### Workflow Architecture
The project implements Cloudflare Workflows for complex, multi-step operations:

- **Entry Point**: `src/worker/workflows/lineMessageWorkflow.ts`
- **Workflow Binding**: Configured in `wrangler.json` as `LINE_MESSAGE_WORKFLOW`
- **Step Management**: Each workflow step is durable and can be retried independently
- **Parallel Processing**: Database saves and external API calls run concurrently

### Key Workflow Features
- **Durable Execution**: Steps are persisted and can survive worker restarts
- **Error Handling**: Built-in retry logic with exponential backoff
- **Parallel Steps**: Multiple operations can run simultaneously for performance
- **Type Safety**: Full TypeScript support for workflow parameters and return types

### Workflow Files
- `src/worker/workflows/lineMessageWorkflow.ts` - Main workflow implementation
- `src/worker/types.ts` - Workflow parameter type definitions
- `src/services/LineWebhookService.ts` - Integration with LINE messaging API

### Workflow Benefits
- **Reliability**: Automatic retries and error recovery
- **Performance**: Parallel execution of independent operations
- **Scalability**: Handles high-volume message processing
- **Observability**: Built-in logging and monitoring support