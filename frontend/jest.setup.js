// frontend/jest.setup.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Puoi aggiungere qui altre configurazioni globali per Jest, se necessario.
// Esempio: mockare globalmente fetch o altre API del browser.

// Mock di Prisma Client per tutti i test per evitare connessioni reali al DB
// e per centralizzare la logica di mock
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      // Aggiungi altri metodi del modello User che usi
    },
    investmentTip: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      // Aggiungi altri metodi del modello InvestmentTip che usi
    },
    favoriteTip: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        // Aggiungi altri metodi del modello FavoriteTip che usi
    },
    // Aggiungi qui altri modelli Prisma che usi
    $transaction: jest.fn(async (callback) => callback(mockPrismaClient)), // Mock per le transazioni
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock per next-auth/react
jest.mock('next-auth/react', () => ({
  __esModule: true,
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(() => Promise.resolve(null)),
  SessionProvider: jest.fn(({ children }) => children), // Mock semplice per SessionProvider
}));

// Mock globale per fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}), // Risposta JSON vuota di default
    text: () => Promise.resolve(''), // Risposta testuale vuota di default
    status: 200,
    headers: new Headers(),
  })
);

// Silenzia i console.error durante i test per mantenere pulito l'output,
// a meno che non sia specificamente un test per la gestione degli errori.
// beforeEach(() => {
//   jest.spyOn(console, 'error').mockImplementation(jest.fn());
// });