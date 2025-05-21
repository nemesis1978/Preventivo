// backend/src/controllers/tipController.test.js
const { searchTips, getAllTips, getTipById } = require('./tipController');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    investmentTip: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

let prisma;
let mockRequest;
let mockResponse;

beforeEach(() => {
  prisma = new PrismaClient();
  mockRequest = {
    query: {},
  };
  mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  // Reset mocks before each test
  prisma.investmentTip.findMany.mockReset();
  prisma.investmentTip.findUnique.mockReset();
  prisma.investmentTip.count.mockReset();
  
  // Assicurati che mockRequest.params esista per i test di getTipById
  if (!mockRequest.params) {
    mockRequest.params = {};
  }
});

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and results when tips are found', async () => {
    const mockResults = [{ id: 1, title: 'Test Tip' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockResults);

    mockRequest.query = { searchTerm: 'Test' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { title: { contains: 'Test', mode: 'insensitive' } },
          { description: { contains: 'Test', mode: 'insensitive' } },
          { content: { contains: 'Test', mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockResults);
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should return 404 when no tips are found', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);

    mockRequest.query = { searchTerm: 'NonExistent' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should return 500 on database error', async () => {
    const errorMessage = 'Database error';
    prisma.investmentTip.findMany.mockRejectedValue(new Error(errorMessage));

    mockRequest.query = { searchTerm: 'Test' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for category filter', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Category Tip' }]);
    mockRequest.query = { category: 'Azioni' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for riskLevel filter', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Risk Tip' }]);
    mockRequest.query = { riskLevel: 'Basso' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        riskLevel: 'Basso',
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for minReturn filter', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Return Tip' }]);
    mockRequest.query = { minReturn: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        expectedReturn: { gte: 5 },
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for maxReturn filter', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Return Tip' }]);
    mockRequest.query = { maxReturn: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        expectedReturn: { lte: 10 },
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for minReturn and maxReturn filter', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Return Tip' }]);
    mockRequest.query = { minReturn: '5', maxReturn: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        expectedReturn: { gte: 5, lte: 10 },
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for tags filter', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Tags Tip' }]);
    mockRequest.query = { tags: 'tech, growth' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tags: {
          some: {
            name: {
              in: ['tech', 'growth'],
              mode: 'insensitive',
            },
          },
        },
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

  it('should build correct whereClause for multiple filters combined', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([{ id: 1, title: 'Combined Tip' }]);
    mockRequest.query = {
      searchTerm: 'Future',
      category: 'ETF',
      riskLevel: 'Medio',
      minReturn: '7',
      tags: 'innovazione, globale',
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Future', mode: 'insensitive' } },
          { description: { contains: 'Future', mode: 'insensitive' } },
          { content: { contains: 'Future', mode: 'insensitive' } },
        ],
        category: { name: 'ETF' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 7 },
        tags: {
          some: {
            name: {
              in: ['innovazione', 'globale'],
              mode: 'insensitive',
            },
          },
        },
      },
    }));
  });

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

});

describe('getAllTips Controller', () => {
  it('should return 200 and paginated results when tips are found', async () => {
    const mockTips = [{ id: 1, title: 'Tip 1' }, { id: 2, title: 'Tip 2' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockTips);
    prisma.investmentTip.count.mockResolvedValue(mockTips.length);

    mockRequest.query = { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ where: {} });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockTips,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockTips.length,
    });
  });

  it('should apply category and riskLevel filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { category: 'Azioni', riskLevel: 'Basso' };
    await getAllTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Azioni' },
        riskLevel: 'Basso',
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith({ 
        where: {
            category: { name: 'Azioni' },
            riskLevel: 'Basso',
        }
    });
  });

  it('should return 404 if no tips are found on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { page: '1' }; // Default limit, sortBy, sortOrder
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio di investimento trovato.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(10); // Assume there are tips, but not on this page
    mockRequest.query = { page: '2', limit: '10' };
    await getAllTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 1, // Based on count 10 and limit 10
        totalTips: 10
    }));
  });

  it('should return 500 on database error', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Error'));
    await getAllTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero dei consigli.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});

