/**
 * Webhook handler para Dialogflow CX
 * Procesa las llamadas de webhook desde Dialogflow CX Playbooks
 */

import {
  createOrder,
  getOrder,
  getCustomerOrders,
  getActiveOrder,
  updateOrderItems,
  confirmOrder,
  cancelOrder,
  formatOrderForCustomer,
} from './orders.js';
import { createPaymentLink } from './mercadopago.js';
import { linkOrderToConversation } from './conversations.js';

/**
 * Maneja el webhook de Dialogflow CX
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function handleDialogflowWebhook(req, res) {
  try {
    const tag = req.body.fulfillmentInfo?.tag;
    const sessionInfo = req.body.sessionInfo || {};
    const parameters = sessionInfo.parameters || {};

    console.log('🔔 Webhook de Dialogflow CX:');
    console.log(`   Tag: ${tag}`);
    console.log(`   Parameters:`, JSON.stringify(parameters, null, 2));

    let response = {
      fulfillmentResponse: {
        messages: []
      }
    };

    switch (tag) {
      case 'create_order':
        response = await handleCreateOrder(req.body);
        break;

      case 'get_active_order':
        response = await handleGetActiveOrder(req.body);
        break;

      case 'get_order_history':
        response = await handleGetOrderHistory(req.body);
        break;

      case 'add_items':
        response = await handleAddItems(req.body);
        break;

      case 'confirm_order':
        response = await handleConfirmOrder(req.body);
        break;

      case 'cancel_order':
        response = await handleCancelOrder(req.body);
        break;

      case 'create_payment':
        response = await handleCreatePayment(req.body);
        break;

      default:
        console.log(`⚠️  Tag desconocido: ${tag}`);
        response.fulfillmentResponse.messages.push({
          text: {
            text: ['No pude procesar esa acción.']
          }
        });
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.json({
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['Hubo un error procesando tu solicitud. Por favor intentá de nuevo.']
          }
        }]
      }
    });
  }
}

/**
 * Crea un nuevo pedido
 */
