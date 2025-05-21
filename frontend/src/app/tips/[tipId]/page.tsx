// app/tips/[tipId]/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

// Mock data - in un'applicazione reale, questi dati verrebbero da un'API
const investmentTips = [
  { id: "1", title: "Tech Stock Alpha", category: "Stocks", risk: "High", summary: "Promising tech stock with high growth potential.", date: "2024-07-15", details: "This stock belongs to a leading innovator in the AI sector, with strong Q2 earnings and a robust product pipeline. Analysts project a 25% upside in the next 12 months, but it carries significant market volatility.", analystRating: "Buy", targetPrice: "$250" },
  { id: "2", title: "Real Estate Gem", category: "Real Estate", risk: "Medium", summary: "Undervalued property in an emerging market.", date: "2024-07-10", details: "A commercial property located in a rapidly developing urban area. Current rental yields are at 6%, with potential for capital appreciation as infrastructure projects complete. Medium risk due to local economic factors.", analystRating: "Hold", targetPrice: "N/A" },
  { id: "3", title: "Green Energy Bond", category: "Bonds", risk: "Low", summary: "Stable returns from a renewable energy project.", date: "2024-07-05", details: "Issued by a reputable green energy provider, this bond offers a fixed 4.5% annual return. It's considered a low-risk investment, suitable for capital preservation and ESG-conscious investors.", analystRating: "Buy", targetPrice: "N/A" },
  { id: "4", title: "Crypto Innovator", category: "Crypto", risk: "Very High", summary: "Next-gen cryptocurrency with disruptive technology.", date: "2024-07-20", details: "A new cryptocurrency focused on decentralized finance (DeFi) solutions. While it has the potential for exponential growth, it is highly speculative and subject to extreme price swings. Invest only what you can afford to lose.", analystRating: "Speculative Buy", targetPrice: "$5" },
  { id: "5", title: "Diversified ETF", category: "ETF", risk: "Medium", summary: "Broad market exposure with a single investment.", date: "2024-06-30", details: "This ETF tracks the S&P 500, offering instant diversification across major US companies. It's a solid choice for long-term growth with moderate risk. Expense ratio is 0.03%.", analystRating: "Buy", targetPrice: "N/A" },
];

interface TipDetailPageProps {
  params: {
    tipId: string;
  };
}

// Funzione per trovare il tip (simula una chiamata API)
async function getTipDetails(tipId: string) {
  // In un'app reale: const res = await fetch(`/api/tips/${tipId}`); const data = await res.json(); return data.tip;
  return investmentTips.find(tip => tip.id === tipId);
}

export default async function TipDetailPage({ params }: TipDetailPageProps) {
  const tip = await getTipDetails(params.tipId);

  if (!tip) {
    return (
      <div className="container mx-auto py-8 px-4 text-center font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-3xl font-bold mb-4">Spunto non trovato</h1>
        <p className="text-muted-foreground mb-6">Lo spunto di investimento che stai cercando non esiste o è stato rimosso.</p>
        <Button asChild>
          <Link href="/">Torna alla lista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/">← Torna alla Lista</Link>
        </Button>
        <h1 className="text-4xl font-bold">{tip.title}</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Categoria: {tip.category} - Rischio: {tip.risk} - Data: {new Date(tip.date).toLocaleDateString()}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli dello Spunto di Investimento</CardTitle>
          <CardDescription>{tip.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Analisi Dettagliata:</h3>
            <p className="text-muted-foreground whitespace-pre-line">{tip.details}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Rating Analista:</h3>
            <p className="text-muted-foreground">{tip.analystRating}</p>
          </div>
          {tip.targetPrice && (
            <div>
              <h3 className="font-semibold text-lg mb-1">Prezzo Target:</h3>
              <p className="text-muted-foreground">{tip.targetPrice}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-12 pt-8 border-t text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Portafoglio di Markowitz. Tutti i diritti riservati.</p>
        <p className="text-xs mt-1">
          Le informazioni fornite sono solo a scopo informativo e non costituiscono consulenza finanziaria.
        </p>
      </footer>
    </div>
  );
}

// Genera percorsi statici per ogni tip (opzionale, per build statiche)
export async function generateStaticParams() {
  return investmentTips.map((tip) => ({
    tipId: tip.id,
  }));
}