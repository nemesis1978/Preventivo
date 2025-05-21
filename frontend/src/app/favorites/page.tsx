// frontend/src/app/favorites/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Definizione del tipo per i consigli di investimento (da adattare alla tua struttura dati)
interface InvestmentTip {
  id: string;
  title: string;
  description: string;
  // Aggiungi altri campi necessari, es. category, riskLevel, potentialReturn
  category?: string;
  riskLevel?: string;
  potentialReturn?: string;
  content?: string; // Assumendo che ci sia un campo content
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 dark:border-sky-400"></div>
    <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Caricamento Preferiti...</p>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center p-10 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-3">Errore nel Caricamento</h2>
    <p>{message}</p>
    <p className="mt-2 text-sm">Prova a ricaricare la pagina o controlla la tua connessione.</p>
  </div>
);

const NoFavoritesMessage = () => (
  <div className="text-center p-10 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-3">Nessun Preferito</h2>
    <p>Non hai ancora aggiunto consigli ai tuoi preferiti.</p>
    <p className="mt-2 text-sm">Esplora i <a href="/investment-tips" className="text-indigo-600 dark:text-sky-400 hover:underline">consigli di investimento</a> per iniziare.</p>
  </div>
);

const FavoritesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<InvestmentTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login'); // Reindirizza al login se non autenticato
    }

    if (status === 'authenticated' && session?.user?.id) {
      const fetchFavorites = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/user/favorites');
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to fetch favorites');
          }
          const data: InvestmentTip[] = await res.json();
          setFavorites(data);
        } catch (err: any) {
          console.error('Error fetching favorites:', err);
          setError(err.message || 'An unexpected error occurred.');
        }
        setLoading(false);
      };

      fetchFavorites();
    }
  }, [session, status, router]);

  const handleRemoveFavorite = async (tipId: string) => {
    if (!session?.user?.id) {
      setError('User not authenticated.');
      return;
    }

    try {
      const res = await fetch('/api/user/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ investmentTipId: tipId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to remove favorite');
      }

      // Aggiorna la lista dei preferiti rimuovendo l'elemento
      setFavorites((prevFavorites) => prevFavorites.filter((fav) => fav.id !== tipId));
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      setError(err.message || 'An unexpected error occurred while removing the favorite.');
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  // unauthenticated status is handled by redirect in useEffect

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">I Miei Consigli Preferiti</h1>
      {favorites.length === 0 && !loading ? (
        <NoFavoritesMessage />
      !loading && favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((tip) => (
            <div key={tip.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col justify-between transition-shadow hover:shadow-xl">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold mb-2 text-indigo-700 dark:text-sky-400">{tip.title}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">Categoria:</span> {tip.category || 'N/D'}</p>
                <p className="text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">Livello Rischio:</span> {tip.riskLevel || 'N/D'}</p>
                <p className="text-gray-700 dark:text-gray-300 mb-4"><span className="font-medium">Ritorno Potenziale:</span> {tip.potentialReturn || 'N/D'}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{tip.description || tip.content || 'Nessuna descrizione disponibile.'}</p>
              </div>
              <button
                onClick={() => handleRemoveFavorite(tip.id)}
                className="mt-4 bg-red-500 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full transition duration-150 ease-in-out"
              >
                Rimuovi dai Preferiti
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
