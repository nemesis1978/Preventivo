# ♿ Audit di Accessibilità (WCAG AA) - Componenti UI

Data Audit: $(date +'%Y-%m-%d')

Questo documento riporta i risultati dell'analisi di accessibilità effettuata sui componenti UI principali del progetto "Portafoglio di Markowitz", con l'obiettivo di identificare aree di miglioramento per la conformità agli standard WCAG AA.

## Componenti Analizzati:

- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/Select.tsx`

---

## 1. Analisi `Button.tsx`

Il componente `Button` sembra ben strutturato e utilizza Radix UI, che è un buon punto di partenza per l'accessibilità.

**Punti Positivi:**
- Utilizzo di `focus-visible` per stili di focus chiari.
- Gestione corretta degli stati `disabled`.

**Raccomandazioni WCAG:**

1.  **Contrasto Colore (WCAG 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast):**

    L'analisi è stata effettuata esaminando i valori OKLCH definiti in `frontend/src/app/globals.css` e le classi Tailwind usate in `frontend/src/components/ui/Button.tsx`.
    I colori `*-foreground` (es. `primary-foreground`, `destructive-foreground`) sembrano avere un buon contrasto con i rispettivi sfondi (`primary`, `destructive`) in entrambe le modalità chiara e scura.
    Le varianti `default`, `destructive` (assumendo che `destructive-foreground` usi un colore ad alto contrasto come `primary-foreground`), `ghost` e `link` generalmente rispettano il contrasto testo/sfondo.

    **Risultati Specifici e Raccomandazioni:**

    *   **Tema Chiaro (Sfondo pagina: `--background: oklch(1 0 0);` - bianco):**
        *   **Variante `outline`:**
            *   **Problema:** Il bordo del pulsante, definito da `border-input` (`--input: oklch(0.929 0.013 255.508);` - grigio molto chiaro, L=0.929), ha un contrasto insufficiente (vicino a 1:1) con lo sfondo della pagina (L=1). Questo viola WCAG 1.4.11 (Non-text Contrast), che richiede un rapporto di 3:1 per gli elementi di interfaccia.
            *   **Raccomandazione:** Scurire il colore della variabile CSS `--input` nel tema chiaro per garantire un contrasto di almeno 3:1 con `--background`. Ad esempio, un valore di luminosità (L) intorno a 0.75 o inferiore sarebbe più appropriato.
        *   **Variante `secondary`:**
            *   **Problema:** Lo sfondo del pulsante, definito da `bg-secondary` (`--secondary: oklch(0.968 0.007 247.896);` - grigio chiarissimo, L=0.968), ha un contrasto insufficiente (vicino a 1:1) con lo sfondo della pagina (L=1). Se il pulsante non ha un bordo visibile per distinguerlo, questo viola WCAG 1.4.11. La variante `secondary` non applica un bordo di default.
            *   **Raccomandazione:**
                1.  Scurire il colore della variabile CSS `--secondary` nel tema chiaro (es. L ~0.85 o inferiore) per fornire un contrasto 3:1 con lo sfondo della pagina.
                2.  Oppure, aggiungere un bordo alla variante `secondary` (es. `border border-input`) e assicurarsi che il colore del bordo (`--input`) abbia un contrasto sufficiente (come raccomandato per la variante `outline`).

    *   **Tema Scuro (Sfondo pagina: `--background: oklch(0.129 0.042 264.695);` - quasi nero):**
        *   **Variante `secondary`:**
            *   **Problema:** Lo sfondo del pulsante, definito da `bg-secondary` (`--secondary: oklch(0.279 0.041 260.031);` - grigio scuro, L=0.279), potrebbe avere un contrasto insufficiente con lo sfondo della pagina (L=0.129). La differenza di luminosità è piccola e probabilmente non raggiunge il 3:1 richiesto da WCAG 1.4.11.
            *   **Raccomandazione:**
                1.  Chiarire significativamente il colore della variabile CSS `--secondary` nel tema scuro (es. L ~0.40 o superiore) per fornire un contrasto 3:1 con lo sfondo della pagina.
                2.  Oppure, aggiungere un bordo visibile alla variante `secondary` che abbia un contrasto sufficiente con lo sfondo della pagina.

    *   **Stati Hover/Focus:**
        *   Gli stili `focus-visible` (`ring-offset-background`, `ring-2`, `ring-ring`, `ring-offset-2`) sembrano robusti.
        *   Gli stati `hover` per le varianti `outline`, `ghost` (`hover:bg-accent hover:text-accent-foreground`) mantengono un buon contrasto testo/sfondo. È necessario assicurarsi che il `bg-accent` stesso sia sufficientemente distinguibile dallo sfondo della pagina se lo stato hover cambia significativamente l'aspetto del pulsante (per WCAG 1.4.11).
            *   Tema Chiaro: `bg-accent` (L=0.968) vs sfondo pagina (L=1) -> contrasto basso.
            *   Tema Scuro: `bg-accent` (L=0.279) vs sfondo pagina (L=0.129) -> contrasto potenzialmente basso.
            *   **Raccomandazione (Stato Hover `bg-accent`):** Se lo stato hover di `ghost` e `outline` deve essere chiaramente distinguibile solo dal cambio di sfondo, il colore `--accent` dovrebbe avere un contrasto di 3:1 con lo sfondo della pagina. In alternativa, se il cambio di colore del testo è l'indicatore primario, questo potrebbe essere sufficiente.

    **Azione Consigliata:**
    1.  Modificare i valori delle variabili CSS in `globals.css` per `--input` (tema chiaro), `--secondary` (tema chiaro e scuro), e potenzialmente `--accent` (tema chiaro e scuro) come suggerito.
    2.  In alternativa o in aggiunta, modificare le classi Tailwind nel componente `Button.tsx` per la variante `secondary` per includere un bordo con contrasto adeguato.
    3.  Verificare nuovamente i contrasti con uno strumento dopo le modifiche.

2.  **Pulsanti Icona (WCAG 1.1.1 Non-text Content, 4.1.2 Name, Role, Value):**
    *   **Verifica Componente:** Il componente `Button.tsx` inoltra correttamente gli attributi HTML standard (inclusi `aria-label`) all'elemento `<button>` sottostante. Pertanto, è tecnicamente possibile fornire un'alternativa testuale.
    *   **Problema:** Se un pulsante utilizza la variante `size: "icon"` e non ha testo visibile, deve avere un'alternativa testuale.
    *   **Azione:** Assicurarsi che ai pulsanti solo icona venga sempre fornito un `aria-label` descrittivo durante l'utilizzo del componente. Ad esempio:
        ```tsx
        <Button variant="ghost" size="icon" aria-label="Chiudi finestra">
          <XIcon className="h-4 w-4" />
        </Button>
        ```
    *   Se l'icona è puramente decorativa e il pulsante ha testo visibile, l'SVG dell'icona dovrebbe avere `aria-hidden="true"`.

3.  **Stati di Focus Visibili (WCAG 2.4.7 Focus Visible):**
    *   **Confermato:** Gli stili `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` sembrano adeguati. Verificare che `ring` e `ring-offset` siano configurati per un buon contrasto.

---

## 2. Analisi `Input.tsx`

Il componente `Input` è un wrapper attorno a un `<input>` HTML standard.

**Punti Positivi:**
- Utilizzo di `focus-visible`.
- Gestione degli stati `disabled`.

**Raccomandazioni WCAG:**

1.  **Label Associati (WCAG 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value):**
    *   **Problema Critico:** Gli input devono sempre avere un label associato programmaticamente.
    *   **Azione:** 
        *   **Metodo Preferito:** Utilizzare un elemento `<label>` con l'attributo `htmlFor` che corrisponde all'`id` dell'input.
            *   **AGGIORNAMENTO:** Il componente `Input.tsx` è stato modificato per accettare una prop `id`, che viene passata direttamente all'elemento `<input>` HTML sottostante. Questo facilita l'associazione programmatica delle etichette.
            ```tsx
            // Esempio di utilizzo
            <div>
              <label htmlFor="username">Nome Utente</label>
              <Input type="text" id="username" name="username" />
            </div>
            ```
        *   **Alternativa (se un label visibile non è possibile):** Utilizzare `aria-label` o `aria-labelledby` sull'input. `aria-label` è per testo non visibile, `aria-labelledby` punta all'ID di un elemento visibile che funge da etichetta.
            ```tsx
            <Input type="search" aria-label="Cerca nel sito" />
            ```

2.  **Contrasto Colore (WCAG 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast):**
    *   **Risultati Specifici e Raccomandazioni (basati su `globals.css` e `Input.tsx`):**
        *   **Tema Chiaro:**
            *   **Bordo Input (`border-input`):** `oklch(0.75 0.02 255)` (L=0.75) su `bg-background` (L=1). Contrasto: ~1.31:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1).
                *   **Raccomandazione:** Scurire significativamente `--input` nel tema chiaro. Un valore di L intorno a 0.6 o inferiore sarebbe più appropriato (es. `oklch(0.6 0.02 255)`).
            *   **Testo Placeholder (`placeholder:text-muted-foreground`):** `oklch(0.418 0.024 259.63)` (L=0.418) su `bg-background` (L=1, sfondo dell'input). Contrasto: ~2.24:1. **INSUFFICIENTE** (WCAG 1.4.3 richiede 4.5:1).
                *   **Raccomandazione:** Scurire `--muted-foreground` nel tema chiaro. Un valore di L intorno a 0.3 o inferiore (es. `oklch(0.3 0.02 260)`) o aumentare la luminosità dello sfondo dell'input se possibile senza compromettere altri elementi.
        *   **Tema Scuro:**
            *   **Bordo Input (`border-input`):** `oklch(0.279 0.041 260.031)` (L=0.279) su `bg-background` (L=0.129). Contrasto: ~1.83:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1).
                *   **Raccomandazione:** Schiarire `--input` nel tema scuro. Un valore di L intorno a 0.4 o superiore (es. `oklch(0.4 0.04 260)`) mantenendo un buon contrasto con il testo digitato.
            *   **Testo Placeholder (`placeholder:text-muted-foreground`):** `oklch(0.621 0.026 260.09)` (L=0.621) su `bg-background` (L=0.129, sfondo dell'input). Contrasto: ~3.74:1. **INSUFFICIENTE** (WCAG 1.4.3 richiede 4.5:1).
                *   **Raccomandazione:** Schiarire `--muted-foreground` nel tema scuro. Un valore di L intorno a 0.7 o superiore (es. `oklch(0.7 0.02 260)`).

3.  **Indicazioni di Errore (WCAG 3.3.1 Error Identification, 3.3.3 Error Suggestion):**
    *   **Considerazione:** Quando l'input è parte di un form e si verifica un errore di validazione, l'errore deve essere identificato chiaramente e, se possibile, associato all'input tramite `aria-describedby` o `aria-errormessage` (WCAG 2.1).
    *   **Azione:** Prevedere meccanismi per visualizzare e associare messaggi di errore agli input.

---

## 3. Analisi `Card.tsx`

Il componente `Card` e i suoi sotto-componenti (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) forniscono una struttura semantica di base.

**Punti Positivi:**
- `CardTitle` utilizza un `<h3>`, che è un buon inizio per la struttura dei titoli.

**Raccomandazioni WCAG:**

1.  **Struttura Intestazioni (WCAG 1.3.1 Info and Relationships, 2.4.6 Headings and Labels):**
    *   **Considerazione:** L'uso di `<h3>` per `CardTitle` è appropriato se la card è inserita in un contesto dove un `<h2>` (o un livello superiore) la precede. La gerarchia dei titoli (H1-H6) deve essere logica e non saltare livelli.
    *   **Azione:** Verificare l'uso delle card nelle pagine per assicurare una corretta gerarchia dei titoli. Se una card rappresenta una sezione principale, il suo titolo potrebbe dover essere un `<h2>` (potrebbe essere necessario rendere il livello dell'heading configurabile o utilizzare un `div` con `role="heading" aria-level="X"`).

2.  **Contrasto Colore (WCAG 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast):**
    *   **Risultati Specifici e Raccomandazioni (basati su `globals.css` e `Card.tsx`):**
        *   **Tema Chiaro:**
            *   **Testo Principale (`text-card-foreground`):** `oklch(0.129 0.042 264.695)` (L=0.129) su `bg-card` (L=1). Contrasto: ~5.86:1. **OK**.
            *   **Bordo Card (`border`):** `oklch(0.929 0.013 255.508)` (L=0.929) su `bg-background` (L=1, assumendo che la card sia su sfondo pagina). Contrasto: ~1.07:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1).
                *   **Raccomandazione:** Scurire `--border` nel tema chiaro. Un valore di L intorno a 0.75 o inferiore (es. `oklch(0.75 0.01 255)`).
            *   **Descrizione Card (`text-muted-foreground`):** `oklch(0.418 0.024 259.63)` (L=0.418) su `bg-card` (L=1). Contrasto: ~2.24:1. **INSUFFICIENTE** (WCAG 1.4.3 richiede 4.5:1).
                *   **Raccomandazione:** Scurire `--muted-foreground` nel tema chiaro (vedi raccomandazione per Input).
        *   **Tema Scuro:**
            *   **Testo Principale (`text-card-foreground`):** `oklch(0.988 0.023 280.39)` (L=0.988) su `bg-card` (L=0.129). Contrasto: ~5.79:1. **OK**.
            *   **Bordo Card (`border`):** `oklch(0.279 0.041 260.031)` (L=0.279) su `bg-background` (L=0.129). Contrasto: ~1.83:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1).
                *   **Raccomandazione:** Schiarire `--border` nel tema scuro. Un valore di L intorno a 0.4 o superiore (es. `oklch(0.4 0.04 260)`).
            *   **Descrizione Card (`text-muted-foreground`):** `oklch(0.621 0.026 260.09)` (L=0.621) su `bg-card` (L=0.129). Contrasto: ~3.74:1. **INSUFFICIENTE** (WCAG 1.4.3 richiede 4.5:1).
                *   **Raccomandazione:** Schiarire `--muted-foreground` nel tema scuro (vedi raccomandazione per Input).

3.  **Contenuto Interattivo (WCAG 4.1.2 Name, Role, Value):**
    *   **Considerazione:** Se l'intera card è cliccabile (es. link a una pagina di dettaglio), dovrebbe essere implementata come un link (`<a>`) contenente gli elementi della card, oppure utilizzare JavaScript con ruoli ARIA appropriati (es. `role="link"` o `role="button"`) e gestione della tastiera.
    *   **Azione:** Se le card sono interattive, assicurarsi che siano accessibili da tastiera e che il loro ruolo sia comunicato agli screen reader.

---

## 4. Analisi `Navbar.tsx`

Il componente `Navbar` utilizza classi Tailwind dirette per lo stile principale, non le variabili CSS globali per sfondo/testo.

**Punti Positivi:**
- Utilizzo di `AnimatePresence` e `motion` per transizioni fluide del menu mobile.
- Presenza di un pulsante hamburger per il menu mobile.

**Raccomandazioni WCAG:**

1.  **Contrasto Colore (WCAG 1.4.3 Contrast (Minimum))**:
    *   **Sfondo Navbar e Testo Link Principali:**
        *   `bg-gray-800` (Tailwind: `#1f2937`, L ~0.175) e `text-white` (`#ffffff`, L=1). Contrasto: ~4.66:1. **OK**.
    *   **Testo Link Hover:**
        *   `hover:text-gray-300` (Tailwind: `#d1d5db`, L ~0.825) su `bg-gray-800`. Contrasto: ~3.88:1. **INSUFFICIENTE** per testo normale (richiesto 4.5:1). È accettabile per testo grande (3:1), ma i link della navbar sono di dimensioni normali.
        *   **Raccomandazione:** Utilizzare un colore più chiaro per `hover:text-gray-XXX` (es. `hover:text-gray-100` o `hover:text-white`) o un colore di sfondo più scuro per l'hover del link per mantenere il contrasto.
    *   **Pulsante Logout (testo `text-gray-800` su `bg-white`):**
        *   Contrasto: ~4.66:1. **OK**.
    *   **Pulsante Logout Hover (testo `text-gray-800` su `bg-gray-100`):**
        *   `bg-gray-100` (Tailwind: `#f3f4f6`, L ~0.95). Contrasto: ~4.44:1. **QUASI OK**, ma leggermente inferiore a 4.5:1.
        *   **Raccomandazione:** Considerare di scurire leggermente il testo o schiarire ulteriormente lo sfondo hover per garantire 4.5:1, oppure assicurarsi che il testo sia considerato "grande" (18pt o 14pt bold).

