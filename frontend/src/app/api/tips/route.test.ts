// frontend/src/app/api/tips/route.test.ts
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock dei dati dei consigli di investimento (coerenti con quelli in route.ts)
const mockInvestmentTips = [
  { id: 1, title: "Tech Stock Alpha", category: "Stocks", risk: "High", summary: "Promising tech stock with high growth potential.", date: "2024-07-15" },
  { id: 2, title: "Real Estate Gem", category: "Real Estate", risk: "Medium", summary: "Undervalued property in an emerging market.", date: "2024-07-10" },
  { id: 3, title: "Green Energy Bond", category: "Bonds", risk: "Low", summary: "Stable returns from a renewable energy project.", date: "2024-07-05" },
  { id: 4, title: "Crypto Innovator", category: "Crypto", risk: "Very High", summary: "Next-gen cryptocurrency with disruptive technology.", date: "2024-07-20" },
  { id: 5, title: "Diversified ETF", category: "ETF", risk: "Medium", summary: "Broad market exposure with a single investment.", date: "2024-06-30" },
  { id: 6, title: "Blue Chip Stock", category: "Stocks", risk: "Low", summary: "Reliable blue chip stock for stable growth.", date: "2024-07-18" },
  { id: 7, title: "Emerging Market Fund", category: "ETF", risk: "High", summary: "High potential returns from emerging economies.", date: "2024-07-12" },
  { id: 8, title: "Corporate Bond AAA", category: "Bonds", risk: "Very Low", summary: "Secure investment in a top-rated corporate bond.", date: "2024-07-01" },
  { id: 9, title: "Metaverse Real Estate", category: "Real Estate", risk: "Very High", summary: "Speculative investment in virtual land.", date: "2024-07-22" },
  { id: 10, title: "Stablecoin Yield", category: "Crypto", risk: "Low", summary: "Generating yield from stablecoin deposits.", date: "2024-07-19" },
];

// Helper per creare un mock di NextRequest
const createMockRequest = (searchParams: Record<string, string> = {}): NextRequest => {
  const url = new URL('http://localhost/api/tips');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString());
};

