// frontend/src/app/api/user/favorites/route.test.ts
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from './route'; // Assicurati che il percorso sia corretto
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    userFavorite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    investmentTip: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

// Mock next-auth
jest.mock('next-auth/next');
const mockGetServerSession = getServerSession as jest.Mock;

let prisma: PrismaClient;

beforeEach(() => {
  prisma = new PrismaClient();
  jest.clearAllMocks();
});

const mockReq = (method: string, body?: any, searchParams?: URLSearchParams) => {
  const req = new NextRequest(`http://localhost/api/user/favorites${searchParams ? '?' + searchParams.toString() : ''}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
  return req;
};

describe('API /api/user/favorites', () => {
  describe('GET /api/user/favorites', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = mockReq('GET');
      const response = await GET(req);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.message).toBe('Unauthorized');
    });

    it('should return user favorites if authenticated', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      const mockFavs = [
        { userId: 'user1', investmentTipId: 'tip1', investmentTip: { id: 'tip1', title: 'Tip 1' } },
        { userId: 'user1', investmentTipId: 'tip2', investmentTip: { id: 'tip2', title: 'Tip 2' } },
      ];
      (prisma.userFavorite.findMany as jest.Mock).mockResolvedValue(mockFavs);

      const req = mockReq('GET');
      const response = await GET(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual([{ id: 'tip1', title: 'Tip 1' }, { id: 'tip2', title: 'Tip 2' }]);
      expect(prisma.userFavorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: { investmentTip: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return 500 on database error', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.userFavorite.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const req = mockReq('GET');
      const response = await GET(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.message).toBe('Error fetching favorites');
    });
  });

  describe('POST /api/user/favorites', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = mockReq('POST', { investmentTipId: 'tip1' });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 if investmentTipId is missing', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = mockReq('POST', {});
      const response = await POST(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('InvestmentTip ID is required');
    });

    it('should return 404 if investment tip does not exist', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.investmentTip.findUnique as jest.Mock).mockResolvedValue(null);

      const req = mockReq('POST', { investmentTipId: 'nonexistent-tip' });
      const response = await POST(req);
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.message).toBe('InvestmentTip not found');
    });

    it('should return 409 if tip is already favorited', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.investmentTip.findUnique as jest.Mock).mockResolvedValue({ id: 'tip1', title: 'Tip 1' });
      (prisma.userFavorite.findUnique as jest.Mock).mockResolvedValue({ userId: 'user1', investmentTipId: 'tip1' });

      const req = mockReq('POST', { investmentTipId: 'tip1' });
      const response = await POST(req);
      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.message).toBe('Already favorited');
    });

    it('should add favorite and return 201 if successful', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      const tipDetails = { id: 'tip1', title: 'Tip 1', description: 'A great tip' };
      (prisma.investmentTip.findUnique as jest.Mock).mockResolvedValue(tipDetails);
      (prisma.userFavorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userFavorite.create as jest.Mock).mockResolvedValue({
        userId: 'user1',
        investmentTipId: 'tip1',
        investmentTip: tipDetails,
      });

      const req = mockReq('POST', { investmentTipId: 'tip1' });
      const response = await POST(req);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual(tipDetails);
      expect(prisma.userFavorite.create).toHaveBeenCalledWith({
        data: { userId: 'user1', investmentTipId: 'tip1' },
        include: { investmentTip: true },
      });
    });

    it('should return 500 on database error during add', async () => {
        const mockSession = { user: { id: 'user1' } };
        mockGetServerSession.mockResolvedValue(mockSession);
        (prisma.investmentTip.findUnique as jest.Mock).mockResolvedValue({ id: 'tip1', title: 'Tip 1' });
        (prisma.userFavorite.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.userFavorite.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
  
        const req = mockReq('POST', { investmentTipId: 'tip1' });
        const response = await POST(req);
        expect(response.status).toBe(500);
        const json = await response.json();
        expect(json.message).toBe('Error adding favorite');
      });
  });

  describe('DELETE /api/user/favorites', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = mockReq('DELETE', { investmentTipId: 'tip1' });
      const response = await DELETE(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 if investmentTipId is missing', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = mockReq('DELETE', {});
      const response = await DELETE(req);
      expect(response.status).toBe(400);
    });

    it('should remove favorite and return 200 if successful', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.userFavorite.delete as jest.Mock).mockResolvedValue({}); // Prisma delete returns the deleted record or throws

      const req = mockReq('DELETE', { investmentTipId: 'tip1' });
      const response = await DELETE(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('Favorite removed successfully');
      expect(prisma.userFavorite.delete).toHaveBeenCalledWith({
        where: {
          userId_investmentTipId: {
            userId: 'user1',
            investmentTipId: 'tip1',
          },
        },
      });
    });

    it('should return 404 if favorite to delete is not found (Prisma P2025 error)', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      const prismaError = { code: 'P2025', message: 'Record to delete does not exist.' };
      (prisma.userFavorite.delete as jest.Mock).mockRejectedValue(prismaError);

      const req = mockReq('DELETE', { investmentTipId: 'nonexistent-fav' });
      const response = await DELETE(req);
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.message).toBe('Favorite not found or already removed');
    });

    it('should return 500 on other database error during delete', async () => {
      const mockSession = { user: { id: 'user1' } };
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.userFavorite.delete as jest.Mock).mockRejectedValue(new Error('Some other DB Error'));

      const req = mockReq('DELETE', { investmentTipId: 'tip1' });
      const response = await DELETE(req);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.message).toBe('Error removing favorite');
    });
  });
});