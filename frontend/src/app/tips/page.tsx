// frontend/src/app/tips/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tip {
  id: number;
  title: string;
  description?: string;
  category?: { name: string };
  riskLevel?: string;
  expectedReturn?: number;
  author?: { name: string };
  createdAt: string; // Assumendo che createdAt sia una stringa ISO
  // Aggiungi altri campi necessari
}

interface ApiResponse {
  data: Tip[];
  totalPages: number;
  currentPage: number;
  totalTips: number;
}

const ITEMS_PER_PAGE = 10;

export default function TipsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtri e ordinamento
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [riskLevelFilter, setRiskLevelFilter] = useState(searchParams.get('riskLevel') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const fetchData = useCallback(async (page: number, category: string, risk: string, sortField: string, order: string) => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams();
    query.append('page', page.toString());
    query.append('limit', ITEMS_PER_PAGE.toString());
    if (category) query.append('category', category);
    if (risk) query.append('riskLevel', risk);
    query.append('sortBy', sortField);
    query.append('sortOrder', order);

    // Aggiorna URL
    router.push(`/tips?${query.toString()}`, { scroll: false });

    try {
      const response = await fetch(`http://localhost:3001/api/tips?${query.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Error: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      setTips(result.data);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tips.');
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const category = searchParams.get('category') || '';
    const risk = searchParams.get('riskLevel') || '';
    const sortField = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('sortOrder') || 'desc';

    setCurrentPage(page);
    setCategoryFilter(category);
    setRiskLevelFilter(risk);
    setSortBy(sortField);
    setSortOrder(order);

    fetchData(page, category, risk, sortField, order);
  }, [searchParams, fetchData]);

  const handleFilterChange = () => {
    fetchData(1, categoryFilter, riskLevelFilter, sortBy, sortOrder);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage, categoryFilter, riskLevelFilter, sortBy, sortOrder);
    }
  };

  const handleSortChange = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    fetchData(1, categoryFilter, riskLevelFilter, newSortBy, newSortOrder);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Elenco Consigli di Investimento</h1>

      {/* Filtri e Ordinamento */} 
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700">Categoria</label>
            <input 
              type="text" 
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Es: Azioni"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="riskLevelFilter" className="block text-sm font-medium text-gray-700">Livello di Rischio</label>
            <select 
              id="riskLevelFilter"
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Tutti</option>
              <option value="Basso">Basso</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>
          <button 
            onClick={handleFilterChange}
            className="w-full md:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Applica Filtri
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Caricamento...</p>}
      {error && <p className="text-center text-red-500">Errore: {error}</p>}

      {!loading && !error && tips.length === 0 && (
        <p className="text-center text-gray-600">Nessun consiglio trovato con i filtri specificati.</p>
      )}

      {!loading && !error && tips.length > 0 && (
        <>
          {/* Tabella dei Consigli */} 
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('title')}>
                    Titolo {sortBy === 'title' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('category')}>
                    Categoria {sortBy === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('riskLevel')}>
                    Rischio {sortBy === 'riskLevel' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('expectedReturn')}>
                    Rend. Atteso {sortBy === 'expectedReturn' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('createdAt')}>
                    Data Creazione {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tips.map((tip) => (
                  <tr key={tip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tip.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tip.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tip.riskLevel || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tip.expectedReturn !== null && tip.expectedReturn !== undefined ? `${tip.expectedReturn}%` : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tip.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginazione */} 
          <div className="mt-6 flex justify-center items-center">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage <= 1 || loading}
              className="px-4 py-2 mx-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Precedente
            </button>
            <span className="text-sm text-gray-700 mx-2">
              Pagina {currentPage} di {totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage >= totalPages || loading}
              className="px-4 py-2 mx-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Successiva
            </button>
          </div>
        </>
      )}
    </div>
  );
}