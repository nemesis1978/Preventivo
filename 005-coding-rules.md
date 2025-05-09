# 📜 Regole di Codifica e Convenzioni - Portafoglio di Markowitz

Questo documento definisce le regole di codifica, le convenzioni di stile e le best practice da seguire durante lo sviluppo del progetto "Portafoglio di Markowitz". L'obiettivo è garantire la coerenza, la leggibilità e la manutenibilità del codice.

## 1. Linguaggio e Formattazione

-   **Linguaggio Principale:** TypeScript per Frontend (Next.js/React) e Backend (Node.js, se applicabile).
-   **Formattazione del Codice:** Prettier.
    -   Configurazione di Prettier nel file `.prettierrc.js` o `package.json`.
    -   Eseguire `npx prettier --write .` prima di ogni commit o configurare l'auto-formattazione sull'IDE.
-   **Linting:** ESLint.
    -   Configurazione di ESLint nel file `.eslintrc.js`.
    -   Rispettare le regole definite per evitare errori e warning durante la build.

## 2. Convenzioni di Denominazione

-   **Variabili e Funzioni:** `camelCase` (es. `myVariable`, `calculateValue`).
-   **Classi e Componenti React:** `PascalCase` (es. `UserProfile`, `MainComponent`).
-   **Costanti:** `UPPER_SNAKE_CASE` (es. `MAX_USERS`, `API_URL`).
-   **File e Cartelle:** `kebab-case` (es. `user-profile.tsx`, `api-helpers`). Eccezione per i componenti React che possono usare `PascalCase.tsx` (es. `UserProfile.tsx`).
-   **Interfacce e Tipi TypeScript:** `PascalCase` con prefisso `I` per le interfacce (es. `IUser`, `IProduct`) e `T` per i tipi (es. `TStatus`, `TConfig`).

## 3. Commenti

-   **Quando commentare:** Commentare logica complessa, decisioni di design non ovvie, o workaround.
-   **Stile dei Commenti:** Usare commenti JSDoc/TSDoc per funzioni, classi e metodi pubblici per generare documentazione.
    ```typescript
    /**
     * Calcola il valore scontato di un prodotto.
     * @param price - Il prezzo originale del prodotto.
     * @param discountPercentage - La percentuale di sconto da applicare.
     * @returns Il prezzo scontato.
     */
    function calculateDiscountedPrice(price: number, discountPercentage: number): number {
      // ... logica ...
    }
    ```
-   Evitare commenti ovvi o che parafrasano il codice.

## 4. Struttura del Codice

-   **Modularità:** Suddividere il codice in moduli piccoli e focalizzati.
-   **Principio di Singola Responsabilità (SRP):** Ogni funzione, classe o modulo dovrebbe avere una sola responsabilità.
-   **Don't Repeat Yourself (DRY):** Evitare la duplicazione del codice creando funzioni o componenti riutilizzabili.
-   **Leggibilità:** Scrivere codice chiaro e facile da capire. Preferire la leggibilità alla concisione eccessiva.
-   **Lunghezza delle Righe:** Mantenere le righe di codice entro un limite ragionevole (es. 80-120 caratteri) per migliorare la leggibilità.

## 5. TypeScript Best Practices

-   **Tipizzazione Stretta:** Utilizzare tipi specifici invece di `any` il più possibile.
-   **`strict` mode:** Abilitare tutte le opzioni `strict` nel `tsconfig.json`.
-   **Interfacce vs Tipi:** Usare interfacce per definire la forma degli oggetti e tipi per unioni, intersezioni o tipi primitivi.
-   **Readonly:** Usare `readonly` per proprietà che non devono essere modificate dopo l'inizializzazione.

## 6. React Best Practices

-   **Componenti Funzionali e Hooks:** Preferire componenti funzionali con Hooks rispetto ai class components.
-   **Stato e Props:** Gestire lo stato in modo appropriato. Passare i dati tramite props.
-   **Keys nelle Liste:** Fornire sempre una `key` univoca quando si renderizzano liste di elementi.
-   **Memoizzazione:** Usare `React.memo`, `useMemo`, `useCallback` per ottimizzare le performance quando necessario, ma non prematuramente.
-   **useEffect Dependencies:** Specificare correttamente l'array delle dipendenze per `useEffect` per evitare loop infiniti o esecuzioni mancate.

## 7. Gestione degli Errori

-   **Try/Catch:** Utilizzare blocchi `try/catch` per la gestione sincrona degli errori.
-   **Promises:** Gestire gli errori nelle Promises con `.catch()` o `async/await` con `try/catch`.
-   **Errori Significativi:** Fornire messaggi di errore chiari e utili.
-   **Logging:** Loggare gli errori in modo appropriato, specialmente in produzione.

## 8. Test

-   **Unit Test:** Scrivere unit test per funzioni e componenti isolati (es. con Jest, React Testing Library).
-   **Integration Test:** Testare l'interazione tra più componenti o moduli.
-   **E2E Test (Opzionale ma consigliato):** Testare i flussi utente completi (es. con Cypress, Playwright).
-   **Copertura del Codice:** Mirare a una buona copertura del codice con i test.

## 9. Version Control (Git)

-   **Messaggi di Commit:** Scrivere messaggi di commit chiari e descrittivi seguendo le convenzioni (es. Conventional Commits).
    -   Formato: `type(scope): subject` (es. `feat(auth): implement login page`)
-   **Branching Strategy:** Seguire la strategia di branching definita nel `009-deployment.md` (es. `main`, `develop`, `feature/*`).
-   **Pull Request (PR):**
    -   Ogni feature o bugfix deve essere sviluppato in una branch separata e mergiato tramite PR.
    -   Le PR devono avere una descrizione chiara del cambiamento.
    -   Richiedere code review prima del merge (se il team lo prevede).

## 10. Dipendenze

-   **Revisione:** Valutare attentamente l'aggiunta di nuove dipendenze.
-   **Aggiornamenti:** Mantenere le dipendenze aggiornate per motivi di sicurezza e funzionalità, ma testare gli aggiornamenti prima di applicarli in produzione.

## 11. Sicurezza

-   **Input Validation:** Validare sempre gli input dell'utente (sia frontend che backend).
-   **Variabili d'Ambiente:** Non committare mai segreti o chiavi API nel repository. Usare variabili d'ambiente.
-   **OWASP Top 10:** Essere consapevoli delle comuni vulnerabilità web e come prevenirle.

## 12. Documentazione

-   Mantenere aggiornata la documentazione del progetto (PRD, architettura, ecc.).
-   Documentare le API (es. con Swagger/OpenAPI se si sviluppa un backend API-first).

---

*Questo documento è vivo e può essere aggiornato man mano che il progetto evolve e nuove decisioni vengono prese.*