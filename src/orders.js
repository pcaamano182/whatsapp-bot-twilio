import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firestore
// En Cloud Run usa Application Default Credentials automáticamente
// En local usa GOOGLE_APPLICATION_CREDENTIALS si está configurado
const firestoreConfig = {
  projectId: process.env.DIALOGFLOW_PROJECT_ID
};

// Solo en desarrollo local, usar el archivo de credenciales
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.DIALOGFLOW_CREDENTIALS) {
  firestoreConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const db = new Firestore(firestoreConfig);
const ordersCollection = db.collection('orders');

/**
 * Estados posibles de un pedido
 */
export const OrderStatus = {
  PENDING: 'pending',           // Pedido creado, esperando confirmación
  CONFIRMED: 'confirmed',       // Cliente confirmó el pedido
  PREPARING: 'preparing',       // Preparando el pedido
  IN_TRANSIT: 'in_transit',     // En camino al cliente
  DELIVERED: 'delivered',       // Entregado
  CANCELLED: 'cancelled'        // Cancelado
};

/**
 * Estados de pago
 */
export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed'
};

/**
 * Genera un ID único para el pedido
 * Formato: ORD-YYYYMMDD-XXX
 */
function generateOrderId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Determina si un pedido puede ser editado según su estado
 */
function canEditOrder(status) {
  return ![OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(status);
}

/**
 * Crea un nuevo pedido
 * @param {Object} orderData - Datos del pedido
 * @returns {Promise<Object>} Pedido creado con su ID
 */
export async function createOrder(orderData) {
  try {
    const orderId = generateOrderId();
    const now = new Date();

    const order = {
      orderId,
      customerPhone: orderData.customerPhone,
      customerName: orderData.customerName || 'Cliente',
      status: OrderStatus.PENDING,
      items: orderData.items || [],
      deliveryMethod: orderData.deliveryMethod || 'delivery',
      deliveryAddress: orderData.deliveryAddress || '',
      total: orderData.total || 0,
      deliveryFee: orderData.deliveryFee || 0,
      paymentUrl: orderData.paymentUrl || null,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      canEdit: true
    };

    await ordersCollection.doc(orderId).set(order);

    console.log('✅ Pedido creado:', orderId);
    return order;

  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    throw new Error(`Error al crear pedido: ${error.message}`);
  }
}

/**
 * Obtiene un pedido por su ID
 * @param {string} orderId - ID del pedido
 * @returns {Promise<Object|null>} Pedido o null si no existe
 */
export async function getOrder(orderId) {
  try {
    const doc = await ordersCollection.doc(orderId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();

  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
    throw new Error(`Error al obtener pedido: ${error.message}`);
  }
}

/**
 * Obtiene todos los pedidos de un cliente
 * @param {string} customerPhone - Número de teléfono del cliente
 * @param {number} limit - Límite de pedidos a retornar (default: 10)
 * @returns {Promise<Array>} Lista de pedidos
 */
export async function getCustomerOrders(customerPhone, limit = 10) {
  try {
    const snapshot = await ordersCollection
      .where('customerPhone', '==', customerPhone)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push(doc.data());
    });

    return orders;

  } catch (error) {
    console.error('❌ Error obteniendo pedidos del cliente:', error);
    throw new Error(`Error al obtener pedidos: ${error.message}`);
  }
}

/**
 * Obtiene el último pedido activo de un cliente
 * Un pedido está activo si no está delivered o cancelled
 * @param {string} customerPhone - Número de teléfono del cliente
 * @returns {Promise<Object|null>} Último pedido activo o null
 */
export async function getActiveOrder(customerPhone) {
  try {
    // Usa el índice compuesto: customerPhone + status + createdAt
    const snapshot = await ordersCollection
      .where('customerPhone', '==', customerPhone)
      .where('status', 'in', [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.IN_TRANSIT])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    let activeOrder = null;
    snapshot.forEach(doc => {
      activeOrder = doc.data();
    });

    return activeOrder;

  } catch (error) {
    console.error('❌ Error obteniendo pedido activo:', error);
    throw new Error(`Error al obtener pedido activo: ${error.message}`);
  }
}

/**
 * Actualiza un pedido existente
 * @param {string} orderId - ID del pedido
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Pedido actualizado
 */