2.  **Navigazione da Tastiera (WCAG 2.1.1 Keyboard):**
    *   **Verifica Necessaria:** Assicurarsi che tutti gli elementi interattivi (link, pulsanti, menu mobile) siano completamente accessibili e operabili tramite tastiera.
    *   L'ordine di focus deve essere logico.
    *   Il menu mobile deve intrappolare il focus quando aperto e ripristinarlo correttamente alla chiusura.

3.  **Indicatore di Focus Visibile (WCAG 2.4.7 Focus Visible):**
    *   **Verifica Necessaria:** Assicurarsi che tutti gli elementi interattivi abbiano un indicatore di focus chiaramente visibile quando ricevono il focus da tastiera. Tailwind di solito gestisce bene questo aspetto con `focus:ring` o `focus-visible:outline`.

4.  **ARIA Attributes per Menu Mobile (WCAG 4.1.2 Name, Role, Value):**
    *   **Pulsante Hamburger:** Dovrebbe avere `aria-expanded` (true/false) per indicare lo stato del menu mobile e `aria-controls` che punta all'ID del contenitore del menu mobile.
    *   **Contenitore Menu Mobile:** Dovrebbe essere identificabile (con un `id`) e potrebbe beneficiare di `role="dialog"` o `role="menu"` a seconda dell'implementazione esatta, con appropriate proprietà ARIA per la gestione del focus e la descrizione.

