// frontend/src/app/investment-tips/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Importa useSession
import { motion } from 'framer-motion'; // Importa motion

interface Tip {
  id: string; // Modificato da number a string per coerenza con l'API dei preferiti
  title: string;
  description?: string;
  content?: string;
  category?: { name: string };
  riskLevel?: string;
  expectedReturn?: number;
  tags?: { name: string }[];
  author?: { name: string };
  isFavorite?: boolean; // Aggiunto per tracciare lo stato dei preferiti
}

export default function InvestmentTipsPage() {
  const { data: session, status: sessionStatus } = useSession(); // Ottieni la sessione
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [minReturn, setMinReturn] = useState('');

  const [results, setResults] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]); // Array di ID dei preferiti

  // Funzione per caricare i preferiti dell'utente
  const fetchUserFavorites = async () => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      try {
        const res = await fetch('/api/user/favorites');
        if (res.ok) {
          const favoriteTips: Tip[] = await res.json();
          setFavorites(favoriteTips.map(tip => tip.id));
        } else {
          console.error('Failed to fetch user favorites');
        }
      } catch (err) {
        console.error('Error fetching user favorites:', err);
      }
    }
  };

  useEffect(() => {
    fetchUserFavorites();
  }, [sessionStatus, session]);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-sky-400"></div>
      <p className="ml-3 text-gray-700 dark:text-gray-300">Caricamento...</p>
    </div>
  );

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="text-center p-8 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md">
      <p className="font-semibold">Errore!</p>
      <p>{message}</p>
    </div>
  );

  const NoResultsMessage = () => (
    <div className="text-center p-8 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 rounded-md">
      <p className="font-semibold">Nessun Risultato</p>
      <p>La tua ricerca non ha prodotto risultati. Prova a modificare i filtri.</p>
    </div>
  );

  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setNoResults(false);
    // setResults([]); // Non resettare i risultati qui per mantenere lo stato dei preferiti

    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    if (category) queryParams.append('category', category);
    if (riskLevel) queryParams.append('riskLevel', riskLevel);
    if (minReturn) queryParams.append('minReturn', minReturn);

    try {
      const response = await fetch(`http://localhost:3001/api/tips/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setNoResults(true);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        setResults([]);
        return;
      }
      
      let data: Tip[] = await response.json();
      // Mappa i risultati per includere lo stato isFavorite
      data = data.map(tip => ({
        ...tip,
        id: String(tip.id), // Assicura che l'ID sia una stringa
        isFavorite: favorites.includes(String(tip.id))
      }));

      if (data.length === 0) {
        setNoResults(true);
      }
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch search results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Aggiorna i risultati quando cambiano i preferiti
  useEffect(() => {
    setResults(prevResults => 
      prevResults.map(tip => ({
        ...tip,
        isFavorite: favorites.includes(tip.id)
      }))
    );
  }, [favorites]);

  const toggleFavorite = async (tipId: string) => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      alert('Please log in to manage favorites.'); // O reindirizza al login
      return;
    }

    const isCurrentlyFavorite = favorites.includes(tipId);
    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
    const originalFavorites = [...favorites];

    // Ottimismo UI: aggiorna subito lo stato locale
    if (isCurrentlyFavorite) {
      setFavorites(prev => prev.filter(id => id !== tipId));
    } else {
      setFavorites(prev => [...prev, tipId]);
    }

    try {
      const response = await fetch('/api/user/favorites', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ investmentTipId: tipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Ripristina lo stato in caso di errore
        setFavorites(originalFavorites);
        alert(`Error: ${errorData.message || 'Failed to update favorite status'}`);
        console.error('Failed to update favorite status:', errorData);
      } else {
        // Se l'operazione ha successo, non c'è bisogno di fare nulla perché l'UI è già aggiornata
        // Potresti voler ricaricare i preferiti per sicurezza, ma non è strettamente necessario con l'ottimismo UI
        // fetchUserFavorites(); // Opzionale
      }
    } catch (err: any) {
      setFavorites(originalFavorites);
      alert(`Error: ${err.message || 'An unexpected error occurred.'}`);
      console.error('Error toggling favorite:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Ricerca Consigli di Investimento</h1>

      <form onSubmit={handleSearch} className="mb-8 p-6 bg-gray-100 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Termine di Ricerca</label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Es: Azioni tech, ETF S&P 500..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Es: Azioni, Obbligazioni..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="riskLevel" className="block text-sm font-medium text-gray-700 mb-1">Livello di Rischio</label>
            <select
              id="riskLevel"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Tutti</option>
              <option value="Basso">Basso</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
            </select>
          </div>
           <div>
            <label htmlFor="minReturn" className="block text-sm font-medium text-gray-700 mb-1">Rendimento Min. Atteso (%)</label>
            <input
              type="number"
              id="minReturn"
              value={minReturn}
              onChange={(e) => setMinReturn(e.target.value)}
              placeholder="Es: 5"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-1 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {loading ? 'Ricerca in corso...' : 'Cerca Consigli'}
            </button>
          </div>
        </div>
      </form>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {noResults && !loading && !error && <NoResultsMessage />}

      {!loading && !error && !noResults && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-sky-400">{tip.title}</h2>
                {tip.description && <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{tip.description}</p>}
                {tip.content && <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 whitespace-pre-wrap">{tip.content.substring(0,150)}...</p>}
                {tip.category && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1"><strong>Categoria:</strong> {tip.category.name}</p>}
                {tip.riskLevel && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1"><strong>Rischio:</strong> {tip.riskLevel}</p>}
                {tip.expectedReturn && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1"><strong>Rendimento Atteso:</strong> {tip.expectedReturn}%</p>}
                {tip.author && <p className="text-xs text-gray-400 dark:text-gray-500 mt-3"><em>Autore: {tip.author.name}</em></p>}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                {sessionStatus === 'authenticated' && (
                  <button
                    onClick={() => toggleFavorite(tip.id)}
                    className={`w-full font-bold py-2 px-4 rounded transition duration-150 ease-in-out 
                      ${tip.isFavorite 
                        ? 'bg-red-500 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700' 
                        : 'bg-green-500 hover:bg-green-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'}`}
                  >
                    {tip.isFavorite ? 'Rimuovi dai Preferiti' : 'Aggiungi ai Preferiti'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}