async function handleCreateOrder(webhookRequest) {
  const sessionInfo = webhookRequest.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const customerPhone = getCustomerPhone(webhookRequest);
  const customerName = getCustomerName(webhookRequest);

  try {
    const orderData = {
      customerPhone,
      customerName,
      items: [], // Se agregarán luego
      deliveryMethod: 'pickup' // Por defecto
    };

    const order = await createOrder(orderData);

    // Asociar a conversación
    await linkOrderToConversation(customerPhone, order.orderId);

    return {
      sessionInfo: {
        parameters: {
          ...parameters,
          current_order_id: order.orderId
        }
      },
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Perfecto! Empecemos tu pedido ${order.orderId}. ¿Qué te gustaría llevar?`]
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error creando pedido:', error);
    throw error;
  }
}

/**
 * Obtiene el pedido activo del cliente
 */
async function handleGetActiveOrder(webhookRequest) {
  const customerPhone = getCustomerPhone(webhookRequest);
  const sessionInfo = webhookRequest.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};

  try {
    const order = await getActiveOrder(customerPhone);

    if (order) {
      const formatted = formatOrderForCustomer(order);
      return {
        sessionInfo: {
          parameters: {
            ...parameters,
            current_order_id: order.orderId,
            has_active_order: true
          }
        },
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [formatted]
            }
          }]
        }
      };
    } else {
      return {
        sessionInfo: {
          parameters: {
            ...parameters,
            has_active_order: false
          }
        },
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['No tenés ningún pedido activo. ¿Querés hacer uno nuevo?']
            }
          }]
        }
      };
    }
  } catch (error) {
    console.error('Error obteniendo pedido activo:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de pedidos
 */
async function handleGetOrderHistory(webhookRequest) {
  const customerPhone = getCustomerPhone(webhookRequest);

  try {
    const orders = await getCustomerOrders(customerPhone);

    if (orders.length === 0) {
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['No tenés pedidos anteriores.']
            }
          }]
        }
      };
    }

    const summary = orders.slice(0, 5).map(order =>
      `• ${order.orderId}: ${order.items.length} productos - $${order.total} (${order.status})`
    ).join('\n');

    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Tus últimos pedidos:\n\n${summary}`]
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
}

/**
 * Agrega items al pedido activo
 */
async function handleAddItems(webhookRequest) {
  const sessionInfo = webhookRequest.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const orderId = parameters.current_order_id;

  if (!orderId) {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['Primero necesitás crear un pedido. ¿Querés empezar uno?']
          }
        }]
      }
    };
  }

  // Extraer items del parámetro
  const items = extractItems(parameters);

  if (items.length === 0) {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['No entendí qué productos querés agregar. ¿Podés ser más específico?']
          }
        }]
      }
    };
  }

  try {
    const updatedOrder = await updateOrderItems(orderId, items);
    const formatted = formatOrderForCustomer(updatedOrder);

    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Perfecto! Agregué los productos.\n\n${formatted}\n\n¿Algo más?`]
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error agregando items:', error);
    throw error;
  }
}

/**
 * Confirma el pedido
 */
async function handleConfirmOrder(webhookRequest) {
  const sessionInfo = webhookRequest.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const orderId = parameters.current_order_id;

  if (!orderId) {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['No tenés un pedido activo para confirmar.']
          }
        }]
      }
    };
  }

  try {
    // Extraer método de entrega y dirección
    const deliveryMethod = parameters.delivery_method || 'pickup';
    const deliveryAddress = parameters.delivery_address || null;

    const order = await getOrder(orderId);

    // Si el pedido requiere delivery, validar dirección
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Para delivery necesito tu dirección. ¿Cuál es tu dirección de entrega?']
            }
          }]
        }
      };
    }

    const confirmedOrder = await confirmOrder(orderId, {
      deliveryMethod,
      deliveryAddress
    });

    return {
      sessionInfo: {
        parameters: {
          ...parameters,
          current_order_id: null // Limpiar pedido actual
        }
      },
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`✅ Pedido confirmado!\n\nPedido: ${confirmedOrder.orderId}\nTotal: $${confirmedOrder.total}\n\nGracias por tu compra! 🎉`]
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error confirmando pedido:', error);
    throw error;
  }
}

/**
 * Cancela el pedido
 */
async function handleCancelOrder(webhookRequest) {
  const sessionInfo = webhookRequest.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const orderId = parameters.current_order_id;

  if (!orderId) {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['No tenés un pedido activo para cancelar.']
          }
        }]
      }
    };
  }

  try {
    await cancelOrder(orderId);

    return {
      sessionInfo: {
        parameters: {
          ...parameters,
          current_order_id: null
        }
      },
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['Pedido cancelado. ¿Hay algo más en lo que pueda ayudarte?']
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error cancelando pedido:', error);
    throw error;
  }
}

/**
 * Crea link de pago de Mercado Pago
 */
async function handleCreatePayment(webhookRequest) {
  const sessionInfo = webhookRequest.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const orderId = parameters.current_order_id;

  if (!orderId) {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['No tenés un pedido para pagar.']
          }
        }]
      }
    };
  }

  try {
    const order = await getOrder(orderId);
    const paymentLink = await createPaymentLink(order);

    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Podés pagar tu pedido acá: ${paymentLink}`]
          }
        }]
      }
    };
  } catch (error) {
    console.error('Error creando pago:', error);
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['Por ahora solo aceptamos efectivo. Pagá cuando recibas tu pedido.']
          }
        }]
      }
    };
  }
}

// Helpers

function getCustomerPhone(webhookRequest) {
  // Extraer del sessionId que viene en formato "whatsapp:+59899123456"
  const sessionPath = webhookRequest.sessionInfo?.session || '';
  const match = sessionPath.match(/whatsapp:[+\d]+/);
  return match ? match[0] : 'unknown';
}

function getCustomerName(webhookRequest) {
  const parameters = webhookRequest.sessionInfo?.parameters || {};
  return parameters.customer_name || 'Cliente';
}

function extractItems(parameters) {
  // Intentar extraer items de varios formatos posibles
  const items = [];

  // Formato: { products: ['manzana', 'banana'], quantities: [2, 3] }
  if (parameters.products && parameters.quantities) {
    const products = Array.isArray(parameters.products) ? parameters.products : [parameters.products];
    const quantities = Array.isArray(parameters.quantities) ? parameters.quantities : [parameters.quantities];

    products.forEach((product, i) => {
      items.push({
        product: product.toLowerCase(),
        quantity: quantities[i] || 1,
        pricePerKg: getPriceForProduct(product)
      });
    });
  }

  return items;
}

function getPriceForProduct(product) {
  // Precios de ejemplo - idealmente esto vendría de una BD o API
  const prices = {
    'manzana': 180,
    'manzanas': 180,
    'banana': 120,
    'bananas': 120,
    'tomate': 130,
    'tomates': 130,
    'lechuga': 90,
    'papa': 70,
    'papas': 70,
    'zanahoria': 80,
    'zanahorias': 80,
  };

  return prices[product.toLowerCase()] || 100;
}
