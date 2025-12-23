# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PMAP-SRVT (Polus Surveys) is a survey management platform for Yukon Government's Public Service Commission - People, Metrics, Analytics and Projects (PMAP) branch. It consists of a monorepo with separate API and web frontend applications that work together to create, distribute, and analyze surveys.

## Architecture

### Monorepo Structure

```
src/
├── api/          # Express.js backend API (TypeScript)
├── web/          # Vue 3 frontend (TypeScript + Vite)
└── app/          # (Legacy/unused)
```

### API (Backend)

**Technology Stack:**
- Express.js with TypeScript
- Auth0 for authentication (JWT)
- Knex.js for database queries
- PostgreSQL/Oracle database support
- Nodemailer for email
- Ollama integration for AI features

**Key Architecture Patterns:**

1. **Environment-based Configuration** (`src/api/src/config.ts`):
   - Loads `.env.development`, `.env.test`, or `.env.production` based on NODE_ENV
   - All config exported from centralized config file
   - Database, Auth0, email, and Ollama settings

2. **API Route Structure**:
   - Public routes: `/api/ai`, `/api/integration`
   - Authenticated routes: `/api/user` (checkJwt + loadUser)
   - Admin routes: `/api/admin/*` (checkJwt + loadUser + requireAdminOrOwner)
   - Static frontend served from `/api/dist/web/` after build

3. **Middleware Chain**:
   - `checkJwt`: Validates Auth0 JWT token
   - `loadUser`: Loads user from database
   - `requireAdminOrOwner`: Checks admin permissions or ownership
   - `requiresAdmin`: Strict admin-only access

4. **Service Layer Pattern**:
   - Services in `src/api/src/services/` (EmailService, DirectoryService, AIService)
   - Routers call services, services handle business logic
   - Services instantiated in routers, not dependency injection

5. **AI Integration** (Ollama):
   - AIService connects to Ollama REST API (default: http://localhost:11434)
   - Supports chat, generate, model management
   - Both streaming and non-streaming responses
   - Environment variables: `OLLAMA_BASE_URL`, `OLLAMA_DEFAULT_MODEL`

### Web (Frontend)

**Technology Stack:**
- Vue 3 with Composition API (Options API style in practice)
- Vuetify 3 for UI components
- Vue Router with nested routes
- Pinia for state management
- Auth0 Vue SDK
- Vite for bundling

**Key Architecture Patterns:**

1. **Module-based Organization**:
   - Two main modules: `authentication` and `administration`
   - Each module has: `views/`, `router/`, `store/`, `modules/` (sub-features)
   - Administration sub-modules: surveys, participants, demographic-groups, emailer, survey-links, ai-assistant

2. **Routing Architecture** (`src/web/src/routes.ts`):
   - Public routes under `/` (DefaultNoAuth layout)
   - Admin routes under `/administration` (Default layout with nav)
   - Each module exports routes merged into main router
   - Route guards: `requireLogin` and `requireAccess` (checks admin/role)

3. **Authentication Flow**:
   - Auth0 integration via `@auth0/auth0-vue`
   - `authGuard` from Auth0 checks authentication
   - Custom `requireAccess` function checks user status and roles
   - User loaded via `waitForUserToLoad()` helper
   - Roles: `IS_ADMIN == 'Y'`, `STATUS == 'Active'`, custom `ROLE` field

4. **State Management** (Pinia):
   - Stores organized per module (e.g., `useAdminSurveyStore`, `useAIAssistantStore`)
   - No global store pattern - feature-specific stores
   - Stores accessed directly in components via `useXStore()`, not mapState/mapActions

5. **AI Assistant Module**:
   - Located: `src/web/src/modules/administration/modules/ai-assistant/`
   - Components: Chat interface, model management UI
   - Store: Manages messages, models, connection state
   - Axios for API calls to `/api/ai` endpoints

## Development Commands

### API Development
```bash
cd src/api
npm install
npm start           # Start development server with nodemon
npm run build       # Build TypeScript to dist/
```

### Web Development
```bash
cd src/web
npm install
npm start           # Start Vite dev server
npm run build       # Build for production
```

### Docker Development
```bash
# Start local development services
docker-compose -f docker-compose.dev.yaml up -d

# Services:
# - PostgreSQL: localhost:5432
# - pgAdmin: localhost:8111
# - Ollama: localhost:11434
```

### Production Build
```bash
# Full production build (uses Dockerfile)
docker build -t pmap-srvt .

# Build process:
# 1. Builds web frontend (creates dist/ with static files)
# 2. Builds API backend (TypeScript to dist/)
# 3. Copies web dist/ into API dist/web/
# 4. Serves everything from single Express server
```

## Important Conventions

### Environment Variables

**API** requires `.env.{environment}` files with:
- `API_PORT` - Default: 3000
- `NODE_ENV` - development/test/production
- `FRONTEND_URL` - For CORS
- `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` - Auth0 config
- `DB_*` - Database connection (supports PostgreSQL and Oracle)
- `MAIL_*` - Email configuration
- `OLLAMA_BASE_URL`, `OLLAMA_DEFAULT_MODEL` - AI configuration

**Web** uses environment config in `src/web/src/config.ts`

### Database

- Knex.js for queries (not ORM)
- Schema/table names configurable via `DB_SCHEMA`, `DB_USER_TABLE`
- Supports both PostgreSQL (`pg`) and Oracle (`oracledb`)
- Connection pooling configured in config

### Authentication & Authorization

**Backend**:
- JWT validation via `express-jwt` and `jwks-rsa`
- User lookup after JWT validation in `loadUser` middleware
- Admin check: `user.IS_ADMIN === 'Y'`
- Status check: `user.STATUS === 'Active'`

**Frontend**:
- Auth0 provides authentication
- `requireAccess` route guard handles authorization
- User state managed in `useUserStore`
- `allow_admin` meta allows admins, `require_admin` restricts to admins only

### Survey Flow

1. **Admin creates survey** → stored in database
2. **Participants added** → via manual entry or demographic groups
3. **Email sent with token** → unique URL per participant
4. **Participant completes survey** → token-based access
5. **Results viewed** → admin dashboard

Token types:
- `/survey/:token` - Public anonymous survey
- `/survey-agent/:token` - Authenticated employee survey
- `/survey-link/:token` - Shareable link
- `/manual-entry/:token` - Manual data entry by admin

### Code Style

**Vue Components**:
- Options API style (not Composition API)
- TypeScript with `lang="ts"`
- Vuetify components prefixed with `v-`
- Direct store access in methods (not mapActions in current codebase pattern)

**API**:
- Services exported as classes
- Routers use express-validator for validation
- Return format: `{ data: {...}, messages: [{ variant, text }] }`
- Error format: `{ error: string, messages: [...] }`

## Common Gotchas

1. **Production Build**: Web app is built first, then copied into API's `dist/web/` directory. API serves both API routes and static frontend.

2. **CORS**: Frontend URL must match `FRONTEND_URL` in API config for CORS to work.

3. **Auth0 Setup**: Both frontend and backend need matching Auth0 configuration. Backend validates JWTs, frontend redirects to Auth0.

4. **Environment Files**: API loads different .env files based on NODE_ENV. Make sure correct environment is set.

5. **AI Features**: Ollama must be running locally or accessible at `OLLAMA_BASE_URL`. Start with small model like `phi` for testing.

6. **Database Switching**: Project supports both PostgreSQL and Oracle. Set `DB_CLIENT` to switch. Oracle requires Oracle Instant Client (see Dockerfile).
