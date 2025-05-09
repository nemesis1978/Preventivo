# 🚀 Strategia di Deployment - Portafoglio di Markowitz

## 1. Piattaforma di Deployment
-   **Piattaforma Scelta:** Vercel
-   **Motivazione:** Come delineato in `001-prd.md` e `007-tech-stack.md`, Vercel è la piattaforma ideale per progetti Next.js grazie alla sua integrazione nativa, CI/CD automatico, preview deployments, serverless functions, e global CDN. Semplifica notevolmente il processo di build, deploy e scaling.

## 2. Ambienti

### 2.1. Sviluppo (Locale)
-   **Descrizione:** Ambiente di sviluppo locale degli sviluppatori.
-   **URL:** `http://localhost:3000` (o altra porta configurata).
-   **Database:** Istanza PostgreSQL locale o Dockerizzata.
-   **Variabili d'ambiente:** Gestite tramite file `.env.local`.

### 2.2. Preview/Staging (Vercel)
-   **Descrizione:** Ambiente per testare le feature branch e le Pull Request prima del merge in `main`/`develop`.
-   **Trigger:** Automatico ad ogni push su una branch collegata a una PR, o su branch specifiche configurate su Vercel.
-   **URL:** URL univoco generato da Vercel per ogni preview deployment (es. `projectname-git-branch-username.vercel.app`).
-   **Database:** Idealmente un'istanza PostgreSQL di staging separata, o l'istanza di produzione con dati di test se strettamente necessario e con cautela (non raccomandato per dati sensibili).
-   **Variabili d'ambiente:** Gestite tramite la UI di Vercel per l'ambiente di preview.
-   **Scopo:** E2E testing, UI/UX review, User Acceptance Testing (UAT) da parte del Product Owner o stakeholder.

### 2.3. Produzione (Vercel)
-   **Descrizione:** Ambiente live accessibile agli utenti finali.
-   **Trigger:** Automatico ad ogni merge/push sulla branch di produzione (es. `main` o `master`).
-   **URL:** Dominio personalizzato (es. `www.portafoglio-markowitz.it`) o l'URL di default di Vercel (es. `projectname.vercel.app`).
-   **Database:** Istanza PostgreSQL di produzione dedicata.
-   **Variabili d'ambiente:** Gestite tramite la UI di Vercel per l'ambiente di produzione (marcate come "Production").
-   **Scopo:** Applicazione live per gli utenti.

## 3. Processo di CI/CD (Continuous Integration / Continuous Deployment)

-   **Version Control:** GitHub.
-   **Branching Strategy (semplificata):**
    -   `main`: Branch di produzione. Ogni commit su questa branch triggera un deploy in produzione.
    -   `develop`: Branch di integrazione. Le feature completate vengono mergiate qui. Può triggerare deploy su un ambiente di staging persistente (opzionale).
    -   `feature/*`: Branch per lo sviluppo di nuove funzionalità o fix. Ogni PR da una feature branch triggera un preview deployment.
-   **Pipeline di Vercel:**
    1.  **Push/Merge:** Uno sviluppatore pusha su una feature branch e apre una PR verso `develop` (o `main`), oppure viene effettuato un merge su `develop` o `main`.
    2.  **Build:** Vercel rileva il cambiamento, scarica il codice, installa le dipendenze (`npm install` o `yarn install` o `pnpm install`).
    3.  **Test (Opzionale su Vercel, ma consigliato):** Esecuzione di unit/integration test. Vercel può essere configurato per fallire il build se i test non passano (richiede script custom nel `package.json` o integrazione con GitHub Actions che poi triggera Vercel).
    4.  **Build dell'Applicazione:** Vercel esegue il build di Next.js (`next build`).
    5.  **Deploy:** Vercel deploya l'applicazione buildata sulla sua infrastruttura globale (Serverless Functions, Edge Network).
    6.  **Notifica:** Notifica dello stato del deploy (successo/fallimento).

## 4. Gestione delle Variabili d'Ambiente
-   Le variabili d'ambiente (chiavi API, connection string del database, segreti JWT) NON devono essere committate nel repository Git.
-   **Sviluppo Locale:** Utilizzare un file `.env.local` (aggiunto a `.gitignore`).
-   **Preview e Produzione (Vercel):** Configurare le variabili d'ambiente direttamente nella UI del progetto su Vercel. Vercel le inietta in modo sicuro durante il processo di build e runtime.
    -   Distinguere tra variabili per Preview e Production.

## 5. Database e Migrazioni (Prisma)
-   Le migrazioni dello schema del database vengono gestite con Prisma Migrate (`npx prisma migrate dev` per lo sviluppo, `npx prisma migrate deploy` per la produzione).
-   **Strategia di Migrazione in Produzione:**
    1.  Prima di deployare codice che dipende da nuove modifiche allo schema, le migrazioni del database devono essere applicate all'ambiente di produzione.
    2.  Questo può essere un passo manuale (eseguito da uno sviluppatore con accesso sicuro) o automatizzato con cautela tramite script nella pipeline di deploy (più complesso e rischioso se non gestito correttamente).
    3.  Vercel non esegue migrazioni database automaticamente. Questo deve essere gestito esternamente o tramite script eseguiti come parte del comando di build/start se l'infrastruttura lo permette (es. usando un `postinstall` script o modificando il comando di start, ma con attenzione ai permessi e alla sicurezza).

## 6. Rollback
-   Vercel mantiene uno storico dei deploy.
-   È possibile effettuare un rollback a una versione precedente del deploy direttamente dalla dashboard di Vercel in caso di problemi critici in produzione.
-   Per rollback del database, è necessario avere una strategia di backup e restore del database.

## 7. Monitoraggio e Logging (Post-Deployment)
-   **Vercel Analytics:** Fornisce insight sulle performance e sull'utilizzo dell'applicazione.
-   **Logging:**
    -   Le Serverless Functions di Vercel hanno log accessibili dalla dashboard.
    -   Integrare un servizio di logging dedicato (es. Sentry, Logtail, Axiom) per una gestione più avanzata dei log applicativi e degli errori.
-   **Uptime Monitoring:** Utilizzare servizi esterni (es. UptimeRobot, Better Stack) per monitorare la disponibilità dell'applicazione in produzione.

## 8. Dominio Personalizzato
-   Configurare un dominio personalizzato per l'ambiente di produzione tramite la dashboard di Vercel.
-   Vercel gestisce automaticamente i certificati SSL/TLS per i domini personalizzati.

## 9. Checklist Pre-Lancio (Sprint 6)
-   Verificare tutte le variabili d'ambiente di produzione.
-   Eseguire migrazioni del database di produzione.
-   Testare a fondo l'ambiente di staging/preview.
-   Configurare il dominio personalizzato.
-   Impostare il monitoraggio e il logging.
-   Comunicare il lancio agli stakeholder.

**SINCRONIZZAZIONE MEMORY BANK:**
- Questo documento informa le pratiche di deployment e infrastruttura, influenzando `techContext.md` e le attività finali in `progress.md`.