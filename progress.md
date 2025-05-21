# 📝 Development Roadmap

## 🎯 Sprint 1: Setup and Foundation
- [x] Risolvere problemi con i test di registrazione (revisione mock NextResponse e PrismaClient in `frontend/src/app/api/auth/register/route.test.ts`) (Focus: Portafoglio di Markowitz)
- [x] 1.1 Initialize Git repository for "Portafoglio di Markowitz"
- [x] 1.2 Setup Next.js 14 (App Router) development environment with TypeScript
- [x] 1.3 Configure ESLint, Prettier for code quality
- [x] 1.4 Create initial folder structure based on `002-architecture.md`
- [x] 1.5 Setup basic CI/CD pipeline with Vercel
- [x] 1.6 Install base dependencies: Next.js, React, Tailwind CSS, shadcn/ui, NextAuth.js, Prisma, Zod, Jest, React Testing Library, Playwright.

## 🏗️ Sprint 2: Core Features - Data Model & Basic APIs (Focus: Portafoglio di Markowitz)
- [x] 2.1 Define Prisma schema for Users and InvestmentTips (including fields for search, list, details)
- [x] 2.2 Setup PostgreSQL database and run initial migrations with Prisma
- [x] 2.3 Create API endpoints (Next.js API Routes / tRPC) for:
    - [x] 2.3.1 User registration (`/api/auth/register`)
    - [x] 2.3.2 User login (`/api/auth/login`)
    - [x] 2.3.3 Fetching current user (`/api/auth/me`)
    - [x] 2.3.4 Fetching investment tips (list, paginated, filterable - `/api/tips`)
    - [x] 2.3.5 Fetching single investment tip details (`/api/tips/{tipId}`)
- [x] 2.4 Develop base UI components using shadcn/ui:
    - [x] 2.4.1 Layout (Navbar, Footer)
    - [x] 2.4.2 Buttons, Inputs, Cards
- [x] 2.5 Implement basic client-side routing for main pages (Homepage, Tip List, Tip Detail)

## 🔄 Sprint 3: Business Logic - Search & Display (Focus: Portafoglio di Markowitz)
- [x] 3.1 Develop **Ricerca Avanzata di Consigli di Investimento** feature:
  - [x] 3.1.1 Frontend: Implement search bar, filter UI, and logic to call search API
  - [x] 3.1.2 Backend: Implement API logic for tip search
  - [x] 3.1.3 Testing: Unit tests for search logic (backend ✅), component tests for UI (frontend ✅)
- [ ] 3.2 Develop **Lista Dinamica e Curata di Spunti di Investimento** feature:
  - [x] 3.2.1 Frontend: Implement page to display list of tips, pagination, sorting, filtering UI
    - [x] 3.2.2 Backend: Implement API logic for fetching all tips (paginated, sortable, filterable) and single tip by ID - /api/tips & /api/tips/{id}
      - [x] 3.2.3 Testing: Unit tests for list display logic, component tests for UI
- [ ] 3.3 Develop Tip Detail Page:
    - [x] 3.3.1 Frontend: Display all information for a selected tip
     - [x] 3.3.2 Backend: Ensure `/api/tips/{tipId}` provides all necessary data
     - [x] 3.3.3 Testing: Component tests for detail display

## 🌟 Sprint 4: User Features & Initial Testing (Focus: Portafoglio di Markowitz)
- [x] 4.1 Implement User Authentication flow (Registration, Login, Logout) using NextAuth.js
  - [x] 4.1.1 Frontend: Auth pages (Login, Register), UI for user session
  - [x] 4.1.2 Backend: NextAuth.js configuration, credential provider, session handling
  - [x] 4.1.2.1 Created API endpoint for user registration (`/api/auth/register`)
- [ ] 4.2 (Secondary) Develop **Dashboard Utente Personalizzata** (basic - save favorites):
  - [x] 4.2.1 Frontend: UI to save/unsave tips, display list of favorite tips
  - [x] 4.2.2 Backend: API endpoints for managing user favorites (`/api/user/favorites`)
  - [x] 4.2.3 Testing: Unit/integration tests for favorites functionality
- [x] 4.3 Write initial Unit tests for critical backend services (>60% coverage)
  - [x] 4.3.1 Created test file for auth service (`frontend/src/app/api/auth/[...nextauth]/route.test.ts`)
  - [x] 4.3.2 Created test file for tips list service (`frontend/src/app/api/tips/route.test.ts`)
  - [x] 4.3.3 Created test file for single tip service (`frontend/src/app/api/tips/[tipId]/route.test.ts`)
  - [x] 4.3.4 Created test file for registration service (`frontend/src/app/api/auth/register/route.test.ts`)
- [x] 4.4 Write initial Integration tests for API endpoints

## 🔍 Sprint 5: QA, UI/UX Polishing & Documentation (Focus: Portafoglio di Markowitz)
- [x] 5.1 Conduct thorough E2E testing for main workflows (Playwright)
- [ ] 5.2 Refine UI/UX based on feedback and testing:
    - [ ] 5.2.1 Ensure responsive design across Mobile, Tablet, Desktop - IN PROGRESS
    - [ ] 5.2.2 Add subtle animations/transitions with Framer Motion (optional)
    - [x] 5.2.3 Check accessibility (WCAG AA compliance where possible) - Reviewed, no outstanding issues found
    - [x] 5.2.4 Implement Dark/Light mode - Verified
- [x] 5.3 Add UI feedback and microinteractions (loading states, error messages) - Completed for investment-tips, investment-detail, favorites, and auth pages.
  - [x] 5.3.1 Implement loading, error, and no-results states for investment-tips search
  - [x] 5.3.2 Implement loading, error, and not-found states for investment-detail page (`investimenti/[id]/page.tsx`)
  - [x] 5.3.3 Implement loading, error, and no-favorites states for favorites page (`favorites/page.tsx`)
  - [x] 5.3.4 Implement loading and error states for authentication pages (`auth/login/page.tsx`, `auth/register/page.tsx`)
- [ ] 5.4 Review and complete project documentation (README, API docs if needed)
- [ ] 5.5 Perform a security audit (check for XSS, CSRF, SQLi, secure JWT handling)

## 🚀 Sprint 6: Deploy, Launch & Monitoring (Focus: Portafoglio di Markowitz)
- [!] 6.1 Setup production environment on Vercel (Blocked by 404 error - Check Root Directory)
- [ ] 6.2 Performance optimization (image optimization, code splitting, bundle analysis)
- [ ] 6.3 CDN configuration (handled by Vercel)
- [!] 6.4 Deploy beta version for user testing (Blocked by 404 error)
- [ ] 6.5 Gather feedback and make final adjustments
- [!] 6.6 Launch version 1.0 (Blocked by 404 error)
- [ ] 6.7 Setup basic monitoring/logging for production application
