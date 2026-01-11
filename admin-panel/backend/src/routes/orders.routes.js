import express from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', ordersController.getOrders);
router.get('/stats', ordersController.getStats);
router.get('/:orderId', ordersController.getOrderById);
router.patch('/:orderId/status', ordersController.updateStatus);

export default router;
