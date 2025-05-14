// frontend/src/app/investment-tips/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestmentTipsPage from './page'; // Assicurati che il percorso sia corretto
import { SessionProvider, useSession } from 'next-auth/react'; // Importa SessionProvider e useSession

// Mock di fetch
global.fetch = jest.fn();

// Mock di next-auth/react
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.Mock;

const mockFetch = (data: any, ok = true, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
  });
};

const mockTipsData = [
  { id: '1', title: 'Consiglio Azionario Alpha', description: 'Un buon consiglio Alpha', category: { name: 'Azioni'} },
  { id: '2', title: 'Consiglio Obbligazionario Beta', description: 'Molto sicuro Beta', category: { name: 'Obbligazioni'} },
];

// Helper per renderizzare con SessionProvider
const renderWithSession = (session: any) => {
  mockUseSession.mockReturnValue(session);
  return render(
    <SessionProvider session={session.data}>
      <InvestmentTipsPage />
    </SessionProvider>
  );
};


describe('InvestmentTipsPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockUseSession.mockClear();
  });

  it('should render the search form and title', () => {
    renderWithSession({ data: null, status: 'unauthenticated' });
    expect(screen.getByRole('heading', { name: /Ricerca Consigli di Investimento/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Termine di Ricerca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categoria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Livello di Rischio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rendimento Min. Atteso \(%\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerca/i })).toBeInTheDocument();
  });

  it('should allow typing in input fields', () => {
    renderWithSession({ data: null, status: 'unauthenticated' });
    const searchTermInput = screen.getByLabelText(/Termine di Ricerca/i) as HTMLInputElement;
    fireEvent.change(searchTermInput, { target: { value: 'Azioni Apple' } });
    expect(searchTermInput.value).toBe('Azioni Apple');

    const categoryInput = screen.getByLabelText(/Categoria/i) as HTMLInputElement;
    fireEvent.change(categoryInput, { target: { value: 'Tech' } });
    expect(categoryInput.value).toBe('Tech');

    const riskLevelSelect = screen.getByLabelText(/Livello di Rischio/i) as HTMLSelectElement;
    fireEvent.change(riskLevelSelect, { target: { value: 'Medio' } });
    expect(riskLevelSelect.value).toBe('Medio');

    const minReturnInput = screen.getByLabelText(/Rendimento Min. Atteso \(%\)/i) as HTMLInputElement;
    fireEvent.change(minReturnInput, { target: { value: '7' } });
    expect(minReturnInput.value).toBe('7');
  });

  it('should call fetch with correct parameters on search and display results', async () => {
    mockFetch(mockTipsData); // API per la ricerca
    mockFetch([]); // API per i preferiti iniziali (vuoti)

    renderWithSession({ data: { user: { id: 'test-user' } }, status: 'authenticated' });
    fireEvent.change(screen.getByLabelText(/Termine di Ricerca/i), { target: { value: 'Consiglio' } });
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/tips/search?searchTerm=Consiglio');
    });

    await waitFor(() => {
      expect(screen.getByText('Consiglio Azionario Alpha')).toBeInTheDocument();
      expect(screen.getByText('Consiglio Obbligazionario Beta')).toBeInTheDocument();
    });
  });

  it('should display loading state during fetch', async () => {
    mockFetch([], true);
    render(<InvestmentTipsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    expect(screen.getByRole('button', { name: /Ricerca.../i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cerca/i })).toBeInTheDocument(); // Torna a 'Cerca' dopo il fetch
    });
  });

  it('should display "no results" message when API returns 404 or empty array', async () => {
    // Test con 404
    mockFetch({ message: 'Not found' }, false, 404);
    render(<InvestmentTipsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    await waitFor(() => {
      expect(screen.getByText('Nessun consiglio trovato con i criteri specificati.')).toBeInTheDocument();
    });

    // Test con array vuoto
    (global.fetch as jest.Mock).mockClear();
    mockFetch([], true, 200);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));
    await waitFor(() => {
        expect(screen.getByText('Nessun consiglio trovato con i criteri specificati.')).toBeInTheDocument();
      });
  });

  it('should display error message on fetch failure (non-404)', async () => {
    mockFetch({ message: 'Internal Server Error' }, false, 500);
    render(<InvestmentTipsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    await waitFor(() => {
      expect(screen.getByText(/Errore: Internal Server Error/i)).toBeInTheDocument();
    });
  });

   it('should build a complete query string with all filters', async () => {
    mockFetch([]);
    render(<InvestmentTipsPage />);

    fireEvent.change(screen.getByLabelText(/Termine di Ricerca/i), { target: { value: 'Tech Avanzato' } });
    fireEvent.change(screen.getByLabelText(/Categoria/i), { target: { value: 'Tecnologia' } });
    fireEvent.change(screen.getByLabelText(/Livello di Rischio/i), { target: { value: 'Alto' } });
    fireEvent.change(screen.getByLabelText(/Rendimento Min. Atteso \(%\)/i), { target: { value: '10' } });

    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tips/search?searchTerm=Tech+Avanzato&category=Tecnologia&riskLevel=Alto&minReturn=10'
      );
    });
  });

});


