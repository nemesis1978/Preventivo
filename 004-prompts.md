# 🤖 Prompt Engineering for Development

## 🎯 Prompts for development phases for "Portafoglio di Markowitz"

### Initial Setup (Next.js 14, TypeScript, Tailwind, shadcn/ui, PostgreSQL, Prisma, NextAuth.js)
```prompt
Create the initial configuration for a Next.js 14 (App Router) project named "Portafoglio di Markowitz" using the following stack:
1.  **Package.json dependencies:** `next`, `react`, `react-dom`, `tailwindcss`, `shadcn-ui` (and its dependencies like `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`), `next-auth`, `@prisma/client`, `zod`, `typescript`, `@types/react`, `@types/node`, `eslint`, `eslint-config-next`, `prettier`, `prisma` (dev dependency).
2.  **TypeScript configuration (`tsconfig.json`):** Strict mode, ESNext module, JSX preserve, include `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`.
3.  **ESLint (`.eslintrc.json`) and Prettier (`.prettierrc.json`, `.prettierignore`):** Standard Next.js ESLint config, Prettier defaults.
4.  **Tailwind CSS configuration (`tailwind.config.ts`, `postcss.config.js`, `globals.css`):** Setup for Next.js App Router, include `shadcn/ui` preset if available or basic theme setup.
5.  **Prisma setup:** Initialize Prisma with PostgreSQL provider in `prisma/schema.prisma`. Define basic User model (id, email, password, name) and InvestmentTip model (id, title, description, category, riskLevel, content, createdAt, updatedAt).
6.  **NextAuth.js setup (`src/app/api/auth/[...nextauth]/route.ts` or `src/lib/auth.ts`):** Basic setup with Credentials provider for email/password login, using Prisma adapter.
7.  **Basic folder structure:** `src/app`, `src/components/ui`, `src/components/domain`, `src/lib`, `prisma`.
8.  **Testing setup (Jest + React Testing Library - `jest.config.js`, `jest.setup.js`):** Basic configuration for testing React components and utility functions.
```

### Component Architecture (e.g., Investment Tip Card)
```prompt
Create the React component architecture for an "InvestmentTipCard" for the "Portafoglio di Markowitz" project using Next.js 14, TypeScript, and Tailwind CSS (with shadcn/ui components like Card).

The component must:
1.  Accept an `InvestmentTip` object as a prop (define the TypeScript interface for `InvestmentTip` based on the Prisma schema: id, title, description, category, riskLevel).
2.  Display the tip's title, a short description (e.g., first 100 characters), category, and risk level using appropriate shadcn/ui Card components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter).
3.  Include a "Read More" link/button that would navigate to the detailed page of the tip (e.g., `/tips/{tipId}`).
4.  Be styled with Tailwind CSS for a clean and modern look.
5.  Be a client component (`'use client'`).

Provide the full TypeScript code for the component, including necessary imports.
```

### API Endpoint Creation (e.g., Get Investment Tips)
```prompt
Create a Next.js API Route Handler (in `src/app/api/tips/route.ts`) for the "Portafoglio di Markowitz" project to handle GET requests for fetching investment tips.

The endpoint should:
1.  Use Prisma to query the PostgreSQL database for `InvestmentTip` records.
2.  Support pagination using query parameters `page` (default 1) and `limit` (default 10).
3.  Support filtering by `category` and `riskLevel` if provided as query parameters.
4.  Support sorting by `createdAt` (default descending).
5.  Return a JSON response with the list of tips, total number of tips matching criteria, total pages, and current page.
6.  Implement error handling and return appropriate HTTP status codes (e.g., 500 for server errors).
7.  Use Zod for validating query parameters.

Provide the full TypeScript code for the API route handler, including Prisma client initialization and Zod schemas.
```

### Full-Stack Feature Implementation (e.g., User Favorites)
```prompt
Implement the "User Favorites" feature for the "Portafoglio di Markowitz" project. This involves:

1.  **Prisma Schema Update:** Add a relation between `User` and `InvestmentTip` to represent favorites (e.g., a many-to-many relation with an explicit join table `FavoriteTip` or an implicit one).
2.  **Backend API Endpoints (Next.js API Routes / tRPC):**
    *   `POST /api/user/favorites`: Accepts `tipId`. Adds the tip to the current authenticated user's favorites. Requires authentication.
    *   `DELETE /api/user/favorites/{tipId}`: Removes the tip from the current authenticated user's favorites. Requires authentication.
    *   `GET /api/user/favorites`: Returns a list of the current authenticated user's favorite tips. Requires authentication.
3.  **Frontend Component(s):**
    *   A `FavoriteButton` component that takes a `tipId` and current favorite status. It should allow users to toggle the favorite status of a tip.
    *   Update the `InvestmentTipCard` to include the `FavoriteButton`.
    *   A page (e.g., `/dashboard/favorites`) to display the list of the user's favorite tips.
4.  **State Management:** Use TanStack Query (React Query) or SWR to manage the state of favorite tips and optimistically update the UI.
5.  **Authentication:** Ensure all relevant actions are protected and only accessible to authenticated users (using NextAuth.js session).

Provide the necessary Prisma schema modifications, backend API route handlers, and frontend React component code (TypeScript, Tailwind CSS, shadcn/ui).
```