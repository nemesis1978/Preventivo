# 🏗️ System Architecture

## 📊 Structural Diagram
```mermaid
graph TD
    A[Frontend (Next.js, Tailwind, shadcn/ui)] --> B[API Layer (Next.js API Routes / tRPC)]
    B --> C[Backend Services (Node.js/Express)]
    C --> D[Database (PostgreSQL)]
    C --> E[External APIs (Financial Data APIs - if used)]
```

## 🗂️ Folder Structure
```
project-root/
├── frontend/ (Next.js app, can be top-level if full-stack Next.js)
│   ├── src/
│   │   ├── app/ (App Router)
│   │   │   ├── (api)/         # API Routes / tRPC
│   │   │   ├── (auth)/        # Authentication pages & logic
│   │   │   ├── (dashboard)/   # User dashboard pages
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx       # Homepage
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components & custom UI elements
│   │   │   ├── domain/        # Domain-specific components (e.g., InvestmentCard)
│   │   │   └── layout/
│   │   ├── lib/             # Utility functions, helpers, constants
│   │   ├── hooks/
│   │   ├── services/        # Client-side data fetching services
│   │   └── styles/
│   ├── public/
│   ├── next.config.js
│   └── package.json
├── backend/  (Separate if Node.js/Express is chosen over Next.js API routes for complex logic)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/ (Database models/schemas - e.g., Prisma)
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
├── database/
│   ├── migrations/
│   └── schema.prisma (If using Prisma ORM)
└── docs/               # Project documentation (PRD, architecture, etc.)
```

## 🔄 Data Flows
1.  **User Authentication:** 
    -   Frontend (Login Form) → API Layer (Auth Endpoint) → Backend (Verify Credentials, Generate JWT) → Database (Store/Check User)
    -   JWT stored in client (HttpOnly cookie) for subsequent requests.
2.  **Investment Tip Search/Display:**
    -   Frontend (Search bar/Filters) → API Layer (Search Endpoint with query params) → Backend (Query Database for tips) → Database (Return matching tips)
    -   Frontend (List Page) → API Layer (Get All/Paginated Tips) → Backend → Database
3.  **Saving Favorite Tip:**
    -   Frontend (Click 'Save' on a Tip) → API Layer (Save Favorite Endpoint with Tip ID, User ID) → Backend (Store association in Database) → Database
4.  **Error Handling:**
    -   Client-side validation errors displayed directly in UI.
    -   API errors (4xx, 5xx) returned as JSON responses, handled by frontend to display user-friendly messages.
    -   Logging on backend for server errors.

## 🔌 API Endpoints
(Assuming RESTful approach with Next.js API Routes or Express. If tRPC, structure will differ)

| Endpoint                 | Method | Description                                  | Payload (Request Body)                     | Response (Success 2xx)                     |
|--------------------------|--------|----------------------------------------------|--------------------------------------------|--------------------------------------------|
| `/api/auth/register`     | POST   | Registers a new user                         | `{ email, password }`                      | `{ userId, message }`                      |
| `/api/auth/login`        | POST   | Logs in an existing user, returns JWT        | `{ email, password }`                      | `{ token, userDetails }`                   |
| `/api/auth/logout`       | POST   | Logs out user (invalidates session/token)    | -                                          | `{ message: "Logged out" }`                |
| `/api/auth/me`           | GET    | Gets current authenticated user details      | - (Token in Header)                        | `{ userDetails }`                          |
| `/api/tips`              | GET    | Gets a list of investment tips (paginated, filterable) | Query Params: `page, limit, category, risk` | `{ data: [tips...], totalPages, currentPage }` |
| `/api/tips/{tipId}`      | GET    | Gets details of a specific investment tip    | -                                          | `{ tipDetails }`                           |
| `/api/tips/search`       | GET    | Searches investment tips                     | Query Params: `query, filters`             | `{ data: [tips...], totalPages, currentPage }` |
| `/api/user/favorites`    | GET    | Gets logged-in user's favorite tips          | - (Token in Header)                        | `{ data: [favoriteTips...] }`              |
| `/api/user/favorites`    | POST   | Adds a tip to user's favorites               | `{ tipId }` (Token in Header)              | `{ favoriteId, message }`                  |
| `/api/user/favorites/{tipId}` | DELETE | Removes a tip from user's favorites        | - (Token in Header)                        | `{ message: "Removed" }`                   |

## 🔒 Security
-   **Authentication:** JWT (JSON Web Tokens) via HttpOnly cookies. Consider NextAuth.js for robust implementation.
-   **Authorization:** Role-Based Access Control (RBAC) if different user roles are introduced (e.g., admin, user). For now, basic authenticated vs. unauthenticated access.
-   **Input Validation:** Zod or Joi for validating API request payloads and query parameters on the backend. Client-side validation for better UX.
-   **Protection:**
    -   CSRF: Next.js has built-in CSRF protection for API routes when using cookies for auth. If using custom Express, implement csurf or similar.
    -   XSS: React/Next.js inherently protect against XSS by escaping content. Use `dangerouslySetInnerHTML` with extreme caution. Sanitize user-generated content if displayed.
    -   SQL Injection: Use an ORM (like Prisma) or parameterized queries to prevent SQL injection.
    -   HTTPS: Enforce HTTPS in production.
    -   Rate Limiting: Implement on critical API endpoints to prevent abuse.
    -   Helmet (if using Express) for setting various HTTP headers to secure the app.

## 🧩 Critical Components
1.  **InvestmentTip Service (Backend):**
    -   Responsibility: Handles all CRUD operations for investment tips, including search logic, filtering, and interaction with the database.
    -   Dependencies: Database (PostgreSQL), potentially external financial data APIs.
2.  **Authentication Service (Backend):**
    -   Responsibility: Manages user registration, login, session management (JWT generation/validation).
    -   Dependencies: Database (PostgreSQL), hashing libraries (e.g., bcrypt).
3.  **Search Component (Frontend):**
    -   Responsibility: Provides UI for users to input search queries and apply filters. Manages state for search parameters and triggers API calls.
    -   Dependencies: API client/service for fetching data.
4.  **TipList & TipCard Components (Frontend):**
    -   Responsibility: Displaying lists of investment tips and individual tip details in a clear, user-friendly manner.
    -   Dependencies: Data from API, UI library (shadcn/ui).
5.  **User Favorites Service (Backend & Frontend):**
    -   Responsibility: Backend logic for associating tips with users; Frontend logic for displaying and managing favorite tips.
    -   Dependencies: Authentication Service, InvestmentTip Service, Database.

**MEMORY BANK SYNCHRONIZATION:**
- After completion, initialize `systemPatterns.md` with this content