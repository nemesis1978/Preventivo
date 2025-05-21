import { NextResponse } from 'next/server';

// Mock data - in un'applicazione reale, questi dati verrebbero da un database
const investmentTips = [
  { id: "1", title: "Tech Stock Alpha", category: "Stocks", risk: "High", summary: "Promising tech stock with high growth potential.", date: "2024-07-15", details: "This stock belongs to a leading innovator in the AI sector, with strong Q2 earnings and a robust product pipeline. Analysts project a 25% upside in the next 12 months, but it carries significant market volatility.", analystRating: "Buy", targetPrice: "$250" },
  { id: "2", title: "Real Estate Gem", category: "Real Estate", risk: "Medium", summary: "Undervalued property in an emerging market.", date: "2024-07-10", details: "A commercial property located in a rapidly developing urban area. Current rental yields are at 6%, with potential for capital appreciation as infrastructure projects complete. Medium risk due to local economic factors.", analystRating: "Hold", targetPrice: "N/A" },
  { id: "3", title: "Green Energy Bond", category: "Bonds", risk: "Low", summary: "Stable returns from a renewable energy project.", date: "2024-07-05", details: "Issued by a reputable green energy provider, this bond offers a fixed 4.5% annual return. It's considered a low-risk investment, suitable for capital preservation and ESG-conscious investors.", analystRating: "Buy", targetPrice: "N/A" },
  { id: "4", title: "Crypto Innovator", category: "Crypto", risk: "Very High", summary: "Next-gen cryptocurrency with disruptive technology.", date: "2024-07-20", details: "A new cryptocurrency focused on decentralized finance (DeFi) solutions. While it has the potential for exponential growth, it is highly speculative and subject to extreme price swings. Invest only what you can afford to lose.", analystRating: "Speculative Buy", targetPrice: "$5" },
  { id: "5", title: "Diversified ETF", category: "ETF", risk: "Medium", summary: "Broad market exposure with a single investment.", date: "2024-06-30", details: "This ETF tracks the S&P 500, offering instant diversification across major US companies. It's a solid choice for long-term growth with moderate risk. Expense ratio is 0.03%.", analystRating: "Buy", targetPrice: "N/A" },
];

interface Params {
  tipId: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { tipId } = params;
  const tip = investmentTips.find(t => t.id === tipId);

  if (!tip) {
    return NextResponse.json({ error: 'Investment tip not found' }, { status: 404 });
  }

  return NextResponse.json({ data: tip });
}