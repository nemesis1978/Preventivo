// frontend/src/app/tips/[tipId]/page.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import TipDetailPage, { generateStaticParams } from './page'; // Assicurati che il percorso sia corretto
import '@testing-library/jest-dom';

// Mock dei componenti UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h5>{children}</h5>, // Usiamo h5 per distinguerlo dal titolo principale h1
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('next/link', () => ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>);

// Mock data (deve corrispondere a quella in page.tsx per i test)
const mockInvestmentTips = [
  { id: "1", title: "Tech Stock Alpha", category: "Stocks", risk: "High", summary: "Promising tech stock with high growth potential.", date: "2024-07-15", details: "This stock belongs to a leading innovator in the AI sector, with strong Q2 earnings and a robust product pipeline. Analysts project a 25% upside in the next 12 months, but it carries significant market volatility.", analystRating: "Buy", targetPrice: "$250" },
  { id: "2", title: "Real Estate Gem", category: "Real Estate", risk: "Medium", summary: "Undervalued property in an emerging market.", date: "2024-07-10", details: "A commercial property located in a rapidly developing urban area. Current rental yields are at 6%, with potential for capital appreciation as infrastructure projects complete. Medium risk due to local economic factors.", analystRating: "Hold", targetPrice: "N/A" },
  { id: "3", title: "Green Energy Bond", category: "Bonds", risk: "Low", summary: "Stable returns from a renewable energy project.", date: "2024-07-05", details: "Issued by a reputable green energy provider, this bond offers a fixed 4.5% annual return. It's considered a low-risk investment, suitable for capital preservation and ESG-conscious investors.", analystRating: "Buy", targetPrice: "N/A" },
  { id: "4", title: "Crypto Innovator", category: "Crypto", risk: "Very High", summary: "Next-gen cryptocurrency with disruptive technology.", date: "2024-07-20", details: "A new cryptocurrency focused on decentralized finance (DeFi) solutions. While it has the potential for exponential growth, it is highly speculative and subject to extreme price swings. Invest only what you can afford to lose.", analystRating: "Speculative Buy", targetPrice: "$5" },
  { id: "5", title: "Diversified ETF", category: "ETF", risk: "Medium", summary: "Broad market exposure with a single investment.", date: "2024-06-30", details: "This ETF tracks the S&P 500, offering instant diversification across major US companies. It's a solid choice for long-term growth with moderate risk. Expense ratio is 0.03%.", analystRating: "Buy", targetPrice: "N/A" },
];

// Mock della funzione getTipDetails (simulando il fetch dei dati)
// Questo è importante perché la pagina è un Server Component che fa fetch di dati
// Non possiamo mockare direttamente `getTipDetails` perché è definita nello stesso file del componente.
// Invece, intercettiamo il comportamento basandoci sui params.

describe('TipDetailPage', () => {
  describe('Quando lo spunto esiste', () => {
    const existingTip = mockInvestmentTips[0];

    beforeEach(async () => {
      // @ts-ignore
      render(await TipDetailPage({ params: { tipId: existingTip.id } }));
    });

    it('dovrebbe renderizzare il titolo dello spunto', () => {
      expect(screen.getByRole('heading', { name: existingTip.title })).toBeInTheDocument();
    });

    it('dovrebbe renderizzare categoria, rischio e data', () => {
      expect(screen.getByText(new RegExp(`Categoria: ${existingTip.category}`))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Rischio: ${existingTip.risk}`))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Data: ${new Date(existingTip.date).toLocaleDateString()}`))).toBeInTheDocument();
    });

    it('dovrebbe renderizzare il sommario e i dettagli', () => {
      expect(screen.getByText(existingTip.summary)).toBeInTheDocument(); // CardDescription
      // Cerchiamo una sottostringa a causa di possibili problemi con whitespace-pre-line
      expect(screen.getByText(content => content.includes('leading innovator in the AI sector'))).toBeInTheDocument();
    });

    it('dovrebbe renderizzare il rating dell\'analista e il prezzo target se disponibile', () => {
      expect(screen.getByText(existingTip.analystRating)).toBeInTheDocument();
      if (existingTip.targetPrice && existingTip.targetPrice !== 'N/A') {
        expect(screen.getByText(existingTip.targetPrice)).toBeInTheDocument();
      }
    });

    it('dovrebbe avere un link per tornare alla lista', () => {
      const backLink = screen.getByRole('link', { name: /← Torna alla Lista/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Quando lo spunto non esiste', () => {
    beforeEach(async () => {
      // @ts-ignore
      render(await TipDetailPage({ params: { tipId: 'non-existent-id' } }));
    });

    it('dovrebbe renderizzare il messaggio di spunto non trovato', () => {
      expect(screen.getByRole('heading', { name: /Spunto non trovato/i })).toBeInTheDocument();
      expect(screen.getByText(/Lo spunto di investimento che stai cercando non esiste o è stato rimosso./i)).toBeInTheDocument();
    });

    it('dovrebbe avere un link per tornare alla lista anche in caso di errore', () => {
      const backLink = screen.getByRole('link', { name: /Torna alla lista/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('generateStaticParams', () => {
    it('dovrebbe generare i parametri corretti per la build statica', async () => {
      const params = await generateStaticParams();
      // Ci aspettiamo che mockInvestmentTips sia usato per generare i params
      // La page.tsx usa investmentTips, quindi dobbiamo assicurarci che il mock sia coerente
      // o che la funzione generateStaticParams sia mockata se necessario.
      // Per questo test, assumiamo che usi la stessa fonte di dati mock.
      expect(params).toEqual(mockInvestmentTips.map(tip => ({ tipId: tip.id })));
    });
  });
});