# MindFlow - Visual Mindmapping Application

## Overview

MindFlow is a modern web application for creating and managing interactive mindmaps. The application features a React-based frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and Replit Auth for user authentication. The system supports real-time mindmap creation, editing, and file operations (import/export) with a clean, intuitive interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Canvas Rendering**: HTML5 Canvas for mindmap visualization
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **Database**: Neon serverless PostgreSQL with connection pooling

### Key Design Decisions

1. **Monorepo Structure**: Single repository with separate client/server directories and shared schema
2. **Canvas-based Rendering**: HTML5 Canvas chosen for optimal performance with complex mindmap visualizations
3. **Real-time Data Flow**: React Query for optimistic updates and cache management
4. **Type Safety**: Full TypeScript coverage with shared types between frontend and backend
5. **Authentication Strategy**: Replit Auth integration for seamless user management

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users Table**: Stores user profile information (mandatory for Replit Auth)
- **Sessions Table**: Express session storage (mandatory for Replit Auth)
- **Mindmaps Table**: JSON-based storage for mindmap data with user ownership
- **Schema Validation**: Drizzle-zod integration for runtime type checking

### Authentication Layer
- **Replit Auth Integration**: OIDC-based authentication with automatic user provisioning
- **Session Management**: Secure session handling with PostgreSQL persistence
- **Protected Routes**: Middleware-based route protection for API endpoints

### Mindmap Engine (`client/src/lib/mindmapEngine.ts`)
- **Canvas Management**: Direct canvas manipulation for optimal performance
- **Node System**: Flexible node types (rectangle, circle, diamond) with customizable styling
- **Connection System**: Multiple connection styles (curved, straight, stepped)
- **Interaction Handling**: Mouse-based drag, select, and edit operations

### File Operations (`client/src/lib/fileManager.ts`)
- **Export Formats**: XML, JSON, and custom .mindmap format support
- **Import Capability**: File parsing and validation for mindmap restoration
- **Data Transformation**: Format conversion between internal and external representations

## Data Flow

### Authentication Flow
1. User initiates login via Replit Auth
2. OIDC callback processes user information
3. User record created/updated in PostgreSQL
4. Session established with encrypted cookie storage

### Mindmap Operations Flow
1. Client requests mindmaps list from `/api/mindmaps`
2. Server validates authentication and queries user-specific mindmaps
3. React Query caches response for optimistic updates
4. Canvas engine renders mindmap data using HTML5 Canvas
5. User interactions trigger local state updates and API calls
6. Server persists changes to PostgreSQL with optimistic locking

### File Operations Flow
1. User initiates export with selected format
2. FileManager transforms internal data structure
3. Browser downloads generated file
4. Import reverses process with validation and error handling

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/**: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library with consistent design

### Authentication Dependencies
- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware for Express
- **connect-pg-simple**: PostgreSQL session store for Express

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: Neon serverless PostgreSQL with development connection string

### Production Build Process
1. Frontend: Vite builds optimized React bundle to `dist/public`
2. Backend: esbuild bundles Node.js server to `dist/index.js`
3. Static files served directly by Express in production mode
4. Database migrations applied via `drizzle-kit push`

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Express session encryption key (required)
- **REPL_ID**: Replit workspace identifier (development)
- **ISSUER_URL**: OIDC issuer endpoint (defaults to Replit)

## Changelog

```
Changelog:
- June 16, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```