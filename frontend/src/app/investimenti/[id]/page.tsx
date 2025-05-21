// frontend/src/app/investimenti/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Corretto import per App Router

interface TipDetail {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: { name: string };
  riskLevel?: string;
  expectedReturn?: number;
  tags?: { name: string }[];
  author?: { name: string };
  // Aggiungi altri campi se necessario
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 dark:border-sky-400"></div>
    <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Caricamento...</p>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center p-10 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-3">Errore nel Caricamento</h2>
    <p>{message}</p>
    <p className="mt-2 text-sm">Prova a ricaricare la pagina o torna alla homepage.</p>
  </div>
);

const NotFoundMessage = () => (
  <div className="text-center p-10 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-3">Consiglio non Trovato</h2>
    <p>Il consiglio di investimento che stai cercando non esiste o è stato rimosso.</p>
  </div>
);

export default function InvestmentDetailPage() {
  const params = useParams(); // Hook per accedere ai parametri della route
  const id = params?.id as string; // Estrai l'ID, assicurati che sia una stringa

  const [tip, setTip] = useState<TipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('ID del consiglio non fornito.');
      return;
    }

    const fetchTipDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assicurati che l'URL del backend sia corretto
        const response = await fetch(`http://localhost:3001/api/tips/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setTip(null); // Nessun errore, ma il tip non è stato trovato
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `Errore: ${response.status}`);
          }
        } else {
          const data: TipDetail = await response.json();
          setTip(data);
        }
      } catch (err: any) {
        setError(err.message || 'Impossibile caricare i dettagli del consiglio.');
        setTip(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTipDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!tip) {
    return <NotFoundMessage />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <article className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <div className="p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 dark:text-sky-400 mb-6">{tip.title}</h1>
          
          {tip.category && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <strong>Categoria:</strong> {tip.category.name}
            </p>
          )}
          {tip.riskLevel && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <strong>Livello di Rischio:</strong> {tip.riskLevel}
            </p>
          )}
          {tip.expectedReturn !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <strong>Rendimento Atteso:</strong> {tip.expectedReturn}%
            </p>
          )}

          {tip.description && (
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
              {tip.description}
            </p>
          )}

          {tip.content && (
            <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 mb-6">
              <p dangerouslySetInnerHTML={{ __html: tip.content.replace(/\n/g, '<br />') }} />
            </div>
          )}

          {tip.tags && tip.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {tip.tags.map(tag => (
                  <span key={tag.name} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1 text-xs font-semibold">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tip.author && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-8 text-right">
              <em>Autore: {tip.author.name}</em>
            </p>
          )}
        </div>
      </article>
    </div>
  );
}