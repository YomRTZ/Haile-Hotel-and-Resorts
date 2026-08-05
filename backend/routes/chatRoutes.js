const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/send', chatController.sendMessage);
router.get('/history/:sessionId', chatController.getHistory);
router.post('/clear', chatController.clearHistory);

// ─── Admin routes (no JWT required in dev — add middleware for production) ────
router.get('/hotel-data', chatController.getHotelData);
router.put('/hotel-data', chatController.updateHotelData);
router.get('/sessions', chatController.getAllSessions);
router.get('/sessions/:sessionId', chatController.getSessionDetail);
router.post('/clear-all-sessions', chatController.clearAllSessions);

module.exports = router;
