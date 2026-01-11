import * as conversationsService from '../services/conversations.service.js';

/**
 * Get all conversations
 */
export async function getAllConversations(req, res, next) {
  try {
    const { limit, startAfter, orderBy, orderDirection } = req.query;

    const result = await conversationsService.getAllConversations({
      limit: limit ? parseInt(limit) : undefined,
      startAfter,
      orderBy,
      orderDirection,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get conversation by ID with messages
 */
export async function getConversationById(req, res, next) {
  try {
    const { id } = req.params;
    const { limit, startAfter } = req.query;

    // Get messages for the conversation
    const messages = await conversationsService.getConversationMessages(id, {
      limit: limit ? parseInt(limit) : undefined,
      startAfter,
    });

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get conversations statistics
 */
export async function getStats(req, res, next) {
  try {
    const stats = await conversationsService.getConversationsStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Search conversations
 */
export async function searchConversations(req, res, next) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const conversations = await conversationsService.searchConversations(q);

    res.json({
      success: true,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    next(error);
  }
}
