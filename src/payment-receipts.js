import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// En Cloud Run, el proyecto se detecta automáticamente
const storage = new Storage();

const db = new Firestore();

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'freshmarket-receipts';
const ordersCollection = db.collection('orders');

/**
 * Descarga un archivo PDF desde Twilio
 * @param {string} mediaUrl - URL del archivo en Twilio
 * @param {string} accountSid - Twilio Account SID
 * @param {string} authToken - Twilio Auth Token
 * @returns {Promise<Buffer>} Buffer del archivo PDF
 */
export async function downloadPdfFromTwilio(mediaUrl, accountSid, authToken) {
  console.log('📥 Descargando PDF desde Twilio...');
  console.log(`   URL: ${mediaUrl}`);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(mediaUrl, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });

  if (!response.ok) {
    throw new Error(`Error descargando PDF: ${response.statusText}`);
  }

  const buffer = await response.buffer();
  console.log(`✅ PDF descargado: ${buffer.length} bytes`);

  return buffer;
}

/**
 * Sube un PDF a Google Cloud Storage
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} customerPhone - Teléfono del cliente
 * @param {string} orderId - ID del pedido
 * @returns {Promise<string>} URL pública del archivo
 */
export async function uploadReceiptToStorage(pdfBuffer, customerPhone, orderId) {
  console.log('☁️  Subiendo comprobante a Cloud Storage...');

  // Crear nombre de archivo único
  const timestamp = Date.now();
  const sanitizedPhone = customerPhone.replace(/[^0-9]/g, '');
  const fileName = `receipts/${sanitizedPhone}/${orderId}_${timestamp}.pdf`;

  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(fileName);

  // Subir archivo
  await file.save(pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        customerPhone,
        orderId,
        uploadedAt: new Date().toISOString()
      }
    }
  });

  // Con uniform bucket-level access, los archivos son públicos automáticamente
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
  console.log(`✅ Comprobante subido: ${publicUrl}`);

  return publicUrl;
}

/**
 * Guarda la referencia del comprobante en el pedido
 * @param {string} orderId - ID del pedido
 * @param {string} receiptUrl - URL del comprobante
 * @param {string} mediaUrl - URL original en Twilio
 * @returns {Promise<void>}
 */
export async function attachReceiptToOrder(orderId, receiptUrl, mediaUrl) {
  console.log(`📎 Adjuntando comprobante al pedido ${orderId}...`);

  const orderRef = ordersCollection.doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error(`Pedido ${orderId} no encontrado`);
  }

  // Actualizar pedido con información del comprobante
  await orderRef.update({
    paymentReceipt: {
      url: receiptUrl,
      twilioUrl: mediaUrl,
      uploadedAt: new Date(),
      verified: false // Para que admin pueda verificar manualmente
    },
    paymentStatus: 'pending_verification', // Cambiamos el estado
    updatedAt: new Date()
  });

  console.log(`✅ Comprobante adjuntado al pedido ${orderId}`);
}

/**
 * Obtiene el pedido activo de un cliente
 * @param {string} customerPhone - Teléfono del cliente
 * @returns {Promise<Object|null>} Pedido activo o null
 */
export async function getActiveOrderForCustomer(customerPhone) {
  console.log(`🔍 Buscando pedido activo para ${customerPhone}...`);

  // Buscar pedidos confirmados o pendientes del cliente SIN comprobante
  const snapshot = await ordersCollection
    .where('customerPhone', '==', customerPhone)
    .where('status', 'in', ['pending', 'confirmed'])
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) {
    console.log('❌ No se encontró pedido activo');
    return null;
  }

  // Filtrar pedidos que NO tienen comprobante adjunto
  const ordersWithoutReceipt = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.paymentReceipt) {
      ordersWithoutReceipt.push({
        id: doc.id,
        ...data
      });
    }
  });

  if (ordersWithoutReceipt.length === 0) {
    console.log('❌ Todos los pedidos activos ya tienen comprobante adjunto');
    return null;
  }

  // Retornar el más reciente sin comprobante
  const order = ordersWithoutReceipt[0];
  console.log(`✅ Pedido activo encontrado: ${order.orderId}`);
  return order;
}

/**
 * Procesa un comprobante de pago recibido por WhatsApp
 * @param {string} mediaUrl - URL del PDF en Twilio
 * @param {string} mediaContentType - Tipo de contenido
 * @param {string} customerPhone - Teléfono del cliente
 * @param {string} accountSid - Twilio Account SID
 * @param {string} authToken - Twilio Auth Token
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function processPaymentReceipt(mediaUrl, mediaContentType, customerPhone, accountSid, authToken) {
  try {
    console.log('💳 Procesando comprobante de pago...');
    console.log(`   Cliente: ${customerPhone}`);
    console.log(`   Tipo: ${mediaContentType}`);

    // Verificar que sea un PDF
    if (mediaContentType !== 'application/pdf') {
      return {
        success: false,
        message: 'El comprobante debe ser un archivo PDF'
      };
    }

    // Buscar pedido activo del cliente sin comprobante
    const activeOrder = await getActiveOrderForCustomer(customerPhone);

    if (!activeOrder) {
      return {
        success: false,
        message: 'No encontré un pedido activo sin comprobante. Si ya enviaste un comprobante para tu pedido actual, está siendo procesado. Para un nuevo pedido, primero confirmalo y luego enviá el comprobante.'
      };
    }

    // Descargar PDF
    const pdfBuffer = await downloadPdfFromTwilio(mediaUrl, accountSid, authToken);

    // Subir a Cloud Storage
    const receiptUrl = await uploadReceiptToStorage(pdfBuffer, customerPhone, activeOrder.orderId);

    // Adjuntar al pedido
    await attachReceiptToOrder(activeOrder.orderId, receiptUrl, mediaUrl);

    return {
      success: true,
      message: `✅ Comprobante recibido y adjuntado al pedido #${activeOrder.orderId}. Estamos verificando el pago y te avisaremos cuando esté confirmado.`,
      orderId: activeOrder.orderId,
      receiptUrl
    };

  } catch (error) {
    console.error('❌ Error procesando comprobante:', error);
    return {
      success: false,
      message: 'Hubo un error al procesar el comprobante. Por favor, intentá de nuevo o contactá con atención al cliente.',
      error: error.message
    };
  }
}

/**
 * Verifica si Cloud Storage está configurado
 * @returns {boolean}
 */
export function isStorageConfigured() {
  return !!process.env.GCS_BUCKET_NAME;
}