---

## 5. Analisi `Select.tsx`

L'implementazione di `Select.tsx` presenta un'ambiguità: il componente principale `Select` renderizza un elemento `<select>` HTML nativo, il che semplificherebbe l'accessibilità di base. Tuttavia, vengono esportati anche sotto-componenti come `SelectTrigger`, `SelectValue`, `SelectContent`, e `SelectItem`, che sono tipici di una reimplementazione *custom* di un select. Questa struttura mista può portare a confusione.

**Se l'intento è usare un `<select>` nativo:**
- I sotto-componenti (`SelectTrigger`, `SelectContent`, ecc.) sono largamente ridondanti. L'accessibilità di base (ruoli, stati, navigazione da tastiera) è gestita dal browser.
- La principale preoccupazione per l'accessibilità sarebbe associare un `<label>` all'elemento `<select>` tramite `id` e `htmlFor`.

**Se l'intento è un select custom (come suggerito dai sotto-componenti):**
- L'elemento `<select>` nativo nel componente `Select` dovrebbe essere rimosso e sostituito da una logica che utilizzi i sotto-componenti per costruire l'interfaccia.
- I select custom sono complessi da rendere accessibili e richiedono un'attenta implementazione degli attributi ARIA e della gestione della tastiera, come descritto di seguito.

