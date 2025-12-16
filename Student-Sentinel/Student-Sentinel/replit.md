# Smart Student Attendance System

## Overview

A professional student attendance tracking system designed for educators. The application allows professors to manage students, take attendance for class sessions, view attendance history, and access dashboard analytics. Built with a modern React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a page-based architecture with four main routes:
- Dashboard (/) - Overview stats and quick actions
- Students (/students) - Student management CRUD
- Attendance (/attendance) - Take attendance for sessions
- History (/history) - View attendance records

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Storage**: Google Cloud Storage integration for student photos
- **Build**: esbuild for production bundling

### Data Storage
- **Database**: PostgreSQL (provisioned via DATABASE_URL environment variable)
- **Schema**: Three main tables - students, sessions, attendance_records
- **Migrations**: Drizzle Kit for schema management (`db:push` command)

### Design System
The application follows design guidelines inspired by modern productivity tools (Linear, Notion):
- Clean, professional minimalism
- Inter font family
- Consistent spacing using Tailwind's 2/4/6/8 unit system
- Two-column layout with fixed sidebar navigation
- Light and dark theme support with CSS custom properties

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Cloud Services
- **Google Cloud Storage**: Object storage for student photos via `@google-cloud/storage`
- **Replit Sidecar**: Authentication proxy for GCS credentials (port 1106)

### Key NPM Packages
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives for shadcn components
- **@uppy/***: File upload handling with AWS S3 compatible storage
- **date-fns**: Date formatting and manipulation
- **zod**: Runtime schema validation for forms and API requests
- **drizzle-zod**: Auto-generated Zod schemas from Drizzle tables

### Development Tools
- **Vite**: Development server with HMR
- **tsx**: TypeScript execution for server
- **drizzle-kit**: Database migration tooling