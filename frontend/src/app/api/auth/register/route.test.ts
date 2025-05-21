// frontend/src/app/api/auth/register/route.test.ts

// Mock PrismaClient
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Mock NextResponse
const mockNextResponseJson = jest.fn(); // Deve essere definito prima del mock che lo usa
jest.mock('next/server', () => {
  const actualNextServer = jest.requireActual('next/server');
  return {
    ...actualNextServer,
    NextResponse: {
      ...actualNextServer.NextResponse, // Mantiene altri metodi/proprietà statiche di NextResponse
      json: (...args: any[]) => {
        mockNextResponseJson(...args);
        // Determina lo status; default a 200 se non specificato o non valido
        let responseStatus = 200;
        if (args[1] && typeof args[1].status === 'number') {
          responseStatus = args[1].status;
        }
        // Restituisce un oggetto che simula una Response per i test
        return { status: responseStatus, json: async () => args[0] } as any;
      },
    },
  };
});

import { POST } from './route'; // Assicurati che il percorso sia corretto
import { PrismaClient } from '@prisma/client'; // Anche se mockato, l'import può essere necessario per i tipi o se il mock non è completo
import bcrypt from 'bcryptjs'; // Come sopra
import { NextResponse } from 'next/server'; // Come sopra


describe('POST /api/auth/register', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    // Configura un mock di base per Request
    mockRequest = {
      json: jest.fn(),
    } as unknown as Request;
    mockNextResponseJson.mockImplementation((body, init) => ({ body, init }));
  });

  it('should return 400 if name, email, or password are not provided', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValueOnce({ name: 'Test', email: 'test@example.com' }); // Password mancante
    await POST(mockRequest);
    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'Name, email, and password are required' }, { status: 400 });

    (mockRequest.json as jest.Mock).mockResolvedValueOnce({ name: 'Test', password: 'password' }); // Email mancante
    await POST(mockRequest);
    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'Name, email, and password are required' }, { status: 400 });

    (mockRequest.json as jest.Mock).mockResolvedValueOnce({ email: 'test@example.com', password: 'password' }); // Name mancante
    await POST(mockRequest);
    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'Name, email, and password are required' }, { status: 400 });
  });

  it('should return 409 if user already exists', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValueOnce({ name: 'Test User', email: 'exists@example.com', password: 'password123' });
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: '1', email: 'exists@example.com' });

    await POST(mockRequest);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'exists@example.com' } });
    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'User already exists with this email' }, { status: 409 });
  });

  it('should create a new user and return 201 if data is valid and user does not exist', async () => {
    const userData = { name: 'New User', email: 'new@example.com', password: 'password123' };
    const hashedPassword = 'hashedPassword123';
    const createdUser = { id: '2', name: userData.name, email: userData.email }; // Password non inclusa

    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userData);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // Utente non esistente
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
    (mockPrisma.user.create as jest.Mock).mockResolvedValueOnce({ ...createdUser, password: hashedPassword });

    await POST(mockRequest);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
    expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
      },
    });
    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'User created successfully', user: createdUser }, { status: 201 });
  });

  it('should return 500 for other internal server errors', async () => {
    (mockRequest.json as jest.Mock).mockResolvedValueOnce({ name: 'Error User', email: 'error@example.com', password: 'password123' });
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

    await POST(mockRequest);

    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'Internal server error during registration' }, { status: 500 });
  });

   it('should return 409 if Prisma throws P2002 error (unique constraint violation)', async () => {
    const userData = { name: 'Duplicate User', email: 'duplicate@example.com', password: 'password123' };
    const prismaError = new Error('Unique constraint failed') as any;
    prismaError.code = 'P2002';

    (mockRequest.json as jest.Mock).mockResolvedValueOnce(userData);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // Simula che il primo check passi
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedPassword');
    (mockPrisma.user.create as jest.Mock).mockRejectedValueOnce(prismaError); // Errore durante la creazione

    await POST(mockRequest);

    expect(mockNextResponseJson).toHaveBeenCalledWith({ message: 'An account with this email already exists.' }, { status: 409 });
  });
});