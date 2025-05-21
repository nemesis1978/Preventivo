const express = require('express');
const router = express.Router();

const tipController = require('../controllers/tipController');

// Rotta per la ricerca avanzata di consigli
router.get('/search', tipController.searchTips);

// Altre rotte per i tips (es. GET /api/tips, GET /api/tips/:id)
// router.get('/', tipController.getAllTips);
// router.get('/:id', tipController.getTipById);

module.exports = router;