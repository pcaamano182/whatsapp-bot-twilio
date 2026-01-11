import express from 'express';
import * as conversationsController from '../controllers/conversations.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/conversations/stats
router.get('/stats', conversationsController.getStats);

// GET /api/conversations/search?q=term
router.get('/search', conversationsController.searchConversations);

// GET /api/conversations
router.get('/', conversationsController.getAllConversations);

// GET /api/conversations/:id/messages
router.get('/:id/messages', conversationsController.getConversationById);

export default router;