describe('getTipById Controller', () => {
  it('should return 200 and the tip if found', async () => {
    const mockTip = { id: 1, title: 'Specific Tip' };
    prisma.investmentTip.findUnique.mockResolvedValue(mockTip);

    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockTip);
  });

  it('should return 404 if tip not found', async () => {
    prisma.investmentTip.findUnique.mockResolvedValue(null);
    mockRequest.params = { tipId: '999' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Consiglio di investimento non trovato.' });
  });

  it('should return 400 if tipId is not a valid number', async () => {
    // Simulate Prisma error for invalid ID type before DB call
    prisma.investmentTip.findUnique.mockImplementation(() => {
        const error = new Error('Argument `id` must be a number');
        // error.code = 'P2023'; // Example Prisma error code for invalid type
        throw error;
    });

    mockRequest.params = { tipId: 'abc' }; // Invalid ID
    await getTipById(mockRequest, mockResponse);

    // Check if findUnique was called with an attempt to parse 'abc'
    // This part of the test depends on how your actual controller handles parseInt failure
    // For this mock, we assume the controller passes it to Prisma which then throws.
    // If your controller validates `parseInt(tipId)` first, this test would change.
    expect(prisma.investmentTip.findUnique).toHaveBeenCalledWith({
        where: { id: NaN }, // parseInt('abc') results in NaN
        include: expect.any(Object)
    });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'ID del consiglio non valido.' });
  });

  it('should return 500 on other database errors', async () => {
    prisma.investmentTip.findUnique.mockRejectedValue(new Error('Some other DB Error'));
    mockRequest.params = { tipId: '1' };
    await getTipById(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante il recupero del consiglio.' });
  });
});

describe('searchTips Controller', () => {
  it('should return 200 and paginated search results when tips are found with searchTerm', async () => {
    const mockSearchResults = [{ id: 3, title: 'Search Result 1' }];
    prisma.investmentTip.findMany.mockResolvedValue(mockSearchResults);
    prisma.investmentTip.count.mockResolvedValue(mockSearchResults.length);

    mockRequest.query = { searchTerm: 'Result', page: '1', limit: '5' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
      skip: 0,
      take: 5,
      orderBy: { createdAt: 'desc' }, // Default sort
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { title: { contains: 'Result', mode: 'insensitive' } },
          { description: { contains: 'Result', mode: 'insensitive' } },
          { content: { contains: 'Result', mode: 'insensitive' } },
        ],
      },
    }));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mockSearchResults,
      totalPages: 1,
      currentPage: 1,
      totalTips: mockSearchResults.length,
    });
  });

  it('should apply category, riskLevel, return range, and tags filters', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = {
      category: 'Obbligazioni',
      riskLevel: 'Medio',
      minReturn: '5',
      maxReturn: '10',
      tags: 'long-term,diversified',
      page: '1',
      limit: '10'
    };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
      skip: 0,
      take: 10,
    }));
    expect(prisma.investmentTip.count).toHaveBeenCalledWith(expect.objectContaining({
       where: {
        category: { name: 'Obbligazioni' },
        riskLevel: 'Medio',
        expectedReturn: { gte: 5, lte: 10 },
        tags: {
          some: {
            name: {
              in: ['long-term', 'diversified'],
              mode: 'insensitive'
            }
          }
        }
      },
    }));
  });

  it('should handle only minReturn or only maxReturn', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { minReturn: '7', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);

    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { gte: 7 } },
    }));

    mockRequest.query = { maxReturn: '12', page: '1', limit: '10' };
    await searchTips(mockRequest, mockResponse);
    expect(prisma.investmentTip.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expectedReturn: { lte: 12 } },
    }));
  });

  it('should return 404 if no tips are found with criteria on page 1', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(0);
    mockRequest.query = { searchTerm: 'NonExistentTerm', page: '1' };
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nessun consiglio trovato con i criteri specificati.' });
  });

  it('should return 200 and empty data if no tips are found on subsequent pages', async () => {
    prisma.investmentTip.findMany.mockResolvedValue([]);
    prisma.investmentTip.count.mockResolvedValue(15); // Assume 15 total tips matching criteria
    mockRequest.query = { searchTerm: 'SomeTerm', page: '2', limit: '10' }; // Requesting page 2
    await searchTips(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [],
        currentPage: 2,
        totalPages: 2, // 15 items, 10 per page -> 2 pages
        totalTips: 15
    }));
  });

  it('should return 500 on database error during search', async () => {
    prisma.investmentTip.findMany.mockRejectedValue(new Error('DB Search Error'));
    mockRequest.query = { searchTerm: 'Any' };
    await searchTips(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  });
});