import * as ordersService from '../services/orders.service.js';

/**
 * GET /api/orders
 * Obtiene lista de pedidos con filtros y paginación
 */
export async function getOrders(req, res, next) {
  try {
    const { status, limit, startAfter, orderBy, orderDirection } = req.query;

    const result = await ordersService.getAllOrders({
      status,
      limit: limit ? parseInt(limit) : undefined,
      startAfter,
      orderBy,
      orderDirection
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/stats
 * Obtiene estadísticas de pedidos
 */
export async function getStats(req, res, next) {
  try {
    const stats = await ordersService.getOrderStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:orderId
 * Obtiene un pedido específico por ID
 */
export async function getOrderById(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await ordersService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/orders/:orderId/status
 * Actualiza el estado de un pedido
 */
export async function updateStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'El estado es requerido'
      });
    }

    const order = await ordersService.updateOrderStatus(orderId, status);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    if (error.message.includes('inválido')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
}

export default {
  getOrders,
  getStats,
  getOrderById,
  updateStatus
};