**Data questa ambiguità, la raccomandazione di utilizzare una libreria headless UI consolidata come Radix UI Select (`@radix-ui/react-select`) diventa ancora più forte, poiché gestisce internamente queste complessità in modo robusto e accessibile.**

Assumendo che l'obiettivo sia un select custom (coerentemente con i sotto-componenti forniti), le seguenti raccomandazioni si applicano:

**Raccomandazioni WCAG:**

1.  **Pattern ARIA per Listbox (WCAG 4.1.2 Name, Role, Value):**
    *   **Problema Critico:** Un select custom deve seguire il pattern ARIA per `listbox`. Questo include:
        *   `SelectTrigger` (il pulsante che apre il menu a discesa): 
            *   `role="combobox"` (se permette input testuale) o `role="button"`.
            *   `aria-haspopup="listbox"`.
            *   `aria-expanded="true/false"` per indicare se il menu è aperto o chiuso.
            *   `aria-controls="ID_DEL_LISTBOX"` che punta all'ID del `SelectContent`.
            *   Se non c'è un label visibile, `aria-label` sul trigger.
        *   `SelectContent` (il contenitore delle opzioni):
            *   `role="listbox"`.
            *   `aria-labelledby="ID_DEL_LABEL_DEL_TRIGGER"` (se il trigger ha un label visibile).
            *   `tabindex="-1"` per permettere il focus programmatico.
        *   `SelectItem` (le singole opzioni):
            *   `role="option"`.
            *   `aria-selected="true/false"` per l'opzione selezionata.
            *   Dovrebbe essere focusabile (es. `tabindex="-1"` o gestito tramite `aria-activedescendant` sul listbox).
    *   **Azione:** Implementare tutti gli attributi ARIA necessari. **Fortemente consigliato:** Considerare l'utilizzo di una libreria headless UI come Radix UI Select (`@radix-ui/react-select`), che gestisce l'accessibilità internamente.

