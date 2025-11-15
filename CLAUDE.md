# CLAUDE.md - AI Assistant Guide for SFS Status Page

This document provides comprehensive guidance for AI assistants working on this codebase. It explains the project structure, conventions, and patterns to follow when making changes.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Development Workflow](#development-workflow)
6. [Code Conventions](#code-conventions)
7. [Database & Data Layer](#database--data-layer)
8. [Component Patterns](#component-patterns)
9. [Styling Guidelines](#styling-guidelines)
10. [API Development](#api-development)
11. [Common Development Tasks](#common-development-tasks)
12. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Project Overview

**SFS Status Page** is a full-stack uptime monitoring and status page application that allows users to:
- Monitor multiple services and their uptime
- Display real-time system status on a public-facing status page
- Manage incidents and service disruptions
- Track response times and uptime metrics
- Provide internal dashboard for service management

The application is inspired by Linear's clean productivity patterns and Vercel's transparent status page design.

---

## Technology Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.6** - Type safety
- **Wouter 3.3** - Lightweight routing (file-system routing alternative)
- **TanStack Query 5.60** - Server state management
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Component library based on Radix UI
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon system
- **Recharts 2.15** - Data visualization
- **Framer Motion 11.13** - Animations
- **React Hook Form 7.55** - Form management
- **Zod 3.24** - Schema validation

### Backend
- **Express 4.21** - Web framework
- **TypeScript 5.6** - Type safety
- **Drizzle ORM 0.39** - Database ORM
- **Neon Database** - Serverless PostgreSQL
- **Passport.js** - Authentication (configured but not implemented)
- **WebSockets (ws)** - Real-time updates capability

### Build Tools
- **Vite 5.4** - Frontend build tool and dev server
- **tsx** - TypeScript execution for development
- **esbuild** - Backend bundling for production

### Development Environment
- **Replit** - Cloud development platform
- PostgreSQL 16
- Node.js 20

---

## Project Structure

```
/home/user/sfs-status-page/
├── client/                      # Frontend application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/             # shadcn/ui components (DO NOT EDIT manually)
│   │   │   ├── examples/       # Example/template components
│   │   │   └── *.tsx           # Custom feature components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions and setup
│   │   ├── pages/              # Page components (routed)
│   │   ├── App.tsx             # Root application component
│   │   └── main.tsx            # Application entry point
│   └── index.html              # HTML entry point
│
├── server/                      # Backend application
│   ├── index.ts                # Express server setup
│   ├── routes.ts               # API route definitions
│   ├── storage.ts              # Data layer abstraction
│   └── vite.ts                 # Vite integration for dev/prod
│
├── shared/                      # Shared types and schemas
│   └── schema.ts               # Drizzle database schema + Zod schemas
│
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── drizzle.config.ts           # Drizzle ORM configuration
├── components.json             # shadcn/ui configuration
└── design_guidelines.md        # Design system documentation
```

### Key Directory Purposes

- **`client/src/components/ui/`** - Auto-generated shadcn/ui components. Add new ones with `npx shadcn@latest add [component]`. DO NOT manually edit these files.
- **`client/src/components/`** - Custom application-specific components
- **`client/src/pages/`** - Top-level page components (StatusPage, Dashboard, NotFound)
- **`shared/schema.ts`** - Single source of truth for database schema and TypeScript types
- **`server/storage.ts`** - Data access layer (currently in-memory, designed for database migration)

---

## Architecture Patterns

### Full-Stack TypeScript Monorepo

This is a **monorepo** with shared TypeScript code between frontend and backend:

- **Shared schemas**: Database schemas and validation live in `shared/schema.ts`
- **Type inference**: Types are derived from Drizzle schemas using `$inferSelect` and Zod schemas
- **Path aliases**: `@/` for client code, `@shared/` for shared code

### Client-Server Communication

Currently implemented as a **traditional REST-style architecture**:

1. Frontend makes HTTP requests to `/api/*` endpoints
2. Backend responds with JSON
3. TanStack Query manages caching and synchronization

### Data Layer Architecture

The application uses a **storage interface pattern**:

```typescript
// server/storage.ts
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}
```

**Current Implementation**: `MemStorage` (in-memory)
**Intended Migration Path**: Create `DatabaseStorage` implementing `IStorage` using Drizzle ORM

This abstraction allows swapping storage backends without changing route code.

### Component Architecture

Following **composition over configuration**:

- UI primitives from shadcn/ui (`Button`, `Card`, `Dialog`, etc.)
- Feature components compose UI primitives (`ServiceCard`, `IncidentCard`)
- Page components orchestrate feature components
- Minimal prop drilling using React Context where needed

### State Management Strategy

- **Server State**: TanStack Query (`queryClient.ts`)
- **Form State**: React Hook Form with Zod validation
- **UI State**: React `useState` and `useReducer` (local component state)
- **Theme State**: `next-themes` for dark mode
- **No global state library** (Redux, Zustand, etc.) - intentionally kept simple

---

## Development Workflow

### Starting the Application

```bash
# Development mode (recommended)
npm run dev
# Starts both Vite dev server and Express backend
# Frontend: Hot module reload
# Backend: Auto-restart with tsx watch
# Access at: http://localhost:5000

# Production build
npm run build
npm run start
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (for Neon Database)

Optional:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

### Database Management

```bash
# Push schema changes to database
npm run db:push

# This uses drizzle-kit to sync shared/schema.ts to the database
# WARNING: This can be destructive in production
```

### Type Checking

```bash
npm run check
# Runs TypeScript compiler without emitting files
# Use this to verify types before committing
```

---

## Code Conventions

### TypeScript

1. **Strict Mode**: Always enabled (`strict: true`)
2. **No Implicit Any**: Avoid `any` types, use `unknown` if type is truly unknown
3. **Type Inference**: Prefer inferred types from Drizzle/Zod schemas over manual type definitions
4. **Module Resolution**: Use `bundler` mode with path aliases

Example:
```typescript
// ✅ Good - Inferred from schema
import { type User } from "@shared/schema";

// ❌ Avoid - Manual type duplication
type User = {
  id: string;
  username: string;
  password: string;
};
```

### Import Organization

Follow this order:
1. External libraries (React, third-party)
2. Internal UI components (`@/components/ui`)
3. Internal feature components (`@/components`)
4. Hooks (`@/hooks`)
5. Utils (`@/lib`)
6. Shared types (`@shared`)
7. Icons and assets

```typescript
// Example
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { type User } from "@shared/schema";
import { Server } from "lucide-react";
```

### File Naming

- **Components**: PascalCase (e.g., `ServiceCard.tsx`)
- **Utilities**: camelCase (e.g., `queryClient.ts`)
- **Pages**: PascalCase (e.g., `Dashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-toast.ts`)

### Component Export Pattern

```typescript
// ✅ Named export for re-exporting
export function ServiceCard({ ... }: ServiceCardProps) {
  return <Card>...</Card>;
}

// ✅ Default export for pages
export default function Dashboard() {
  return <div>...</div>;
}
```

---

## Database & Data Layer

### Schema Definition

All database schemas live in `shared/schema.ts` using Drizzle ORM:

```typescript
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Auto-generate Zod schema from Drizzle schema
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Infer TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
```

### Adding New Database Tables

1. **Define in `shared/schema.ts`**:
```typescript
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("operational"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services);
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
```

2. **Update Storage Interface** (`server/storage.ts`):
```typescript
export interface IStorage {
  // Existing methods...
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<Service>): Promise<Service>;
  deleteService(id: string): Promise<void>;
}
```

3. **Implement in Storage Class**:
```typescript
export class MemStorage implements IStorage {
  private services: Map<string, Service> = new Map();

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }
  // ... implement other methods
}
```

4. **Run Database Migration**:
```bash
npm run db:push
```

### Data Validation Pattern

Always validate data at API boundaries using Zod:

```typescript
app.post("/api/services", async (req, res) => {
  // Validate request body
  const result = insertServiceSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid service data",
      errors: result.error.errors
    });
  }

  const service = await storage.createService(result.data);
  res.json(service);
});
```

---

## Component Patterns

### shadcn/ui Components

**DO NOT manually edit files in `client/src/components/ui/`**

To add new shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

Common components already installed:
- Layout: `card`, `separator`, `scroll-area`, `tabs`, `sidebar`
- Forms: `input`, `button`, `select`, `checkbox`, `form`, `label`
- Overlays: `dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu`
- Feedback: `alert`, `toast`, `progress`, `skeleton`
- Data: `table`, `badge`, `avatar`, `calendar`

### Custom Component Pattern

Feature components should:
1. Accept typed props with interface
2. Use shadcn/ui primitives for consistent styling
3. Include data-testid attributes for testing
4. Handle loading and error states
5. Be responsive by default

Example:
```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";

interface ServiceCardProps {
  name: string;
  status: "operational" | "degraded" | "down";
  uptime: string;
  onClick?: () => void;
}

export function ServiceCard({ name, status, uptime, onClick }: ServiceCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
      data-testid={`card-service-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{name}</h3>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{uptime}%</div>
        <div className="text-sm text-muted-foreground">Uptime (30d)</div>
      </CardContent>
    </Card>
  );
}
```

### Dialog/Modal Pattern

Use shadcn/ui `Dialog` for modals:

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AddServiceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Service</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Form Pattern

Use React Hook Form + Zod:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ServiceForm() {
  const form = useForm({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      url: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof insertServiceSchema>) => {
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Create Service</Button>
      </form>
    </Form>
  );
}
```

---

## Styling Guidelines

### Design System Reference

See `design_guidelines.md` for comprehensive design specifications. Key principles:

1. **Information hierarchy over decoration**
2. **Instant status recognition through clear visual states**
3. **Data density without overwhelming complexity**
4. **Trust through transparency and professional polish**

### Tailwind Configuration

Custom design tokens in `tailwind.config.ts`:

```typescript
// Status colors (use these for service status)
status: {
  operational: "hsl(142 76% 36%)",  // Green
  degraded: "hsl(43 96% 56%)",       // Yellow
  down: "hsl(0 84% 60%)",            // Red
}
```

### Typography System

From `design_guidelines.md`:

- **Page Titles**: `text-3xl font-bold`
- **Section Headers**: `text-xl font-semibold`
- **Service Names**: `text-lg font-medium`
- **Metrics/Stats**: `text-2xl font-bold tabular-nums`
- **Body Text**: `text-sm`
- **Labels/Meta**: `text-xs font-medium uppercase tracking-wide`

### Spacing System

Use Tailwind spacing units consistently:

- **Component padding**: `p-4` to `p-6`
- **Section spacing**: `space-y-6` to `space-y-8`
- **Card gaps**: `gap-4` to `gap-6`
- **Container max-width**: `max-w-7xl` (dashboard), `max-w-5xl` (public pages)

### Responsive Patterns

Follow mobile-first approach:

```typescript
// Example: 1 column mobile, 2 tablet, 3 desktop
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Items */}
</div>
```

Standard breakpoints:
- `md:` - 768px (tablets)
- `lg:` - 1024px (desktops)

### Dark Mode Support

Use Tailwind's dark mode with `next-themes`:

```typescript
// Automatically adapts based on theme
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    {/* Content */}
  </Card>
</div>
```

**DO NOT hardcode colors** - always use semantic tokens (`background`, `foreground`, `muted`, etc.)

---

## API Development

### Route Structure

API routes are defined in `server/routes.ts`:

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix all routes with /api

  app.get("/api/services", async (req, res) => {
    const services = await storage.getAllServices();
    res.json(services);
  });

  app.post("/api/services", async (req, res) => {
    // Validate with Zod schema
    const result = insertServiceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const service = await storage.createService(result.data);
    res.json(service);
  });

  const httpServer = createServer(app);
  return httpServer;
}
```

### API Conventions

1. **Prefix**: All API routes start with `/api`
2. **RESTful patterns**:
   - `GET /api/resources` - List all
   - `GET /api/resources/:id` - Get one
   - `POST /api/resources` - Create
   - `PUT/PATCH /api/resources/:id` - Update
   - `DELETE /api/resources/:id` - Delete
3. **Validation**: Always validate request bodies with Zod
4. **Error handling**: Return consistent error format
5. **Status codes**: Use appropriate HTTP status codes

### Error Response Pattern

```typescript
// Validation error
res.status(400).json({
  message: "Validation failed",
  errors: zodError.errors
});

// Not found
res.status(404).json({
  message: "Service not found"
});

// Server error
res.status(500).json({
  message: "Internal server error"
});
```

### Frontend API Integration

Use TanStack Query for data fetching:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch data
export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json() as Promise<Service[]>;
    },
  });
}

