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
    return <div className="container mx-auto p-4 text-center">Loading favorites...</div>;
  }

  if (status === 'unauthenticated') {
    // Questo stato viene gestito dal redirect nell'useEffect, ma è bene averlo per completezza
    return <div className="container mx-auto p-4 text-center">Redirecting to login...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">My Favorite Investment Tips</h1>
      {favorites.length === 0 ? (
        <p className="text-center text-gray-600">You haven't added any favorites yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((tip) => (
            <div key={tip.id} className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{tip.title}</h2>
                <p className="text-gray-700 mb-1"><span className="font-medium">Category:</span> {tip.category || 'N/A'}</p>
                <p className="text-gray-700 mb-1"><span className="font-medium">Risk Level:</span> {tip.riskLevel || 'N/A'}</p>
                <p className="text-gray-700 mb-4"><span className="font-medium">Potential Return:</span> {tip.potentialReturn || 'N/A'}</p>
                <p className="text-gray-600 text-sm mb-4">{tip.description || tip.content || 'No description available.'}</p>
              </div>
              <button
                onClick={() => handleRemoveFavorite(tip.id)}
                className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full transition duration-150 ease-in-out"
              >
                Remove from Favorites
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