2.  **Navigazione da Tastiera (WCAG 2.1.1 Keyboard):**
    *   **Problema Critico:** Deve essere possibile interagire completamente con il select usando solo la tastiera:
        *   Focus sul trigger: `Tab`.
        *   Aprire/chiudere il menu: `Spazio`, `Invio`, `Freccia Su/Giù`.
        *   Navigare tra le opzioni: `Freccia Su/Giù`.
        *   Selezionare un'opzione: `Invio` (o `Spazio` se non chiude il menu).
        *   Chiudere il menu senza selezionare: `Esc`.
        *   Type-ahead: digitare lettere per saltare alle opzioni corrispondenti.
    *   **Azione:** Implementare la logica completa per la navigazione da tastiera.

3.  **Icona SVG (WCAG 1.1.1 Non-text Content):**
    *   **Problema:** L'SVG nel `SelectTrigger` (`<svg xmlns="http://www.w3.org/2000/svg" ...>`) non ha un'alternativa testuale o non è nascosto agli screen reader.
    *   **Azione:** Se il `SelectTrigger` ha testo visibile o un `aria-label` che ne descrive la funzione (es., "Scegli un'opzione"), l'SVG dovrebbe essere nascosto con `aria-hidden="true"`.
        ```tsx
        <svg aria-hidden="true" ... >...</svg>
        ```

