import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { createUser, hasAdminUser } from '../services/auth.service.js';

const router = express.Router();

// Public routes
router.post('/login', authController.login);

// Setup route - only works if no admin exists
router.post('/setup', async (req, res, next) => {
  try {
    const hasAdmin = await hasAdminUser();

    if (hasAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Ya existe un usuario administrador'
      });
    }

    const { email, password, name } = req.body;
    const user = await createUser({ email, password, name, role: 'admin' });

    res.status(201).json({
      success: true,
      user,
      message: 'Usuario administrador creado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/register', authenticateToken, requireAdmin, authController.register);

export default router;
