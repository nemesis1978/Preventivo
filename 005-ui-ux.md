# 🎨 UI/UX Design Guidelines - Portafoglio di Markowitz

## 1. Filosofia di Design
L'interfaccia utente (UI) e l'esperienza utente (UX) del "Portafoglio di Markowitz" mirano a essere:
-   **Intuitiva e Accessibile:** Facile da navigare per utenti di ogni livello di esperienza, inclusi i principianti nel campo degli investimenti.
-   **Professionale e Affidabile:** L'aspetto deve infondere fiducia, data la natura finanziaria dell'applicazione.
-   **Moderna e Pulita:** Un design contemporaneo che privilegi la chiarezza delle informazioni.
-   **Orientata ai Contenuti:** L'obiettivo primario è fornire consigli di investimento; il design deve supportare questa funzione senza distrazioni.
-   **Responsive:** Esperienza utente ottimale su dispositivi desktop, tablet e mobile.

## 2. Schermate/Pagine Chiave

### 2.1. Homepage (`/`)
-   **Obiettivo:** Introdurre l'applicazione, offrire un punto di accesso immediato alla ricerca e presentare gli ultimi consigli.
-   **Elementi Chiave:**
    -   Barra di ricerca prominente e centrale.
    -   Sezione "Ultimi Consigli" o "Consigli in Evidenza" (es. 3-5 card).
    -   Breve call to action che spieghi il valore dell'app.
    -   Link chiari alla navigazione principale (es. Esplora Consigli, Login/Registrazione).

### 2.2. Pagina Risultati Ricerca / Esplora Consigli (`/tips`, `/search?q=...`)
-   **Obiettivo:** Visualizzare una lista di consigli di investimento in base ai criteri di ricerca o filtri applicati.
-   **Elementi Chiave:**
    -   Input di ricerca (se pagina di ricerca) o titolo della categoria (se pagina esplora).
    -   Opzioni di filtro (laterali o superiori): per categoria di asset, profilo di rischio, settore, orizzonte temporale.
    -   Opzioni di ordinamento: per data, popolarità, rendimento atteso (se disponibile).
    -   Lista di "InvestmentTipCard": ogni card mostra titolo, breve descrizione, categoria, livello di rischio e un link/bottone "Leggi di più".
    -   Paginazione per gestire un gran numero di risultati.

### 2.3. Pagina Dettaglio Consiglio (`/tips/{tipId}`)
-   **Obiettivo:** Fornire informazioni complete su un singolo consiglio di investimento.
-   **Elementi Chiave:**
    -   Titolo del consiglio.
    -   Descrizione completa e analisi dettagliata.
    -   Potenziali rischi e rendimenti.
    -   Fonti delle informazioni (se applicabile).
    -   Grafici o visualizzazioni dati (se pertinenti e disponibili, es. andamento storico, proiezioni).
    -   Bottone per "Salvare tra i preferiti" (per utenti autenticati).
    -   Navigazione "breadcrumb" per tornare facilmente alla lista.

### 2.4. Pagine di Autenticazione (`/login`, `/register`)
-   **Obiettivo:** Permettere agli utenti di registrarsi e accedere.
-   **Elementi Chiave:**
    -   Form semplici e chiari con campi per email e password.
    -   Link per recupero password (su pagina login).
    -   Link per passare da login a registrazione e viceversa.
    -   Validazione chiara degli input e messaggi di errore.

### 2.5. Dashboard Utente (`/dashboard/favorites` - se implementata)
-   **Obiettivo:** Permettere agli utenti autenticati di visualizzare i consigli salvati.
-   **Elementi Chiave:**
    -   Lista dei consigli preferiti (utilizzando le `InvestmentTipCard`).
    -   Possibilità di rimuovere un consiglio dai preferiti.

