# 🧪 Strategia di Testing - Portafoglio di Markowitz

## 1. Obiettivi del Testing
-   **Assicurare la Qualità:** Garantire che l'applicazione "Portafoglio di Markowitz" sia affidabile, funzionale e soddisfi i requisiti definiti nel PRD.
-   **Prevenire Regressioni:** Identificare e correggere bug il prima possibile nel ciclo di sviluppo per evitare che modifiche future introducano nuovi problemi.
-   **Validare l'Esperienza Utente:** Assicurare che l'applicazione sia intuitiva, facile da usare e offra una buona UX.
-   **Verificare la Sicurezza:** Identificare e mitigare potenziali vulnerabilità di sicurezza.
-   **Confermare le Performance:** Assicurare che l'applicazione risponda rapidamente e gestisca carichi di lavoro attesi.

## 2. Livelli di Testing

### 2.1. Unit Test
-   **Obiettivo:** Testare le singole unità di codice (funzioni, componenti React, metodi di servizio backend) in isolamento.
-   **Strumenti:**
    -   Frontend (Next.js/React): Jest + React Testing Library.
    -   Backend (Node.js/Express o Next.js API Routes): Jest (o Vitest).
-   **Copertura:** Mirare a una copertura > 80% per la logica di business critica e i componenti complessi.
-   **Cosa Testare:** Logica delle funzioni, rendering dei componenti con props diverse, gestione degli stati, utility.

### 2.2. Integration Test
-   **Obiettivo:** Testare l'interazione tra diverse parti del sistema (es. frontend con backend API, servizi con database).
-   **Strumenti:**
    -   Frontend-Backend: React Testing Library (per testare componenti che fanno chiamate API mockate) o Playwright per testare flussi che coinvolgono API reali su un ambiente di test.
    -   Backend: Jest/Supertest per testare gli endpoint API e la loro interazione con i servizi e il database (usando un database di test).
-   **Cosa Testare:** Flussi di dati tra componenti, chiamate API e risposte, interazioni con il database (CRUD operations).

### 2.3. End-to-End (E2E) Test
-   **Obiettivo:** Testare l'intera applicazione dal punto di vista dell'utente, simulando scenari reali di utilizzo attraverso l'interfaccia utente.
-   **Strumenti:** Playwright.
-   **Cosa Testare:** Flussi utente critici definiti nel PRD e nel documento UI/UX:
    -   Registrazione e Login utente.
    -   Ricerca di consigli di investimento (con e senza filtri).
    -   Visualizzazione della lista di consigli e navigazione tra le pagine.
    -   Visualizzazione della pagina di dettaglio di un consiglio.
    -   Salvataggio e rimozione di un consiglio dai preferiti (per utenti autenticati).

## 3. Tipi di Testing

### 3.1. Functional Testing
-   Verificare che tutte le funzionalità descritte nel PRD (`001-prd.md`) operino come previsto.
-   Coperto principalmente da Unit, Integration, e E2E test.

### 3.2. UI/UX Testing
-   **Obiettivo:** Assicurare che l'interfaccia sia conforme al design (`005-ui-ux.md`), sia intuitiva e user-friendly.
-   **Metodi:** Revisione manuale, test di usabilità (anche informali), E2E test per verificare la navigazione e l'interazione.
-   **Cosa Verificare:** Layout, responsività, navigazione, leggibilità, coerenza visiva.

### 3.3. Performance Testing
-   **Obiettivo:** Valutare la reattività e la stabilità dell'applicazione sotto carico.
-   **Strumenti:** Lighthouse (per frontend performance), k6 o Apache JMeter (per backend load testing - opzionale per la fase iniziale, più rilevante pre-lancio).
-   **Metriche Chiave:** Tempi di caricamento pagina (LCP, FCP), tempo di risposta API, throughput.

### 3.4. Security Testing
-   **Obiettivo:** Identificare e correggere vulnerabilità di sicurezza.
-   **Metodi:** Revisione del codice focalizzata sulla sicurezza, utilizzo di scanner di vulnerabilità (es. OWASP ZAP, Snyk), test di penetrazione (opzionale, per versioni più mature).
-   **Aree Chiave:** Autenticazione (JWT handling), autorizzazione, validazione input (prevenzione XSS, SQLi), gestione delle sessioni, protezione CSRF.

### 3.5. Accessibility Testing (A11y)
-   **Obiettivo:** Assicurare che l'applicazione sia utilizzabile da persone con disabilità.
-   **Strumenti:** Screen reader (NVDA, VoiceOver), Axe DevTools, Lighthouse.
-   **Standard:** Mirare alla conformità WCAG 2.1 Livello AA.
-   **Cosa Verificare:** Navigazione da tastiera, contrasto colori, testo alternativo per immagini, uso corretto di ARIA.

### 3.6. Compatibility Testing
-   **Obiettivo:** Verificare che l'applicazione funzioni correttamente su diversi browser e dispositivi.
-   **Browser:** Ultime versioni di Chrome, Firefox, Safari, Edge.
-   **Dispositivi:** Desktop, tablet, mobile (simulati e reali se possibile).

## 4. Ambiente di Testing
-   **Locale:** Sviluppatori eseguono unit e integration test localmente.
-   **Staging/Preview (Vercel):** Ambiente per E2E test, UI testing, e UAT (User Acceptance Testing) prima del deploy in produzione. Vercel Preview Deployments sono ideali per questo.
-   **Produzione:** Monitoraggio continuo, test di fumo post-deploy.

## 5. Automazione dei Test
-   **CI/CD:** Integrare l'esecuzione automatica di unit e integration test nella pipeline di CI/CD (es. GitHub Actions con Vercel).
-   E2E test possono essere eseguiti su base schedulata o prima di merge importanti.

## 6. Ruoli e Responsabilità
-   **Sviluppatori:** Scrittura di unit e integration test per il codice che producono.
-   **QA (se presente, altrimenti sviluppatori/Product Owner):** Definizione di test case E2E, esecuzione di test manuali esplorativi, validazione delle feature.

## 7. Gestione dei Bug
-   Utilizzare un issue tracker (es. GitHub Issues) per tracciare i bug.
-   Prioritizzare i bug in base a severità e impatto.
-   Verificare le correzioni dei bug prima di chiudere le issue.

## 8. Iterazione e Miglioramento
-   La strategia di testing sarà rivista e adattata man mano che il progetto evolve.
-   Il feedback dai test e dagli utenti sarà utilizzato per migliorare sia l'applicazione che il processo di testing stesso.

**SINCRONIZZAZIONE MEMORY BANK:**
- Questo documento informa le pratiche di sviluppo e qualità, influenzando `progress.md` e `activeContext.md` attraverso la pianificazione delle attività di test.