export async function updateOrder(orderId, updates) {
  try {
    const orderRef = ordersCollection.doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new Error(`Pedido ${orderId} no encontrado`);
    }

    const currentOrder = doc.data();

    // Verificar si el pedido puede ser editado
    if (updates.items && !canEditOrder(currentOrder.status)) {
      throw new Error(`No se puede editar el pedido ${orderId} porque está en estado: ${currentOrder.status}`);
    }

    // Actualizar canEdit basado en el nuevo estado
    const newStatus = updates.status || currentOrder.status;
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
      canEdit: canEditOrder(newStatus)
    };

    await orderRef.update(updatedData);

    const updatedDoc = await orderRef.get();
    console.log(`✅ Pedido ${orderId} actualizado`);

    return updatedDoc.data();

  } catch (error) {
    console.error('❌ Error actualizando pedido:', error);
    throw new Error(`Error al actualizar pedido: ${error.message}`);
  }
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

  return await updateOrder(orderId, { status: newStatus });
}

/**
 * Actualiza los items de un pedido (solo si está en estado editable)
 * @param {string} orderId - ID del pedido
 * @param {Array} newItems - Nuevos items
 * @param {number} newTotal - Nuevo total
 * @returns {Promise<Object>} Pedido actualizado
 */
export async function updateOrderItems(orderId, newItems, newTotal) {
  return await updateOrder(orderId, {
    items: newItems,
    total: newTotal
  });
}

/**
 * Cancela un pedido
 * @param {string} orderId - ID del pedido
 * @returns {Promise<Object>} Pedido cancelado
 */
export async function cancelOrder(orderId) {
  return await updateOrderStatus(orderId, OrderStatus.CANCELLED);
}

/**
 * Confirma un pedido (cliente acepta)
 * @param {string} orderId - ID del pedido
 * @returns {Promise<Object>} Pedido confirmado
 */
export async function confirmOrder(orderId) {
  return await updateOrderStatus(orderId, OrderStatus.CONFIRMED);
}

/**
 * Actualiza información de pago
 * @param {string} orderId - ID del pedido
 * @param {string} paymentUrl - URL de pago de Mercado Pago
 * @param {string} paymentStatus - Estado del pago
 * @returns {Promise<Object>} Pedido actualizado
 */
export async function updatePaymentInfo(orderId, paymentUrl, paymentStatus = PaymentStatus.PENDING) {
  return await updateOrder(orderId, {
    paymentUrl,
    paymentStatus
  });
}

/**
 * Formatea un pedido para mostrar al cliente
 * @param {Object} order - Objeto del pedido
 * @returns {string} Texto formateado del pedido
 */
export function formatOrderForCustomer(order) {
  const statusEmojis = {
    [OrderStatus.PENDING]: '⏳',
    [OrderStatus.CONFIRMED]: '✅',
    [OrderStatus.PREPARING]: '👨‍🍳',
    [OrderStatus.IN_TRANSIT]: '🚚',
    [OrderStatus.DELIVERED]: '📦',
    [OrderStatus.CANCELLED]: '❌'
  };

  const statusNames = {
    [OrderStatus.PENDING]: 'Pendiente',
    [OrderStatus.CONFIRMED]: 'Confirmado',
    [OrderStatus.PREPARING]: 'Preparando',
    [OrderStatus.IN_TRANSIT]: 'En camino',
    [OrderStatus.DELIVERED]: 'Entregado',
    [OrderStatus.CANCELLED]: 'Cancelado'
  };

  let text = `📋 *Pedido ${order.orderId}*\n\n`;
  text += `${statusEmojis[order.status]} Estado: ${statusNames[order.status]}\n\n`;

  text += `*Productos:*\n`;
  order.items.forEach(item => {
    text += `• ${item.quantity} kg de ${item.product} - $${item.subtotal}\n`;
  });

  if (order.deliveryFee > 0) {
    text += `\n📍 Envío: $${order.deliveryFee}\n`;
  }

  text += `\n💰 *Total: $${order.total}*\n\n`;

  if (order.deliveryMethod === 'delivery' && order.deliveryAddress) {
    text += `🏠 Dirección: ${order.deliveryAddress}\n\n`;
  }

  text += `📅 Creado: ${order.createdAt.toDate().toLocaleString('es-UY')}\n`;

  if (order.canEdit) {
    text += `\n✏️ _Podés editar este pedido mientras no esté en camino_`;
  }

  return text;
}

export default {
  createOrder,
  getOrder,
  getCustomerOrders,
  getActiveOrder,
  updateOrder,
  updateOrderStatus,
  updateOrderItems,
  cancelOrder,
  confirmOrder,
  updatePaymentInfo,
  formatOrderForCustomer,
  OrderStatus,
  PaymentStatus
};
