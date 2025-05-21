# Test info

- Name: has title
- Location: C:\Users\egixt\OneDrive\Desktop\Preventivo\frontend\tests-e2e\example.spec.ts:3:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveTitle(expected)

Locator: locator(':root')
Expected pattern: /Next.js/
Received string:  ""
Call log:
  - expect.toHaveTitle with timeout 5000ms
  - waiting for locator(':root')
    7 × locator resolved to <html lang="it">…</html>
      - unexpected value ""

    at C:\Users\egixt\OneDrive\Desktop\Preventivo\frontend\tests-e2e\example.spec.ts:7:22
```

# Page snapshot

```yaml
- navigation:
  - link "Preventivo App":
    - /url: /
  - link "Home":
    - /url: /
  - link "Investment Tips":
    - /url: /tips
  - paragraph: Loading...
- main:
  - heading "Spunti di Investimento Curati" [level=1]
  - paragraph: Esplora la nostra lista dinamica di opportunità di investimento, selezionate per te.
  - text: Cerca per Titolo
  - textbox "Cerca per Titolo"
  - text: Filtra per Categoria
  - combobox:
    - button "Filtra per Categoria":
      - text: Select an option
      - img
    - text: Tutte Azioni Obbligazioni Immobiliare Criptovalute ETF
  - text: Ordina Per
  - combobox:
    - button "Ordina Per":
      - text: Select an option
      - img
    - text: Più Recenti Meno Recenti Rischio (Basso > Alto) Rischio (Alto > Basso)
  - heading "Tech Stock Alpha" [level=3]
  - paragraph: "Categoria: Stocks - Rischio: High"
  - paragraph: Promising tech stock with high growth potential.
  - button "Vedi Dettagli"
  - heading "Real Estate Gem" [level=3]
  - paragraph: "Categoria: Real Estate - Rischio: Medium"
  - paragraph: Undervalued property in an emerging market.
  - button "Vedi Dettagli"
  - heading "Green Energy Bond" [level=3]
  - paragraph: "Categoria: Bonds - Rischio: Low"
  - paragraph: Stable returns from a renewable energy project.
  - button "Vedi Dettagli"
  - heading "Crypto Innovator" [level=3]
  - paragraph: "Categoria: Crypto - Rischio: Very High"
  - paragraph: Next-gen cryptocurrency with disruptive technology.
  - button "Vedi Dettagli"
  - heading "Diversified ETF" [level=3]
  - paragraph: "Categoria: ETF - Rischio: Medium"
  - paragraph: Broad market exposure with a single investment.
  - button "Vedi Dettagli"
  - button "Precedente"
  - text: Pagina 1 di X
  - button "Successivo"
  - paragraph: © 2025 Portafoglio di Markowitz. Tutti i diritti riservati.
  - paragraph: Le informazioni fornite sono solo a scopo informativo e non costituiscono consulenza finanziaria.
- contentinfo:
  - paragraph: © 2025 Preventivo App. Tutti i diritti riservati.
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- img
- text: Next.js 15.3.2 Webpack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Stack Trace":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools":
    - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
    - img
  - paragraph: "\"src\\pages\\api\\auth\\register.ts\" - \"src\\app\\api\\auth\\register\\route.ts\""
  - img
  - text: "Conflicting app and page files were found, please remove the conflicting files to continue:"
  - button "Open in editor":
    - img
  - text: "\"src\\pages\\api\\auth\\register.ts\" - \"src\\app\\api\\auth\\register\\route.ts\" \"src\\pages\\api\\tips\\[tipId].ts\" - \"src\\app\\api\\tips\\[tipId]\\route.ts\" \"src\\pages\\api\\tips\\index.ts\" - \"src\\app\\api\\tips\\route.ts\""
- contentinfo:
  - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('has title', async ({ page }) => {
   4 |   await page.goto('http://localhost:3000/');
   5 |
   6 |   // Expect a title "to contain" a substring.
>  7 |   await expect(page).toHaveTitle(/Next.js/);
     |                      ^ Error: Timed out 5000ms waiting for expect(locator).toHaveTitle(expected)
   8 | });
   9 |
  10 | test('get started link', async ({ page }) => {
  11 |   await page.goto('http://localhost:3000/');
  12 |
  13 |   // Click the get started link.
  14 |   await page.getByRole('link', { name: 'Get started' }).click();
  15 |
  16 |   // Expects page to have a heading with the name of Installation.
  17 |   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  18 | });
```