describe('Favorites Functionality', () => {
  const authenticatedSession = { data: { user: { id: 'user123' } }, status: 'authenticated' };
  const unauthenticatedSession = { data: null, status: 'unauthenticated' };

  it('should display favorite buttons when user is authenticated and tips are loaded', async () => {
    mockFetch(mockTipsData); // Search API
    mockFetch([]); // Favorites API (initial empty)

    renderWithSession(authenticatedSession);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Aggiungi ai Preferiti').length).toBeGreaterThan(0);
    });
  });

  it('should NOT display favorite buttons when user is unauthenticated', async () => {
    mockFetch(mockTipsData); // Search API
    // No call to favorites API if unauthenticated

    renderWithSession(unauthenticatedSession);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    await waitFor(() => {
      expect(screen.getByText('Consiglio Azionario Alpha')).toBeInTheDocument(); // Tips should still load
    });
    expect(screen.queryByText('Aggiungi ai Preferiti')).not.toBeInTheDocument();
    expect(screen.queryByText('Rimuovi dai Preferiti')).not.toBeInTheDocument();
  });

  it('should allow adding a tip to favorites', async () => {
    mockFetch(mockTipsData); // Search API
    mockFetch([]); // Initial favorites (empty)
    mockFetch({ id: '1', title: 'Consiglio Azionario Alpha' }, true, 201); // POST to favorites API

    renderWithSession(authenticatedSession);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    let addButton: HTMLElement;
    await waitFor(() => {
      addButton = screen.getAllByText('Aggiungi ai Preferiti')[0];
      expect(addButton).toBeInTheDocument();
    });

    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentTipId: mockTipsData[0].id }),
      });
      expect(screen.getByText('Rimuovi dai Preferiti')).toBeInTheDocument();
    });
  });

  it('should allow removing a tip from favorites', async () => {
    mockFetch(mockTipsData); // Search API
    mockFetch([{ id: mockTipsData[0].id, title: 'Consiglio Azionario Alpha' }]); // Initial favorites (tip 1 is favorite)
    mockFetch({ message: 'Favorite removed' }, true, 200); // DELETE from favorites API

    renderWithSession(authenticatedSession);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    let removeButton: HTMLElement;
    await waitFor(() => {
      // Wait for the specific tip to be marked as favorite and its button to appear
      const tip1Card = screen.getByText(mockTipsData[0].title).closest('div');
      removeButton = within(tip1Card!).getByText('Rimuovi dai Preferiti');
      expect(removeButton).toBeInTheDocument();
    });

    fireEvent.click(removeButton!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentTipId: mockTipsData[0].id }),
      });
      // After removal, the button for this specific tip should change back
      const tip1Card = screen.getByText(mockTipsData[0].title).closest('div');
      expect(within(tip1Card!).getByText('Aggiungi ai Preferiti')).toBeInTheDocument();
    });
  });

  it('should handle API error when adding to favorites and revert UI', async () => {
    mockFetch(mockTipsData); // Search API
    mockFetch([]); // Initial favorites (empty)
    mockFetch({ message: 'Server Error' }, false, 500); // POST to favorites API fails
    window.alert = jest.fn(); // Mock alert

    renderWithSession(authenticatedSession);
    fireEvent.click(screen.getByRole('button', { name: /Cerca/i }));

    let addButton: HTMLElement;
    await waitFor(() => {
      addButton = screen.getAllByText('Aggiungi ai Preferiti')[0];
    });

    fireEvent.click(addButton!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/favorites', expect.anything());
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Error: Server Error'));
      // UI should revert, button is still 'Aggiungi ai Preferiti'
      expect(screen.getAllByText('Aggiungi ai Preferiti')[0]).toBeInTheDocument();
      expect(screen.queryByText('Rimuovi dai Preferiti')).not.toBeInTheDocument(); // Assuming only one tip was interacted with
    });
    (window.alert as jest.Mock).mockClear();
  });
});

// Helper to access elements within a specific scope (like a card)
const within = (element: HTMLElement) => ({
  getByText: (text: string) => screen.getByText(text, { selector: `${element.tagName} *` }),
  // Add other queries if needed
});