## 3. Libreria di Componenti (shadcn/ui)
-   Si utilizzeranno i componenti predefiniti di `shadcn/ui` come base, personalizzandoli ove necessario per allinearsi allo stile del progetto.
-   Componenti principali da utilizzare:
    -   `Card` per visualizzare i consigli.
    -   `Button` per azioni e navigazione.
    -   `Input`, `Label` per form e campi di ricerca.
    -   `NavigationMenu` o simile per la navigazione principale.
    -   `Dialog` o `Popover` per eventuali modali o informazioni aggiuntive.
    -   `Table` per visualizzare dati strutturati (se necessario).
    -   `Select`, `Checkbox`, `RadioGroup` per i filtri.

## 4. Palette Colori e Tipografia

### 4.1. Palette Colori (Esempio Iniziale)
-   **Primario:** Blu scuro (es. `#1A3A5A`) - per fiducia, professionalità.
-   **Secondario/Accento:** Verde acqua o verde brillante (es. `#22C55E` o `#10B981`) - per crescita, positività, call to action.
-   **Neutri:**
    -   Grigio scuro per testo (es. `#333333`).
    -   Grigio medio per testo secondario, bordi (es. `#6B7280`).
    -   Grigio chiaro per sfondi di sezioni (es. `#F3F4F6`).
    -   Bianco (es. `#FFFFFF`) per sfondi principali e testo su sfondi scuri.
-   **Colori di Stato:**
    -   Errore: Rosso (es. `#EF4444`).
    -   Successo: Verde (es. `#22C55E`).
    -   Warning: Giallo/Arancione (es. `#F97316`).

### 4.2. Tipografia
-   **Font Primario (Intestazioni, Titoli):** Un font Sans-serif moderno e leggibile (es. Inter, Manrope, o system-ui).
-   **Font Secondario (Corpo del testo):** Un font Sans-serif altamente leggibile, anche a dimensioni ridotte (es. Inter, Open Sans, o system-ui).
-   Gerarchia tipografica chiara (H1, H2, H3, p, small) per strutturare i contenuti.

## 5. Responsive Design
-   **Mobile-First Approach:** Progettare prima per schermi piccoli e poi adattare per schermi più grandi.
-   **Breakpoint Standard:**
    -   Mobile: < 768px
    -   Tablet: 768px - 1024px
    -   Desktop: > 1024px
-   Utilizzo di Flexbox e Grid di Tailwind CSS per layout fluidi.
-   Immagini ottimizzate e responsive.
-   Navigazione adattiva (es. menu hamburger su mobile).

## 6. Accessibilità (A11y)
-   Puntare al livello AA delle WCAG (Web Content Accessibility Guidelines).
-   Contrasto colori adeguato per testo e sfondi.
-   Testo alternativo per le immagini (`alt` tags).
-   Navigazione da tastiera completa.
-   Uso semantico dell'HTML.
-   Attributi ARIA dove necessario per componenti complessi.
-   Test regolari con screen reader e strumenti di validazione dell'accessibilità.

## 7. Flussi Utente Principali (Riferimento a `001-prd.md`)
I flussi utente principali sono definiti nel PRD. L'UI dovrà supportare fluidamente questi percorsi:
1.  **Ricerca e Consultazione Consigli:** Homepage → Ricerca/Filtri → Lista Risultati → Dettaglio Consiglio.
2.  **Esplorazione Lista Consigli:** Homepage/Navigazione → Pagina Esplora → Filtri/Ordinamento → Dettaglio Consiglio.
3.  **Autenticazione:** Homepage/Navigazione → Login/Register → Inserimento Credenziali → Accesso.
4.  **Gestione Preferiti (per utenti loggati):** Dettaglio Consiglio → Salva Preferito → Dashboard → Visualizza/Rimuovi Preferiti.

## 8. Micro-interazioni e Feedback
-   Utilizzare animazioni sottili (es. con Framer Motion, se integrato) per migliorare l'esperienza senza appesantire.
-   Fornire feedback visivo immediato per le azioni dell'utente (es. stati di caricamento, messaggi di successo/errore).
-   Transizioni fluide tra le pagine/viste.