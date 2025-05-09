# 🧰 Stack Tecnologico per Tipo di Progetto: Portafoglio di Markowitz

## 📱 App Web Moderne (Specifico per questo Progetto)

-   **Frontend:**
    -   🔥 **Framework:** Next.js 14 (App Router)
        -   *Motivazione:* Offre un'eccellente esperienza di sviluppo (DX), rendering lato server (SSR) e generazione di siti statici (SSG) per prestazioni ottimali, routing basato su file system intuitivo con App Router, e una vasta community.
    -   🎨 **Styling:** Tailwind CSS + shadcn/ui
        -   *Motivazione Tailwind:* Utility-first CSS framework per una rapida prototipazione e sviluppo di UI customizzabili senza scrivere CSS tradizionale. Altamente performante in produzione.
        -   *Motivazione shadcn/ui:* Collezione di componenti UI riutilizzabili, accessibili e stilizzabili, costruiti su Radix UI e Tailwind CSS. Permette di copiare e incollare il codice dei componenti direttamente nel progetto per massima personalizzazione.
    -   🏛️ **Architettura:** Server Components + Client Components (React Server Components model di Next.js)
        -   *Motivazione:* Permette di spostare la logica di rendering e data fetching sul server quando possibile, riducendo il bundle JavaScript inviato al client e migliorando le performance percepite.
    -   🔄 **State Management:** Zustand / Jotai (per state globale semplice) + React Context/Hooks (per state locale e condiviso tra pochi componenti) + TanStack Query (SWR o React Query) per il caching e la sincronizzazione dei dati server.
        -   *Motivazione:* Leggeri, semplici da usare e si integrano bene con l'ecosistema React/Next.js. TanStack Query è ideale per gestire lo stato asincrono proveniente dalle API.
    -   🎭 **Animazioni:** Framer Motion (opzionale, per micro-interazioni e transizioni fluide se necessarie)
        -   *Motivazione:* Libreria potente e facile da usare per animazioni complesse in React.

-   **Backend (Integrato con Next.js o Separato):**
    -   🚀 **API Layer:** Next.js API Routes (Route Handlers) / tRPC
        -   *Motivazione Next.js API Routes:* Semplice da implementare all'interno dello stesso progetto Next.js, ideale per la maggior parte dei casi d'uso.
        -   *Motivazione tRPC:* Offre type-safety end-to-end se si utilizza TypeScript sia per frontend che backend, eliminando la necessità di definire manualmente tipi per API e payload. Richiede un setup più specifico ma migliora la DX.
    -   ⚙️ **Framework (se backend separato o logica complessa):** Node.js con Express.js
        -   *Motivazione:* Ecosistema maturo, vasto supporto di librerie, performante per applicazioni I/O intensive. Da considerare se la logica backend diventa molto complessa e si preferisce separarla nettamente dal frontend Next.js.
    -   🔒 **Autenticazione:** NextAuth.js (Auth.js v5)
        -   *Motivazione:* Soluzione completa e flessibile per l'autenticazione in applicazioni Next.js. Supporta vari provider (OAuth, email, credentials) e gestisce sessioni in modo sicuro (e.g., HttpOnly cookies).

-   **Database:**
    -   💾 **Tipo:** PostgreSQL
        -   *Motivazione:* Database relazionale open-source potente, affidabile e con un ricco set di funzionalità. Ottimo per dati strutturati e query complesse. Buona integrazione con ORM come Prisma.
    -   🔄 **ORM (Object-Relational Mapper):** Prisma
        -   *Motivazione:* ORM moderno per Node.js e TypeScript che offre type-safety, auto-completamento e un'API intuitiva per interagire con il database. Semplifica le migrazioni e la gestione dello schema.

-   **Deployment:**
    -   ☁️ **Piattaforma:** Vercel
        -   *Motivazione:* Piattaforma ottimizzata per Next.js, offre CI/CD integrato, preview deployments, serverless functions e global CDN. Semplifica enormemente il processo di deploy e scaling.

-   **Strumenti di Sviluppo e Qualità:**
    -   🔧 **Linting & Formatting:** ESLint + Prettier
        -   *Motivazione:* Mantengono la coerenza del codice e prevengono errori comuni.
    -   🧪 **Testing:** Jest + React Testing Library (per unit/integration tests), Playwright (per E2E tests)
        -   *Motivazione:* Stack di testing standard per applicazioni React/Next.js.
    -   📦 **Package Manager:** npm (o pnpm/yarn a seconda delle preferenze)

-   **Librerie Extra (Potenziali):**
    -   📊 **Grafici:** Chart.js / Recharts / Nivo (se necessari per visualizzare dati finanziari)
    -   📅 **Date/Time:** date-fns / Day.js (per manipolazione di date e orari)
    -   ⚙️ **Validazione Dati:** Zod (per validazione di schemi e tipi, specialmente con tRPC o API)

## Considerazioni Aggiuntive
-   **TypeScript:** Utilizzo di TypeScript per tutto il progetto (frontend e backend) per migliorare la manutenibilità, la robustezza del codice e l'esperienza di sviluppo grazie al type-checking statico.
-   **Variabili d'Ambiente:** Gestione sicura delle configurazioni e delle chiavi API tramite file `.env`.
-   **Logging:** Implementazione di un sistema di logging (es. Pino, Winston) per il backend per monitorare l'applicazione e diagnosticare problemi.

**SINCRONIZZAZIONE MEMORY BANK:**
- Dopo completamento, inizializza `techContext.md` con questi contenuti.