// Mutate data
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: InsertService) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      if (!res.ok) throw new Error("Failed to create service");
      return res.json() as Promise<Service>;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
```

---

## Common Development Tasks

### Adding a New Page

1. Create page component in `client/src/pages/`:
```typescript
// client/src/pages/Analytics.tsx
export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </main>
    </div>
  );
}
```

2. Add route in `client/src/App.tsx`:
```typescript
import Analytics from "@/pages/Analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StatusPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

### Adding a New API Endpoint

1. Update storage interface in `server/storage.ts`
2. Implement method in `MemStorage` class
3. Add route in `server/routes.ts`
4. Create frontend hook using TanStack Query
5. Use hook in component

### Adding a New Feature Component

1. Create component file in `client/src/components/`
2. Use shadcn/ui primitives for UI
3. Add TypeScript interface for props
4. Include data-testid attributes
5. Export as named export

### Migrating from In-Memory to Database Storage

Current state: Using `MemStorage` class with in-memory Maps

To migrate:

1. Create `DatabaseStorage` class implementing `IStorage`:
```typescript
import { db } from "./db"; // Drizzle database instance
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // ... implement other methods
}
```

2. Create database connection in `server/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

3. Update `server/storage.ts`:
```typescript
// export const storage = new MemStorage();
export const storage = new DatabaseStorage();
```

---

## Important Notes for AI Assistants

### DO NOT Edit These Files Manually

- `client/src/components/ui/*` - shadcn/ui components (use CLI to add/update)
- `package-lock.json` - Use npm commands instead
- `node_modules/` - Generated directory
- `dist/` - Build output

### Always Check Before Making Changes

1. **Design Guidelines**: Review `design_guidelines.md` for UI/UX patterns
2. **Existing Components**: Check if similar component exists before creating new one
3. **Type Safety**: Ensure TypeScript types are properly inferred from schemas
4. **Responsive Design**: Test changes at mobile, tablet, and desktop breakpoints

### Common Gotchas

1. **Path Aliases**: Use `@/` for client imports, `@shared/` for shared code
2. **Status Values**: Use exact string literals: `"operational" | "degraded" | "down"`
3. **Data Attributes**: Add `data-testid` to interactive elements for testing
4. **Dark Mode**: Use semantic color tokens, not hardcoded colors
5. **API Prefix**: All backend routes must start with `/api`

### Best Practices for AI Assistance

1. **Incremental Changes**: Make small, focused changes rather than large rewrites
2. **Type-First**: Define TypeScript interfaces/types before implementation
3. **Component Reuse**: Check for existing patterns before creating new components
4. **Validation**: Always validate user input with Zod schemas
5. **Error Handling**: Provide user-friendly error messages
6. **Accessibility**: Ensure components are keyboard-navigable and screen-reader friendly
7. **Performance**: Use React.memo, useMemo, useCallback where appropriate for expensive operations

### Testing Strategy

While no formal tests exist yet, when adding features:

1. Add `data-testid` attributes to testable elements
2. Follow naming convention: `data-testid="type-description-identifier"`
   - Examples: `card-service-api`, `button-add-service`, `input-service-name`
3. This prepares codebase for future test implementation

### When in Doubt

1. Check `design_guidelines.md` for design decisions
2. Look at existing components for patterns (e.g., `ServiceCard`, `Dashboard`)
3. Follow TypeScript compiler errors/warnings
4. Keep changes minimal and focused
5. Ask for clarification rather than making assumptions

---

## Quick Reference

### File Structure at a Glance

```
client/src/
  ├── components/
  │   ├── ui/              # shadcn/ui (don't edit)
  │   ├── examples/        # Component examples
  │   └── *.tsx            # Feature components
  ├── pages/               # Route pages
  ├── hooks/               # Custom hooks
  └── lib/                 # Utils

server/
  ├── index.ts             # Express setup
  ├── routes.ts            # API routes
  └── storage.ts           # Data layer

shared/
  └── schema.ts            # Database schema + types
```

### Essential Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run check        # Type check
npm run db:push      # Sync database schema
```

### Key Dependencies

- React + TypeScript + Vite
- Wouter (routing)
- TanStack Query (data fetching)
- Tailwind + shadcn/ui (styling)
- Drizzle ORM + Neon (database)
- Express (backend)

---

**Last Updated**: 2025-11-15
**Codebase Version**: Initial setup with StatusPage and Dashboard views

For questions about this codebase, refer to this document first. If something is unclear or missing, consult the source code and update this document accordingly.
