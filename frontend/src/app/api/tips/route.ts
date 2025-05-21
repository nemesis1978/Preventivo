import { NextResponse } from 'next/server';

// Mock data for investment tips (stessa della pagina frontend per coerenza iniziale)
const investmentTips = [
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let page = parseInt(searchParams.get('page') || '1', 10);
  let limit = parseInt(searchParams.get('limit') || '5', 10);

  // Gestione dei valori non validi
  page = page <= 0 ? 1 : page;
  limit = limit <= 0 ? 5 : limit;
  const category = searchParams.get('category');
  const sortBy = searchParams.get('sortBy'); // e.g., 'date_desc', 'risk_asc'
  const searchQuery = searchParams.get('search')?.toLowerCase();

  let filteredTips = [...investmentTips];

  // Filtering by category
  if (category && category !== 'all') {
    filteredTips = filteredTips.filter(tip => tip.category.toLowerCase() === category.toLowerCase());
  }

  // Filtering by search query (title)
  if (searchQuery) {
    filteredTips = filteredTips.filter(tip => tip.title.toLowerCase().includes(searchQuery));
  }

  // Sorting
  if (sortBy === 'date_asc') {
    filteredTips.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sortBy === 'risk_asc') {
    const riskOrderAsc = { 'very low': 0, 'low': 1, 'medium': 2, 'high': 3, 'very high': 4 };
    filteredTips.sort((a, b) => riskOrderAsc[a.risk.toLowerCase() as keyof typeof riskOrderAsc] - riskOrderAsc[b.risk.toLowerCase() as keyof typeof riskOrderAsc]);
  } else if (sortBy === 'risk_desc') {
    const riskOrderDesc = { 'very low': 4, 'low': 3, 'medium': 2, 'high': 1, 'very high': 0 };
    filteredTips.sort((a, b) => riskOrderDesc[a.risk.toLowerCase() as keyof typeof riskOrderDesc] - riskOrderDesc[b.risk.toLowerCase() as keyof typeof riskOrderDesc]);
  } else { // Default to date_desc if sortBy is 'date_desc', undefined, or unrecognized
    filteredTips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Pagination
  const totalItems = filteredTips.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedTips = filteredTips.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedTips,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  });
}