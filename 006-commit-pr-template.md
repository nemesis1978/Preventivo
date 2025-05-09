# 📄 Template Messaggi di Commit e Pull Request

## 💬 Template Messaggio di Commit

```
[Tipo](Scope): Breve descrizione della modifica (max 50 caratteri)

[CORPO OPZIONALE]
Descrizione più dettagliata delle modifiche, se necessario.

- Punto 1
- Punto 2

Issue di riferimento: #NumeroIssue (se applicabile)

[FOOTER OPZIONALE]
Breaking changes, co-autori, ecc.
```

### Tipi di Commit Comuni:
-   **feat:** Nuova funzionalità per l'utente.
-   **fix:** Correzione di un bug per l'utente.
-   **docs:** Modifiche alla documentazione.
-   **style:** Modifiche che non alterano il significato del codice (spazi, formattazione, punti e virgola mancanti, ecc.).
-   **refactor:** Riscittura del codice che non corregge un bug né aggiunge una funzionalità.
-   **perf:** Modifica del codice che migliora le prestazioni.
-   **test:** Aggiunta o correzione di test.
-   **chore:** Modifiche al processo di build, strumenti ausiliari, configurazioni, ecc. (es. `build`, `ci`, `revert`).

### Scope (Esempi per "Portafoglio di Markowitz"):
-   `auth` (autenticazione)
-   `tips` (consigli di investimento)
-   `search` (funzionalità di ricerca)
-   `ui` (componenti UI generici)
-   `db` (schema database, migrazioni)
-   `api` (endpoint API)
-   `config` (configurazioni progetto)
-   `deps` (gestione dipendenze)

### Esempio Messaggio di Commit:
```
feat(auth): Implementa login con email e password

Aggiunge la possibilità per gli utenti di accedere utilizzando
le proprie credenziali email e password.

- Creato endpoint API /api/auth/login
- Aggiunta validazione input con Zod
- Gestione sessione con NextAuth.js

Issue di riferimento: #12
```

## 🚀 Template Pull Request (PR)

```markdown
# [Cursor] Titolo PR: Breve descrizione delle modifiche (es. Feat: Aggiunta Ricerca Consigli)

## 📝 Descrizione
{Descrizione chiara e concisa di cosa fa questa PR e perché è necessaria.}

## ✨ Tipo di Modifica
- [ ] Bug fix (modifica non breaking che risolve un problema)
- [ ] New feature (modifica non breaking che aggiunge funzionalità)
- [ ] Breaking change (fix o feature che causerebbe incompatibilità con le versioni esistenti)
- [ ] Documentazione
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Altro (specificare): ________

## 🔗 Issue Correlate
- Chiude #{NumeroIssue1}
- Riferimento #{NumeroIssue2}

## ✅ Checklist Prima della Richiesta di Revisione
- [ ] Il mio codice segue le linee guida di stile di questo progetto.
- [ ] Ho eseguito una auto-revisione del mio codice.
- [ ] Ho commentato il mio codice, particolarmente nelle aree difficili da comprendere.
- [ ] Ho apportato le modifiche corrispondenti alla documentazione (se applicabile).
- [ ] Le mie modifiche non generano nuovi warning.
- [ ] Ho aggiunto test che provano che il mio fix è efficace o che la mia feature funziona.
- [ ] I test unitari e di integrazione nuovi e esistenti passano localmente con le mie modifiche.
- [ ] Qualsiasi modifica dipendente è stata fusa e pubblicata nei moduli downstream.

## 🖼️ Screenshot / Video (se applicabile)
{Aggiungere screenshot o video per modifiche UI/UX}

## 🧪 Come è Stato Testato?
{Descrivere i test eseguiti per verificare le modifiche. Fornire istruzioni per la riproduzione.}

- [ ] Test Manuale
- [ ] Test Unitari
- [ ] Test di Integrazione
- [ ] Test E2E

## 📈 Impatto Prestazionale (se applicabile)
{Dettagli sull'impatto delle modifiche sulle prestazioni.}

## ⚠️ Rischi Potenziali
{Descrizione dei rischi e di come sono stati mitigati.}

## 📝 Note per i Reviewer
{Note specifiche per chi farà la revisione del codice.}
```

### Note per i Commit (da `006-commit-pr-template.md` originale):
-   Per messaggi di commit multilinea, scrivere prima in un file e usare `git commit -F <filename>`
-   Includere "[Cursor] " all'inizio dei messaggi di commit e titoli PR (questo è già nel template PR sopra)
-   Rimuovere il file temporaneo dopo il commit

**SINCRONIZZAZIONE MEMORY BANK:**
- Questo file (`006-commit-pr-template.md`) è parte della documentazione di progetto e non sincronizza direttamente un file specifico della Memory Bank, ma informa le pratiche di versioning che influenzeranno `progress.md` e `activeContext.md` indirettamente.