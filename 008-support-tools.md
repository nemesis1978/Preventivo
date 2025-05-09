# 🛠️ Strumenti e Utility di Supporto - Portafoglio di Markowitz

Questo documento elenca gli strumenti e le utility che supporteranno lo sviluppo, il testing e il deployment dell'applicazione "Portafoglio di Markowitz".

## 1. Sviluppo Locale

-   **IDE:** Visual Studio Code (o preferenza dello sviluppatore)
    -   *Estensioni Consigliate:* ESLint, Prettier, Prisma, Tailwind CSS IntelliSense, Next.js (se disponibile un'estensione specifica per App Router), GitLens.
-   **Version Control:** Git & GitHub
    -   *Workflow:* Gitflow (semplificato: main, develop, feature branches).
-   **Package Manager:** npm (o pnpm/yarn come specificato in `techContext.md`)
-   **Node.js:** Versione LTS più recente.
-   **Database Locale:** PostgreSQL installato localmente o tramite Docker.
    -   *GUI Database:* pgAdmin, DBeaver, o DataGrip.
-   **Prisma CLI:** Per migrazioni, generazione client, e interazione con il database.

## 2. Qualità del Codice

-   **Linting:** ESLint (con configurazione `eslint-config-next`)
-   **Formatting:** Prettier
-   **Type Checking:** TypeScript

## 3. Testing

-   **Unit Testing:** Jest + React Testing Library (per frontend), Jest (per backend).
-   **Integration Testing:** Jest/Supertest (per API backend), React Testing Library (per interazioni componenti frontend).
-   **E2E Testing:** Playwright.
-   **Code Coverage:** Strumenti integrati con Jest (es. `--coverage` flag).

## 4. API Development & Testing

-   **Client API (per test manuali):** Postman, Insomnia, o Thunder Client (VS Code Extension).
-   **Mocking (per frontend):** Mock Service Worker (MSW) o `jest.mock`.

## 5. Build & Deployment

-   **Piattaforma:** Vercel
    -   *CI/CD:* Integrato con Vercel (deploy automatici da branch GitHub).
    -   *Preview Deployments:* Per ogni PR/commit su branch specifici.
-   **Variabili d'Ambiente:** Gestite tramite UI di Vercel e file `.env.local` per lo sviluppo locale.

## 6. Documentazione

-   **Markdown:** Per tutti i file di documentazione del progetto (`00X-*.md`, README.md).
-   **Diagrammi (Mermaid):** Integrati nei file Markdown per visualizzare architetture, flussi, ecc.
-   **API Documentation (se necessaria formalmente):** Swagger/OpenAPI (generata da codice o scritta manualmente se si opta per REST puro e non tRPC).

## 7. Comunicazione e Gestione Progetto (se team)

-   **Issue Tracking:** GitHub Issues.
-   **Project Boards:** GitHub Projects.
-   **Comunicazione:** Slack, Discord, o Microsoft Teams (a seconda delle preferenze del team).

## 8. Monitoraggio e Logging (Produzione)

-   **Logging:** Servizi di logging integrati con Vercel o soluzioni esterne come Sentry, Logtail, Pino (per backend).
-   **Performance Monitoring:** Strumenti di Vercel Analytics, Sentry Performance, o New Relic/Datadog (per applicazioni più grandi).
-   **Uptime Monitoring:** UptimeRobot, Better Uptime.

## 9. Sicurezza

-   **Scanner di Vulnerabilità (opzionale):** Snyk, OWASP ZAP (per test più approfonditi).
-   **Gestione Segreti:** Variabili d'ambiente di Vercel, GitHub Secrets (per CI/CD).

## 10. Utility Specifiche per lo Stack

-   **Next.js Devtools:** Estensione browser per debugging applicazioni Next.js.
-   **Tailwind CSS Devtools:** Estensione browser per ispezionare e debuggare classi Tailwind.
-   **Prisma Studio:** GUI per visualizzare e modificare dati nel database durante lo sviluppo (`npx prisma studio`).

**SINCRONIZZAZIONE MEMORY BANK:**
- Questo documento informa le pratiche di sviluppo e gli strumenti utilizzati, influenzando `techContext.md` e le attività in `progress.md`.