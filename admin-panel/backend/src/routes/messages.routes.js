import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'https://whatsapp-bot-693944688614.us-central1.run.app';
const API_KEY = process.env.API_KEY || 'eBx0D7aW0DIxNUKVs5JZGSS45Dq/TsNxeQ4vWF518MQ=';

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/messages/send
 * Proxy para enviar mensajes al servicio whatsapp-bot
 */
router.post('/send', async (req, res, next) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: to y message son requeridos'
      });
    }

    console.log(`📤 Proxy: Enviando mensaje a ${to}`);

    // Llamar al servicio whatsapp-bot
    const response = await fetch(`${WHATSAPP_BOT_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ to, message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar mensaje');
    }

    res.json(data);

  } catch (error) {
    console.error('❌ Error en proxy de mensajes:', error);
    next(error);
  }
});

export default router;