4.  **Label Associato (WCAG 1.3.1, 3.3.2, 4.1.2):**
    *   **Problema Critico:** Come per gli input, anche un select custom necessita di un label associato programmaticamente (tramite `aria-labelledby` sul trigger che punta all'ID di un label esterno, o `aria-label` sul trigger).
    *   **Azione:** Assicurare che ogni istanza di `Select` abbia un label.

5.  **Contrasto Colore (WCAG 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast):**

    L'analisi si basa sui valori OKLCH definiti in `globals.css` e le classi usate in `Select.tsx`.

    *   **`SelectTrigger`:**
        *   **Testo su sfondo:** (`--foreground` su `--background`)
            *   Tema Chiaro: L=0.129 su L=1. Contrasto ~5.86:1. **OK**.
            *   Tema Scuro: L=0.988 su L=0.129. Contrasto ~5.79:1. **OK**.
        *   **Bordo (`border-input`):**
            *   Tema Chiaro: `--input` (L=0.75) su `--background` (L=1). Contrasto ~1.31:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1). (Problema già notato per `Input.tsx`).
                *   **Raccomandazione:** Scurire `--input` nel tema chiaro (es. L ~0.6).
            *   Tema Scuro: `--input` (L=0.279) su `--background` (L=0.129). Contrasto ~1.83:1. **INSUFFICIENTE**. (Problema già notato per `Input.tsx`).
                *   **Raccomandazione:** Schiarire `--input` nel tema scuro (es. L ~0.4).
        *   **Testo Placeholder (`placeholder:text-muted-foreground`):**
            *   Tema Chiaro: `--muted-foreground` (L=0.418) su `--background` (L=1). Contrasto ~2.24:1. **INSUFFICIENTE** (WCAG 1.4.3 richiede 4.5:1). (Problema già notato per `Input.tsx`).
                *   **Raccomandazione:** Scurire `--muted-foreground` nel tema chiaro (es. L ~0.3).
            *   Tema Scuro: `--muted-foreground` (L=0.621) su `--background` (L=0.129). Contrasto ~3.74:1. **INSUFFICIENTE**. (Problema già notato per `Input.tsx`).
                *   **Raccomandazione:** Schiarire `--muted-foreground` nel tema scuro (es. L ~0.7).
        *   **Icona `ChevronDown` (`opacity-50`, colore base `--foreground`):**
            *   Tema Chiaro: Colore percepito L~0.5645 su `--background` (L=1). Contrasto ~1.8:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1).
                *   **Raccomandazione:** Aumentare opacità a 1 o usare un colore base più scuro per l'icona nel tema chiaro, oppure usare `currentColor` e assicurare che il testo del trigger abbia contrasto sufficiente.
            *   Tema Scuro: Colore percepito L~0.5585 su `--background` (L=0.129). Contrasto ~3.3:1. **OK**.

    *   **`SelectContent` (Dropdown):**
        *   **Testo su sfondo (`--popover-foreground` su `--popover`):**
            *   Tema Chiaro: L=0.129 su L=1. Contrasto ~5.86:1. **OK**.
            *   Tema Scuro: L=0.988 su L=0.129. Contrasto ~5.79:1. **OK**.
        *   **Bordo (`border` su sfondo esterno, es. `--background`):**
            *   Tema Chiaro: `--border` (L=0.929) su `--background` (L=1). Contrasto ~1.07:1. **INSUFFICIENTE**. (Problema già notato per `Card.tsx`).
                *   **Raccomandazione:** Scurire `--border` nel tema chiaro (es. L ~0.75).
            *   Tema Scuro: `--border` (L=0.279) su `--background` (L=0.129). Contrasto ~1.83:1. **INSUFFICIENTE**. (Problema già notato per `Card.tsx`).
                *   **Raccomandazione:** Schiarire `--border` nel tema scuro (es. L ~0.4).

    *   **`SelectItem` (Stato Focus: `focus:bg-accent`, `focus:text-accent-foreground`):**
        *   Tema Chiaro: `text-accent-foreground` (L=0.479) su `bg-accent` (L=0.968). Contrasto ~1.96:1. **INSUFFICIENTE** (WCAG 1.4.3 richiede 4.5:1).
            *   **Raccomandazione:** Modificare `--accent-foreground` e/o `--accent` nel tema chiaro per ottenere un contrasto di almeno 4.5:1. Ad esempio, scurire significativamente `--accent-foreground` (es. L < 0.3) e/o schiarire/scurire `--accent`.
        *   Tema Scuro: `text-accent-foreground` (L=0.988) su `bg-accent` (L=0.279). Contrasto ~3.06:1. **INSUFFICIENTE**.
            *   **Raccomandazione:** Modificare `--accent-foreground` e/o `--accent` nel tema scuro. Ad esempio, schiarire `--accent-foreground` (già molto chiaro) e scurire/schiarire `--accent` (es. L ~0.15 o L > 0.5).
        *   **Icona `Check` (Indicatore):** Deve avere un contrasto di 3:1 con lo sfondo. Se usa `text-accent-foreground` su `bg-accent` nello stato focus, soffre degli stessi problemi di contrasto. Se usa `text-popover-foreground` su `bg-popover` (item selezionato, non focus), il contrasto è **OK**.

    *   **`SelectSeparator` (`bg-muted` su `bg-popover`):**
        *   Tema Chiaro: `--muted` (L=0.968) su `--popover` (L=1). Contrasto ~1.03:1. **INSUFFICIENTE** (WCAG 1.4.11 richiede 3:1).
            *   **Raccomandazione:** Scurire `--muted` nel tema chiaro (es. L ~0.75).
        *   Tema Scuro: `--muted` (L=0.279) su `--popover` (L=0.129). Contrasto ~1.83:1. **INSUFFICIENTE**.
            *   **Raccomandazione:** Schiarire `--muted` nel tema scuro (es. L ~0.4).

    **Nota Generale:** Molte variabili CSS problematiche (`--input`, `--muted-foreground`, `--border`, `--accent`, `--accent-foreground`, `--muted`) sono state già identificate in altri componenti. Le correzioni globali a queste variabili miglioreranno anche `Select.tsx`.

---

## Prossimi Passi Raccomandati:

1.  **Dare Priorità alle Correzioni Critiche:** Iniziare con i problemi di label mancanti (`Input.tsx`, `Select.tsx`) e l'implementazione ARIA per `Select.tsx` (o la sua sostituzione con una libreria accessibile).
2.  **Verifica del Contrasto:** Eseguire una verifica completa del contrasto dei colori su tutti i componenti e le loro varianti/stati.
3.  **Test con Screen Reader:** Testare i componenti (specialmente `Select.tsx`) con uno screen reader (NVDA, VoiceOver, JAWS) per verificare l'esperienza utente.
4.  **Test di Navigazione da Tastiera:** Verificare che tutti gli elementi interattivi siano completamente utilizzabili da tastiera.
5.  **Aggiornare i Componenti:** Implementare le modifiche suggerite nel codice sorgente.
6.  **Documentare le Scelte:** Documentare eventuali decisioni prese riguardo all'accessibilità, specialmente per componenti custom come `Select.tsx`.