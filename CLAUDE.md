# CLAUDE.md

<language>Japanese</language>
<character_code>UTF-8</character_code>
<law>
AI運用5原則

第1原則： AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

第2原則： AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

第3原則： AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

第4原則： AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

第5原則： AIは全てのチャットの冒頭にこの5原則を逐語的に必ず画面出力してから対応する。
</law>

<every_chat>
[AI運用5原則]

[main_output]

#[n] times. # n = increment each chat, end line, etc(#1, #2...)
</every_chat>

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs on http://localhost:5173)
- `npm run dev:worker` - Start Cloudflare Worker development server with Wrangler
- `npm run dev:full` - Run both frontend and worker development servers concurrently
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally after running build
- `npm run lint` - Run ESLint on all files
- `npm run check` - Full validation (TypeScript check + build + dry-run deploy)

### Cloudflare Workers & Deployment
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare Worker types with Wrangler

### Database Operations (D1)
- `npm run d1:local` - Apply database migrations locally
- `npm run d1:remote` - Apply database migrations to production D1 database
- `wrangler d1 execute DB --local --command="SELECT * FROM table_name"` - Execute SQL queries locally
- `wrangler d1 execute DB --remote --command="SELECT * FROM table_name"` - Execute SQL queries on production

## Architecture Overview

This is a full-stack React application designed to run on Cloudflare Workers with comprehensive integrations:

### Dual Build System
The project uses separate TypeScript configurations for different parts:
- `tsconfig.app.json` - React application (src/react-app/)
- `tsconfig.worker.json` - Cloudflare Worker backend (src/worker/)
- `tsconfig.node.json` - Build tools configuration

### Frontend (React + Vite)
- **Entry point**: `src/react-app/main.tsx`
- **Main component**: `src/react-app/App.tsx`
- **UI Components**: `src/react-app/components/` with shadcn/ui integration
- **Path Alias**: `@/` resolves to `src/react-app/` for clean imports
- Built with Vite and served as static assets from `dist/client/`

### Backend (Hono + Cloudflare Workers)
- **Entry point**: `src/worker/index.ts`
- Uses Hono framework for API routing
- Example API endpoint: `/api/` returns JSON responses
- Configured in `wrangler.json` with Node.js compatibility

### Database & Storage with D1
The project uses Cloudflare D1 (SQLite) for persistent data storage:

- **Database Configuration**: `wrangler.json` defines D1 database binding as "DB"
- **Schema Definition**: `src/db/schema.ts` contains Drizzle ORM schema definitions
- **Database Connection**: `src/db/index.ts` provides database utilities
- **Migration System**: `migrations/` directory contains SQL migration files
- **Drizzle Configuration**: `drizzle.config.ts` for schema generation and migrations

### Shared Architecture with Zod
The project uses a centralized type system powered by Zod schemas:

- **Schema Organization**: `src/shared/schemas/` organized by domain (dify/, line/, chat/)
- **Type Inference**: All TypeScript types automatically inferred from Zod schemas using `z.infer<>`
- **Runtime Validation**: API requests/responses validated using shared schemas
- **Service Integration**: Services in `src/services/` use Zod for data validation
- **React Hooks**: `src/shared/hooks/` provide type-safe API interactions

### Cloudflare Workflows Integration
The project implements Cloudflare Workflows for complex operations:

- **Workflow Definition**: `src/worker/workflows/lineMessageWorkflow.ts`
- **Workflow Binding**: Configured in `wrangler.json` as `LINE_MESSAGE_WORKFLOW`
- **Type Definitions**: `src/worker/types.ts` for workflow parameters
- **Service Integration**: `src/services/LineWebhookService.ts` for LINE messaging

### Key Configuration Files
- `vite.config.ts` - Vite build with React, Cloudflare, and TailwindCSS plugins
- `wrangler.json` - Cloudflare Workers deployment with D1 database and workflows
- `drizzle.config.ts` - Database schema management and migration configuration
- `eslint.config.js` - ESLint configuration with React hooks and TypeScript support

### Development Flow
1. Frontend (React) and backend (Hono Worker) developed separately
2. `npm run dev:full` starts both development servers concurrently
3. Database operations use Drizzle ORM with type-safe queries
4. API calls validated with shared Zod schemas between frontend/backend
5. Production builds create static assets served by Cloudflare Worker

### Project Structure Notes
- **Services Layer**: `src/services/` contains business logic (DifyService, ChatService, LineWebhookService)
- **Shared Code**: `src/shared/` for types, schemas, hooks, and utilities used across frontend/backend
- **Component Architecture**: React components in `src/react-app/components/` use shadcn/ui design system
- **Database Layer**: `src/db/` for schema definitions and database utilities

### Environment Variables
Required environment variables for Drizzle configuration:
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_DATABASE_ID` - D1 database ID  
- `CLOUDFLARE_D1_TOKEN` - API token for D1 database access

### Deployment Architecture
- React assets built to `dist/client/` and served as static files
- Single Page Application routing enabled for client-side navigation
- API routes (`/api/*`) handled by Hono worker before static file serving
- D1 database and Workflows configured for production use
- Observability and source maps enabled for debugging