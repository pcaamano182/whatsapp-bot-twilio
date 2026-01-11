import db from '../config/firestore.js';

const ordersCollection = db.collection('orders');

/**
 * Estados posibles de un pedido
 */
export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

/**
 * Obtiene todos los pedidos con paginación y filtros
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Object>} Lista de pedidos y metadata
 */
export async function getAllOrders(options = {}) {
  const {
    status,
    limit = 50,
    startAfter,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = options;

  let query = ordersCollection;

  // Filtrar por estado si se proporciona
  if (status) {
    query = query.where('status', '==', status);
  }

  // Ordenar
  query = query.orderBy(orderBy, orderDirection);

  // Paginación
  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  query = query.limit(limit);

  const snapshot = await query.get();

  const orders = [];
  snapshot.forEach(doc => {
    orders.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return {
    orders,
    count: orders.length,
    hasMore: orders.length === limit
  };
}

/**
 * Obtiene un pedido por ID
 * @param {string} orderId - ID del pedido
 * @returns {Promise<Object|null>} Pedido o null
 */
export async function getOrderById(orderId) {
  const doc = await ordersCollection.doc(orderId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Actualiza el estado de un pedido
 * @param {string} orderId - ID del pedido
 * @param {string} newStatus - Nuevo estado
 * @returns {Promise<Object>} Pedido actualizado
 */
export async function updateOrderStatus(orderId, newStatus) {
  if (!Object.values(OrderStatus).includes(newStatus)) {
    throw new Error(`Estado inválido: ${newStatus}`);
  }

  const orderRef = ordersCollection.doc(orderId);
  const doc = await orderRef.get();

  if (!doc.exists) {
    throw new Error(`Pedido ${orderId} no encontrado`);
  }

  const canEdit = ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(newStatus);

  await orderRef.update({
    status: newStatus,
    canEdit,
    updatedAt: new Date()
  });

  const updatedDoc = await orderRef.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data()
  };
}

/**
 * Obtiene estadísticas de pedidos
 * @returns {Promise<Object>} Estadísticas
 */
export async function getOrderStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Pedidos de hoy
  const todaySnapshot = await ordersCollection
    .where('createdAt', '>=', today)
    .get();

  // Pedidos por estado
  const statusCounts = {};
  let totalRevenue = 0;
  let todayRevenue = 0;

  const allSnapshot = await ordersCollection.get();

  allSnapshot.forEach(doc => {
    const order = doc.data();
    const status = order.status;

    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (order.status !== OrderStatus.CANCELLED) {
      totalRevenue += order.total || 0;

      if (order.createdAt && order.createdAt.toDate() >= today) {
        todayRevenue += order.total || 0;
      }
    }
  });

  return {
    total: allSnapshot.size,
    today: todaySnapshot.size,
    byStatus: statusCounts,
    revenue: {
      total: totalRevenue,
      today: todayRevenue
    }
  };
}

export default {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  OrderStatus
};
