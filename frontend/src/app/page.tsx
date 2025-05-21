import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

// Mock data for investment tips
const investmentTips = [
  { id: 1, title: "Tech Stock Alpha", category: "Stocks", risk: "High", summary: "Promising tech stock with high growth potential." },
  { id: 2, title: "Real Estate Gem", category: "Real Estate", risk: "Medium", summary: "Undervalued property in an emerging market." },
  { id: 3, title: "Green Energy Bond", category: "Bonds", risk: "Low", summary: "Stable returns from a renewable energy project." },
  { id: 4, title: "Crypto Innovator", category: "Crypto", risk: "Very High", summary: "Next-gen cryptocurrency with disruptive technology." },
  { id: 5, title: "Diversified ETF", category: "ETF", risk: "Medium", summary: "Broad market exposure with a single investment." },
];

export default function InvestmentTipsPage() {
  return (
    <div className="container mx-auto py-8 px-4 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center">Spunti di Investimento Curati</h1>
        <p className="text-lg text-muted-foreground text-center mt-2">
          Esplora la nostra lista dinamica di opportunità di investimento, selezionate per te.
        </p>
      </header>

      {/* Filters and Sorting Section */}
      <div className="mb-6 p-4 border rounded-lg shadow-sm bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">Cerca per Titolo</label>
            <Input id="search" placeholder="Es. Tech Stock Alpha" className="w-full" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">Filtra per Categoria</label>
            <Select>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Seleziona Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                <SelectItem value="stocks">Azioni</SelectItem>
                <SelectItem value="bonds">Obbligazioni</SelectItem>
                <SelectItem value="real_estate">Immobiliare</SelectItem>
                <SelectItem value="crypto">Criptovalute</SelectItem>
                <SelectItem value="etf">ETF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-foreground mb-1">Ordina Per</label>
            <Select>
              <SelectTrigger id="sort" className="w-full">
                <SelectValue placeholder="Seleziona Ordinamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Più Recenti</SelectItem>
                <SelectItem value="date_asc">Meno Recenti</SelectItem>
                <SelectItem value="risk_asc">Rischio (Basso > Alto)</SelectItem>
                <SelectItem value="risk_desc">Rischio (Alto > Basso)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Investment Tips List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investmentTips.map((tip) => (
          <Card key={tip.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{tip.title}</CardTitle>
              <CardDescription>Categoria: {tip.category} - Rischio: {tip.risk}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>{tip.summary}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Vedi Dettagli</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination Section */}
      <div className="mt-8 flex justify-center items-center space-x-2">
        <Button variant="outline">Precedente</Button>
        <span className="text-sm text-muted-foreground">Pagina 1 di X</span>
        <Button variant="outline">Successivo</Button>
      </div>

      <footer className="mt-12 pt-8 border-t text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Portafoglio di Markowitz. Tutti i diritti riservati.</p>
        <p className="text-xs mt-1">
          Le informazioni fornite sono solo a scopo informativo e non costituiscono consulenza finanziaria.
        </p>
      </footer>
    </div>
  );
}
