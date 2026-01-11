import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Mercado Pago con el Access Token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preference = new Preference(client);

/**
 * Crea un link de pago de Mercado Pago
 * @param {Object} orderData - Datos del pedido
 * @param {Array} orderData.items - Lista de items del pedido
 * @param {string} orderData.orderId - ID del pedido
 * @param {number} orderData.total - Total del pedido
 * @param {Object} orderData.customer - Información del cliente
 * @param {string} orderData.deliveryAddress - Dirección de entrega (opcional)
 * @returns {Promise<string>} - URL del link de pago
 */
export async function createPaymentLink(orderData) {
  try {
    const { items, orderId, total, customer, deliveryAddress } = orderData;

    // Construir los items para Mercado Pago
    const mpItems = items.map(item => ({
      id: item.product,
      title: `${item.quantity} kg de ${item.product}`,
      description: `${item.quantity} kilogramos de ${item.product}`,
      quantity: 1,
      unit_price: item.subtotal,
      currency_id: 'UYU' // Pesos Uruguayos
    }));

    // Agregar envío como item si corresponde
    if (orderData.deliveryFee && orderData.deliveryFee > 0) {
      mpItems.push({
        id: 'envio',
        title: 'Envío a domicilio',
        description: `Envío a: ${deliveryAddress || 'Dirección proporcionada'}`,
        quantity: 1,
        unit_price: orderData.deliveryFee,
        currency_id: 'UYU'
      });
    }

    // Crear la preferencia de pago
    const body = {
      items: mpItems,
      back_urls: {
        success: `${process.env.BASE_URL}/payment/success`,
        failure: `${process.env.BASE_URL}/payment/failure`,
        pending: `${process.env.BASE_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${process.env.BASE_URL}/webhook/mercadopago`,
      payer: {
        name: customer.name || 'Cliente',
        phone: {
          number: customer.phone || ''
        }
      },
      statement_descriptor: 'FreshMarket',
      metadata: {
        order_id: orderId,
        delivery_address: deliveryAddress || 'Retiro en local',
        total: total
      }
    };

    console.log('📦 Creando preferencia de pago:', {
      orderId,
      total,
      itemsCount: mpItems.length
    });

    const response = await preference.create({ body });

    console.log('✅ Preferencia creada:', {
      preferenceId: response.id,
      initPoint: response.init_point
    });

    return {
      paymentUrl: response.init_point,
      preferenceId: response.id
    };

  } catch (error) {
    console.error('❌ Error creando link de pago:', error);
    throw new Error(`Error al crear link de pago: ${error.message}`);
  }
}

/**
 * Verifica si Mercado Pago está configurado
 * @returns {boolean}
 */
export function isMercadoPagoConfigured() {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

/**
 * Obtiene información de un pago
 * @param {string} paymentId - ID del pago
 * @returns {Promise<Object>} - Información del pago
 */
export async function getPaymentInfo(paymentId) {
  try {
    // Nota: Para obtener info de pagos necesitamos el Payment API
    // Por ahora retornamos estructura básica
    return {
      id: paymentId,
      status: 'pending'
    };
  } catch (error) {
    console.error('❌ Error obteniendo información de pago:', error);
    throw error;
  }
}
