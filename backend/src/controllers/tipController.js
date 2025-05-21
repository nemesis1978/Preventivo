// Logica del controller dei consigli di investimento
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Funzione per la ricerca avanzata di consigli
const searchTips = async (req, res) => {
  try {
    const { searchTerm, category, riskLevel, minReturn, maxReturn, tags, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = {};

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } }, // Assumendo un campo content
      ];
    }

    if (category) {
      whereClause.category = { name: category }; // Assumendo una relazione con Category
    }

    if (riskLevel) {
      whereClause.riskLevel = riskLevel; // Assumendo un campo riskLevel
    }

    if (minReturn) {
      whereClause.expectedReturn = { gte: parseFloat(minReturn) }; // Assumendo un campo expectedReturn
    }

    if (maxReturn && whereClause.expectedReturn) {
      whereClause.expectedReturn.lte = parseFloat(maxReturn);
    } else if (maxReturn) {
      whereClause.expectedReturn = { lte: parseFloat(maxReturn) };
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      whereClause.tags = {
        some: {
          name: {
            in: tagList,
            mode: 'insensitive'
          }
        }
      }; // Assumendo una relazione many-to-many con Tag
    }

    const results = await prisma.investmentTip.findMany({
      skip: offset,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
      where: whereClause,
      include: {
        category: true, // Includi dettagli della categoria se necessario
        tags: true,     // Includi dettagli dei tag se necessario
        author: { select: { id: true, name: true, email: true } } // Includi solo alcuni campi dell'autore
      }
    });

    const totalTips = await prisma.investmentTip.count({
      where: whereClause,
    });

    if (results.length === 0 && parseInt(page) === 1) {
      return res.status(404).json({ message: 'Nessun consiglio trovato con i criteri specificati.' });
    }

    res.status(200).json({
      data: results,
      totalPages: Math.ceil(totalTips / parseInt(limit)),
      currentPage: parseInt(page),
      totalTips,
    });
  } catch (error) {
    console.error('Errore durante la ricerca avanzata dei consigli:', error);
    res.status(500).json({ message: 'Errore interno del server durante la ricerca dei consigli.' });
  }
};

// Funzione per ottenere tutti i consigli con paginazione, ordinamento e filtri base
const getAllTips = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', category, riskLevel } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (category) {
      whereClause.category = { name: category };
    }
    if (riskLevel) {
      whereClause.riskLevel = riskLevel;
    }

    const tips = await prisma.investmentTip.findMany({
      where: whereClause,
      skip: offset,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    const totalTips = await prisma.investmentTip.count({
      where: whereClause,
    });

    if (tips.length === 0 && parseInt(page) === 1) {
      return res.status(404).json({ message: 'Nessun consiglio di investimento trovato.' });
    }

    res.status(200).json({
      data: tips,
      totalPages: Math.ceil(totalTips / parseInt(limit)),
      currentPage: parseInt(page),
      totalTips,
    });
  } catch (error) {
    console.error('Errore durante il recupero dei consigli:', error);
    res.status(500).json({ message: 'Errore interno del server durante il recupero dei consigli.' });
  }
};

// Funzione per ottenere un singolo consiglio per ID
const getTipById = async (req, res) => {
  try {
    const { tipId } = req.params;
    const tip = await prisma.investmentTip.findUnique({
      where: {
        id: parseInt(tipId),
      },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true, email: true } },
        // Aggiungere altre relazioni se necessario, es. commenti
      },
    });

    if (!tip) {
      return res.status(404).json({ message: 'Consiglio di investimento non trovato.' });
    }

    res.status(200).json(tip);
  } catch (error) {
    console.error(`Errore durante il recupero del consiglio con ID ${req.params.tipId}:`, error);
    // Controlla se l'errore è dovuto a un ID non valido (es. non numerico)
    if (error.message.includes('Argument `id` must be a number')) {
        return res.status(400).json({ message: 'ID del consiglio non valido.' });
    }
    res.status(500).json({ message: 'Errore interno del server durante il recupero del consiglio.' });
  }
};

module.exports = {
  searchTips,
  getAllTips,
  getTipById,
};