describe('GET /api/tips', () => {
  it('dovrebbe restituire la prima pagina di 5 tips di default', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(5);
    expect(pagination.totalItems).toBe(mockInvestmentTips.length);
    expect(pagination.currentPage).toBe(1);
    expect(pagination.itemsPerPage).toBe(5);
    expect(pagination.totalPages).toBe(Math.ceil(mockInvestmentTips.length / 5));
    // Default sort is now date_desc, so the first item should be the newest
    const sortedByDefault = [...mockInvestmentTips].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    expect(data[0].id).toBe(sortedByDefault[0].id);
  });

  it('dovrebbe restituire la seconda pagina di tips', async () => {
    const request = createMockRequest({ page: '2', limit: '3' });
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(3);
    expect(pagination.totalItems).toBe(mockInvestmentTips.length);
    expect(pagination.currentPage).toBe(2);
    expect(pagination.itemsPerPage).toBe(3);
    expect(pagination.totalPages).toBe(Math.ceil(mockInvestmentTips.length / 3));
    // Apply default sort (date_desc) to the full list before slicing for pagination
    const sortedByDefault = [...mockInvestmentTips].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const expectedSecondPageFirstItem = sortedByDefault[3]; // (page 2 - 1) * limit 3 = index 3
    expect(data[0].id).toBe(expectedSecondPageFirstItem.id);
  });


  it('dovrebbe filtrare i tips per categoria', async () => {
    const request = createMockRequest({ category: 'Stocks' });
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    const expectedTips = mockInvestmentTips.filter(tip => tip.category === 'Stocks');
    expect(data.length).toBe(expectedTips.length); // Assuming limit is high enough or not set to default 5
    expect(pagination.totalItems).toBe(expectedTips.length);
    data.forEach((tip: { category: string; }) => expect(tip.category).toBe('Stocks'));
  });

  it('dovrebbe filtrare i tips per categoria con paginazione', async () => {
    const request = createMockRequest({ category: 'Stocks', limit: '1' }); // Solo 1 stock per pagina
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    const allStockTips = mockInvestmentTips.filter(tip => tip.category === 'Stocks').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    expect(data.length).toBe(1);
    expect(pagination.totalItems).toBe(allStockTips.length);
    expect(data[0].id).toBe(allStockTips[0].id);
    expect(data[0].category).toBe('Stocks');
  });

  it('dovrebbe filtrare i tips per query di ricerca (titolo)', async () => {
    const request = createMockRequest({ search: 'alpha' });
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(1);
    expect(pagination.totalItems).toBe(1);
    expect(data[0].title).toContain('Alpha');
  });

  it('dovrebbe filtrare i tips per categoria E query di ricerca', async () => {
    const request = createMockRequest({ category: 'Stocks', search: 'alpha' });
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(1);
    expect(pagination.totalItems).toBe(1);
    expect(data[0].title).toContain('Tech Stock Alpha');
    expect(data[0].category).toBe('Stocks');
  });

  it('dovrebbe ordinare i tips per data discendente', async () => {
    const request = createMockRequest({ sortBy: 'date_desc' });
    const response = await GET(request);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    expect(new Date(data[0].date).getTime()).toBeGreaterThanOrEqual(new Date(data[1].date).getTime());
    expect(data[0].id).toBe(9); // Metaverse Real Estate (2024-07-22)
  });

  it('dovrebbe ordinare i tips per data discendente come default se sortBy non è specificato', async () => {
    const request = createMockRequest({ limit: '3' }); // No sortBy
    const response = await GET(request);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    // Il primo elemento dovrebbe essere il più recente se l'ordinamento di default è date_desc
    // Basandoci sui mock data, 'Metaverse Real Estate' (id: 9, date: 2024-07-22) è il più recente
    expect(data[0].id).toBe(9);
    expect(new Date(data[0].date).getTime()).toBeGreaterThanOrEqual(new Date(data[1].date).getTime());
  });

  it('dovrebbe ordinare i tips per data discendente se sortBy è sconosciuto', async () => {
    const request = createMockRequest({ sortBy: 'unknown_sort', limit: '3' });
    const response = await GET(request);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].id).toBe(9); // Metaverse Real Estate (2024-07-22)
    expect(new Date(data[0].date).getTime()).toBeGreaterThanOrEqual(new Date(data[1].date).getTime());
  });

  it('dovrebbe ordinare i tips per rischio ascendente', async () => {
    const request = createMockRequest({ sortBy: 'risk_asc', limit: '10' }); // Aumenta il limite per vedere l'ordinamento completo
    const response = await GET(request);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    const riskOrder = { 'very low': 0, 'low': 1, 'medium': 2, 'high': 3, 'very high': 4 };
    for (let i = 0; i < data.length - 1; i++) {
      const riskA = riskOrder[data[i].risk.toLowerCase() as keyof typeof riskOrder];
      const riskB = riskOrder[data[i+1].risk.toLowerCase() as keyof typeof riskOrder];
      expect(riskA).toBeLessThanOrEqual(riskB);
    }
    expect(data[0].risk.toLowerCase()).toBe('very low'); // Corporate Bond AAA
  });

  it('dovrebbe ordinare i tips per rischio decrescente', async () => {
    const request = createMockRequest({ sortBy: 'risk_desc', limit: '10' });
    const response = await GET(request);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    const riskOrder = { 'very low': 4, 'low': 3, 'medium': 2, 'high': 1, 'very high': 0 }; // Invertito per desc
    for (let i = 0; i < data.length - 1; i++) {
      const riskA = riskOrder[data[i].risk.toLowerCase() as keyof typeof riskOrder];
      const riskB = riskOrder[data[i+1].risk.toLowerCase() as keyof typeof riskOrder];
      expect(riskA).toBeLessThanOrEqual(riskB); // riskA dovrebbe essere "più alto" o uguale a riskB
    }
    // Il primo elemento dovrebbe avere il rischio più alto
    const highestRiskTip = mockInvestmentTips.reduce((prev, current) => 
        (riskOrder[prev.risk.toLowerCase() as keyof typeof riskOrder] < riskOrder[current.risk.toLowerCase() as keyof typeof riskOrder]) ? prev : current
    );
    expect(data[0].risk.toLowerCase()).toBe(highestRiskTip.risk.toLowerCase()); 
  });

  it('dovrebbe gestire una pagina non valida (e.g., 0 o negativa) tornando alla pagina 1', async () => {
    const request = createMockRequest({ page: '0' });
    const response = await GET(request);
    const { pagination } = await response.json();
    expect(pagination.currentPage).toBe(1);

    const requestNegative = createMockRequest({ page: '-5' });
    const responseNegative = await GET(requestNegative);
    const { pagination: paginationNegative } = await responseNegative.json();
    expect(paginationNegative.currentPage).toBe(1);
  });

  it('dovrebbe gestire un limite non valido (e.g., 0 o negativo) usando il limite di default (5)', async () => {
    const request = createMockRequest({ limit: '0' });
    const response = await GET(request);
    const { pagination, data } = await response.json();
    expect(pagination.itemsPerPage).toBe(5);
    expect(data.length).toBe(5);

    const requestNegative = createMockRequest({ limit: '-5' });
    const responseNegative = await GET(requestNegative);
    const { pagination: paginationNegative, data: dataNegative } = await responseNegative.json();
    expect(paginationNegative.itemsPerPage).toBe(5);
    expect(dataNegative.length).toBe(5);
  });

  it('dovrebbe restituire un array vuoto se nessuna tip corrisponde ai filtri', async () => {
    const request = createMockRequest({ category: 'NonExistentCategory' });
    const response = await GET(request);
    const { data, pagination } = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(0);
    expect(pagination.totalItems).toBe(0);
  });
});