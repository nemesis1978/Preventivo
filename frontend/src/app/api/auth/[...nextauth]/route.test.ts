// frontend/src/app/api/auth/[...nextauth]/route.test.ts
import { authOptions, GET, POST } from './route'; // Assicurati che il percorso sia corretto
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock di PrismaClient e bcrypt
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

jest.mock('next-auth/next', () => ({
  ...jest.requireActual('next-auth/next'),
  getServerSession: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient;
    }
  }
}

let mockPrisma: jest.Mocked<PrismaClient>;
let mockBcryptCompare: jest.MockedFunction<typeof bcrypt.compare>;
let mockGetServerSession: jest.Mock;

beforeEach(() => {
  // Reinizializza i mock prima di ogni test
  mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  // @ts-ignore
  global.prisma = mockPrisma; // Assicura che il prisma mockato sia usato globalmente se necessario

  mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
  mockGetServerSession = getServerSession as jest.Mock;
  jest.clearAllMocks();
  mockGetServerSession.mockClear();
});

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

describe('NextAuth authOptions - CredentialsProvider', () => {
  const credentialsProvider = authOptions.providers.find(
    (provider) => provider.id === 'credentials'
  ) as ReturnType<typeof CredentialsProvider>; // Cast per accedere a `authorize`

  if (!credentialsProvider || typeof credentialsProvider.authorize !== 'function') {
    throw new Error('CredentialsProvider o la sua funzione authorize non sono definiti correttamente');
  }

  const authorize = credentialsProvider.authorize;

  it('dovrebbe lanciare un errore se email o password mancano', async () => {
    await expect(authorize({ email: '', password: 'password' }, {} as any)).rejects.toThrow(
      'Email e password sono obbligatori.'
    );
    await expect(authorize({ email: 'test@example.com', password: '' }, {} as any)).rejects.toThrow(
      'Email e password sono obbligatori.'
    );
    await expect(authorize({ email: '', password: '' }, {} as any)).rejects.toThrow(
        'Email e password sono obbligatori.'
      );
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

  it('dovrebbe lanciare un errore se lutente non viene trovato nel database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(authorize({ email: 'nonexistent@example.com', password: 'password' }, {} as any)).rejects.toThrow(
      'Credenziali non valide.'
    );
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

  it('dovrebbe lanciare un errore se lutente non ha una hashedPassword', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com', hashedPassword: null, name: 'Test User', createdAt: new Date(), updatedAt: new Date() });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
    await expect(authorize({ email: 'test@example.com', password: 'password' }, {} as any)).rejects.toThrow(
      'Credenziali non valide.'
    );
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

  it('dovrebbe lanciare un errore se la password non è valida', async () => {
    const mockUser = { id: '1', email: 'test@example.com', hashedPassword: 'hashedPassword', name: 'Test User', createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    await expect(authorize({ email: 'test@example.com', password: 'wrongpassword' }, {} as any)).rejects.toThrow(
      'Credenziali non valide.'
    );
    expect(mockBcryptCompare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

  it('dovrebbe restituire i dati dellutente se le credenziali sono valide', async () => {
    const mockUser = { id: '1', email: 'test@example.com', hashedPassword: 'hashedPassword', name: 'Test User', createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);

    const result = await authorize({ email: 'test@example.com', password: 'password' }, {} as any);

    expect(result).toEqual({ id: '1', email: 'test@example.com', name: 'Test User' });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
    expect(mockBcryptCompare).toHaveBeenCalledWith('password', 'hashedPassword');
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

  // Test per la session callback
  describe('authOptions callbacks - session', () => {
    it('dovrebbe aggiungere userId e userRole alla sessione se token.sub e token.role esistono', async () => {
      const mockSession = {
        user: { name: 'Test User', email: 'test@example.com' },
        expires: '1',
      };
      const mockToken = {
        sub: 'user-id-123',
        role: 'admin',
        name: 'Test User',
        email: 'test@example.com',
        picture: undefined,
        iat: 123,
        exp: 456,
        jti: 'abc'
      };

      const sessionCallback = authOptions.callbacks?.session;
      if (!sessionCallback) throw new Error('Session callback not defined');

      const newSession = await sessionCallback({ session: mockSession, token: mockToken, user: {id: 'user-id-123', email: 'test@example.com', name: 'Test User'} });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

      expect(newSession.user).toBeDefined();
      expect(newSession.user?.id).toBe('user-id-123');
      // expect(newSession.user?.role).toBe('admin'); // TODO: Aggiungere il ruolo al token e all'utente
    });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

  // Test per la jwt callback
  describe('authOptions callbacks - jwt', () => {
    it('dovrebbe aggiungere user.id come sub e user.role al token durante il sign in', async () => {
      const mockUser = { id: 'user-id-123', email: 'test@example.com', name: 'Test User', role: 'user' }; // Aggiunto role
      const mockToken = { name: 'Test User', email: 'test@example.com', picture: undefined, iat: 123, exp: 456, jti: 'abc' }; // Token iniziale

      const jwtCallback = authOptions.callbacks?.jwt;
      if (!jwtCallback) throw new Error('JWT callback not defined');

      // @ts-ignore // user potrebbe non essere sempre presente, ma lo è al sign-in
      const newToken = await jwtCallback({ token: mockToken, user: mockUser });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

      expect(newToken.sub).toBe('user-id-123');
      // expect(newToken.role).toBe('user'); // TODO: Verificare come il ruolo viene effettivamente aggiunto
    });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});

    it('dovrebbe restituire il token esistente se user non è presente (chiamate successive)', async () => {
      const mockExistingToken = {
        sub: 'existing-user-id',
        role: 'editor',
        name: 'Existing User',
        email: 'existing@example.com',
        picture: undefined,
        iat: 123,
        exp: 456,
        jti: 'abc'
      };

      const jwtCallback = authOptions.callbacks?.jwt;
      if (!jwtCallback) throw new Error('JWT callback not defined');

      const returnedToken = await jwtCallback({ token: mockExistingToken });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
}); // user non è passato

      expect(returnedToken).toEqual(mockExistingToken);
    });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
  });

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
});

describe('NextAuth Integration Tests - API Endpoints', () => {
  describe('GET /api/auth/session', () => {
    it('should return session data for an authenticated user', async () => {
      const mockSessionData = { user: { id: 'user123', email: 'test@example.com', name: 'Test User' }, expires: 'some-date' };
      mockGetServerSession.mockResolvedValue(mockSessionData);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request); // Chiama il gestore GET esportato
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockSessionData);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return an empty object for an unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200); // NextAuth /api/auth/session restituisce 200 anche senza sessione
      // NextAuth restituisce un oggetto vuoto {} quando non c'è sessione e la richiesta è per /api/auth/session
      expect(body).toEqual({}); 
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});