// frontend/src/app/api/tips/[tipId]/route.test.ts
import { GET } from './route';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mock dei dati dei consigli di investimento (coerenti con quelli in route.ts)
const mockInvestmentTips = [
  { id: "1", title: "Tech Stock Alpha", category: "Stocks", risk: "High", summary: "Promising tech stock with high growth potential.", date: "2024-07-15", details: "Details for Tech Stock Alpha" },
  { id: "2", title: "Real Estate Gem", category: "Real Estate", risk: "Medium", summary: "Undervalued property in an emerging market.", date: "2024-07-10", details: "Details for Real Estate Gem" },
  { id: "3", title: "Green Energy Bond", category: "Bonds", risk: "Low", summary: "Stable returns from a renewable energy project.", date: "2024-07-05", details: "Details for Green Energy Bond" },
];

// Simula il modulo che route.ts usa per ottenere i dati, se necessario.
// In questo caso, i dati sono hardcoded in route.ts, quindi non è strettamente necessario un mock complesso qui,
// ma è buona pratica prepararsi per quando i dati verranno da un database.

interface MockParams {
  params: { tipId: string };
}

describe('GET /api/tips/{tipId}', () => {
  it('dovrebbe restituire i dettagli di un consiglio di investimento esistente', async () => {
    const tipIdToTest = '1';
    const request = new NextRequest(`http://localhost/api/tips/${tipIdToTest}`);
    const context: MockParams = { params: { tipId: tipIdToTest } };

    const response = await GET(request, context);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(data.id).toBe(tipIdToTest);
    expect(data.title).toBe(mockInvestmentTips.find(t => t.id === tipIdToTest)?.title);
  });

  it('dovrebbe restituire un errore 404 se il consiglio di investimento non esiste', async () => {
    const tipIdToTest = 'non-existent-id';
    const request = new NextRequest(`http://localhost/api/tips/${tipIdToTest}`);
    const context: MockParams = { params: { tipId: tipIdToTest } };

    const response = await GET(request, context);
    const { error } = await response.json();

    expect(response.status).toBe(404);
    expect(error).toBe('Investment tip not found');
  });

  it('dovrebbe restituire i dati corretti per un altro ID valido', async () => {
    const tipIdToTest = '3';
    const request = new NextRequest(`http://localhost/api/tips/${tipIdToTest}`);
    const context: MockParams = { params: { tipId: tipIdToTest } };

    const response = await GET(request, context);
    const { data } = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(data.id).toBe(tipIdToTest);
    expect(data.category).toBe('Bonds');
  });
});