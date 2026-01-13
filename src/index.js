import express from 'express';
import dotenv from 'dotenv';
import twilio from 'twilio';
import { detectIntentCX, isDialogflowConfigured } from './dialogflow-cx.js';
import { createPaymentLink, isMercadoPagoConfigured } from './mercadopago.js';
import {
  createOrder,
  getOrder,
  getCustomerOrders,
  getActiveOrder,
  updateOrderItems,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
  updatePaymentInfo,
  formatOrderForCustomer,
  OrderStatus
} from './orders.js';
import { saveMessage, linkOrderToConversation, getConversationByPhone } from './conversations.js';
import { handleDialogflowWebhook } from './dialogflow-webhook.js';
import { downloadAudioFromTwilio, transcribeAudio, isSpeechToTextConfigured } from './speech.js';
import { processPaymentReceipt, isStorageConfigured } from './payment-receipts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Inicializar cliente de Twilio para enviar mensajes
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Middleware para parsear application/x-www-form-urlencoded (formato de Twilio)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Logging middleware con debug completo
app.use((req, res, next) => {
  console.log('\n' + '='.repeat(60));
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(60) + '\n');
  next();
});

// Middleware de autenticación para endpoints de API (solo para /api/*)
const apiKeyAuth = (req, res, next) => {
  // Solo aplicar a rutas /api/* (excepto webhooks)
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'eBx0D7aW0DIxNUKVs5JZGSS45Dq/TsNxeQ4vWF518MQ=';

  if (apiKey && apiKey === validApiKey) {
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid or missing API key'
    });
  }
};

app.use(apiKeyAuth);

/**
 * Webhook principal de WhatsApp
 * Recibe mensajes desde Twilio WhatsApp Sandbox
 */
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Extraer datos del payload de Twilio
    const {
      Body: messageBody,
      From: senderNumber,
      WaId: whatsappId,
      ProfileName: profileName,
      NumMedia,
      MediaContentType0,
      MediaUrl0,
      Latitude,
      Longitude
    } = req.body;

    // Detectar si es un mensaje de ubicación
    let isLocation = false;
    let locationText = null;

    if (Latitude && Longitude) {
      isLocation = true;
      locationText = `Ubicación compartida: ${Latitude}, ${Longitude}`;
      console.log('📍 Ubicación compartida detectada');
      console.log(`   Latitud: ${Latitude}`);
      console.log(`   Longitud: ${Longitude}`);
    }

    // Detectar si es un mensaje de audio
    let isAudio = false;
    let transcribedText = null;

    if (NumMedia && parseInt(NumMedia) > 0 && MediaContentType0 && MediaContentType0.startsWith('audio/')) {
      isAudio = true;
      console.log('🎤 Mensaje de audio detectado');
      console.log(`   Tipo: ${MediaContentType0}`);
      console.log(`   URL: ${MediaUrl0}`);

      // Intentar transcribir el audio
      if (isSpeechToTextConfigured()) {
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;

          // Descargar audio
          const audioBuffer = await downloadAudioFromTwilio(MediaUrl0, accountSid, authToken);

          // Transcribir
          transcribedText = await transcribeAudio(audioBuffer, MediaContentType0);

          console.log('✅ Audio transcrito exitosamente:', transcribedText);
        } catch (error) {
          console.error('❌ Error transcribiendo audio:', error);
          transcribedText = null;
        }
      } else {
        console.log('⚠️  Speech-to-Text no está configurado');
      }
    }

    // Detectar si es un comprobante de pago (PDF)
    let isPdf = false;
    let receiptProcessingResult = null;

    if (NumMedia && parseInt(NumMedia) > 0 && MediaContentType0 === 'application/pdf') {
      isPdf = true;
      console.log('📄 Comprobante PDF detectado');
      console.log(`   Tipo: ${MediaContentType0}`);
      console.log(`   URL: ${MediaUrl0}`);

      // Procesar comprobante de pago
      if (isStorageConfigured()) {
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;

          receiptProcessingResult = await processPaymentReceipt(
            MediaUrl0,
            MediaContentType0,
            senderNumber,
            accountSid,
            authToken
          );

          console.log('📋 Resultado del procesamiento:', receiptProcessingResult);
        } catch (error) {
          console.error('❌ Error procesando comprobante:', error);
          receiptProcessingResult = {
            success: false,
            message: 'Hubo un error al procesar el comprobante. Por favor, intentá de nuevo.'
          };
        }
      } else {
        console.log('⚠️  Cloud Storage no está configurado');
        receiptProcessingResult = {
          success: false,
          message: 'El sistema de comprobantes no está configurado. Contactá con atención al cliente.'
        };
      }
    }

    // Log del mensaje recibido
    console.log('📨 Mensaje recibido:');
    console.log(`   De: ${profileName} (${senderNumber})`);
    console.log(`   WhatsApp ID: ${whatsappId}`);
    console.log(`   Mensaje: ${locationText || transcribedText || messageBody || (isAudio ? '🎤 Audio' : '')}`);

    // Guardar mensaje entrante en Firestore
    const messageToSave = {
      customerPhone: senderNumber,
      customerName: profileName || 'Cliente',
      text: locationText || transcribedText || messageBody || (isPdf ? '📄 Comprobante PDF' : (isAudio ? '🎤 Audio' : '')),
      direction: 'incoming'
    };

    if (isLocation) {
      messageToSave.isLocation = true;
      messageToSave.latitude = Latitude;
      messageToSave.longitude = Longitude;
    }

    if (isAudio) {
      messageToSave.isAudio = true;
      messageToSave.audioUrl = MediaUrl0;
      messageToSave.audioType = MediaContentType0;
      if (transcribedText) {
        messageToSave.transcription = transcribedText;
      }
    }

    if (isPdf) {
      messageToSave.isPdf = true;
      messageToSave.pdfUrl = MediaUrl0;
      if (receiptProcessingResult) {
        messageToSave.receiptProcessed = receiptProcessingResult.success;
        messageToSave.orderId = receiptProcessingResult.orderId;
      }
    }

    await saveMessage(messageToSave);

    // Crear respuesta TwiML
    const twiml = new twilio.twiml.MessagingResponse();
    let responseMessage;

    // Si es un PDF (comprobante), responder con el resultado del procesamiento
    if (isPdf && receiptProcessingResult) {
      responseMessage = receiptProcessingResult.message;
    }
    // Si es audio sin transcripción exitosa
    else if (isAudio && !transcribedText) {
      responseMessage = 'No pude escuchar bien el audio. ¿Podés escribir tu mensaje o enviarlo de nuevo?';
    } else if (isDialogflowConfigured()) {
      try {
        // Usar número de WhatsApp como sessionId con timestamp para resetear sesiones
        // Esto evita que el historial de conversación exceda el límite de tokens
        // La sesión se resetea cada 30 minutos
        const sessionTimestamp = Math.floor(Date.now() / (30 * 60 * 1000)); // 30 minutos
        const sessionId = `${senderNumber}-${sessionTimestamp}`; // "whatsapp:+59895262076-12345"

        // Usar ubicación, texto transcrito o messageBody
        const textToProcess = locationText || transcribedText || messageBody;

        // Enviar mensaje a Dialogflow CX
        const dialogflowResponse = await detectIntentCX(textToProcess, sessionId);

        responseMessage = dialogflowResponse.text;

        console.log('🤖 Dialogflow CX:');
        console.log(`   Session ID: ${sessionId}`);
        console.log(`   Intent: ${dialogflowResponse.intent}`);
        console.log(`   Confidence: ${dialogflowResponse.confidence}`);
        console.log(`   Response: ${responseMessage}`);

      } catch (dfError) {
        console.error('❌ Error con Dialogflow CX:', dfError);

        // Si es un error de límite de tokens, intentar con una sesión nueva
        if (dfError.message && dfError.message.includes('Token limit exceeded')) {
          console.log('⚠️  Token limit exceeded, reintentando con sesión nueva...');
          try {
            // Crear una sesión completamente nueva con timestamp actual
            const newSessionId = `${senderNumber}-${Date.now()}`;
            const textToProcess = locationText || transcribedText || messageBody;
            const retryResponse = await detectIntentCX(textToProcess, newSessionId);
            responseMessage = retryResponse.text;
            console.log('✅ Reintento exitoso con nueva sesión');
          } catch (retryError) {
            console.error('❌ Reintento falló:', retryError);
            responseMessage = getFallbackResponse(messageBody, profileName);
          }
        } else {
          // Otro tipo de error, usar fallback
          responseMessage = getFallbackResponse(messageBody, profileName);
        }
      }
    } else {
      // Usar lógica simple si Dialogflow no está configurado
      console.log('⚠️  Dialogflow CX no configurado, usando lógica simple');
      responseMessage = getFallbackResponse(messageBody, profileName);
    }

    twiml.message(responseMessage);

    // Guardar mensaje saliente en Firestore
    await saveMessage({
      customerPhone: senderNumber,
      customerName: profileName || 'Cliente',
      text: responseMessage,
      direction: 'outgoing'
    });

    // Enviar respuesta en formato XML
    res.type('text/xml');
    res.send(twiml.toString());

    console.log('✅ Respuesta enviada:', responseMessage);

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);

    // Respuesta de error en TwiML
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Lo siento, hubo un error procesando tu mensaje.');

    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * Lógica de respuesta simple (fallback cuando Dialogflow no está disponible)
 */
function getFallbackResponse(messageBody, profileName) {
  if (messageBody?.toLowerCase().includes('hola')) {
    return `Hola ${profileName} 👋, ¿en qué puedo ayudarte?`;
  } else if (messageBody?.toLowerCase().includes('ayuda')) {
    return 'Soy un bot de WhatsApp. Estoy en fase de desarrollo 🤖';
  } else {
    return `Recibí tu mensaje: "${messageBody}"\n\nEste bot está en construcción 🚧`;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'whatsapp-bot-twilio'
  });
});

/**
 * Root endpoint (información del servicio)
 */
app.get('/', (req, res) => {
  res.json({
    service: 'WhatsApp Bot - Twilio',
    version: '1.0.0',
    phase: 'POC Local',
    endpoints: {
      webhook: '/webhook/whatsapp',
      health: '/health',
      createPayment: '/api/create-payment',
      paymentWebhook: '/webhook/mercadopago'
    }
  });
});

/**
 * Endpoint para crear link de pago de Mercado Pago
 * POST /api/create-payment
 */
app.post('/api/create-payment', async (req, res) => {
  try {
    const { orderId, items, total, deliveryFee, customer, deliveryAddress } = req.body;

    console.log('💳 Creando link de pago para pedido:', orderId);

    // Si Mercado Pago no está configurado, continuar sin link de pago
    if (!isMercadoPagoConfigured()) {
      console.log('⚠️  Mercado Pago no configurado - pedido procesado sin pago online');
      return res.json({
        success: true,
        paymentUrl: null,
        paymentUnavailable: true,
        message: 'Pedido confirmado. Pago pendiente (contactaremos para coordinar pago)',
        orderId
      });
    }

    // Intentar crear link de pago
    try {
      const paymentLink = await createPaymentLink({
        orderId,
        items,
        total,
        deliveryFee: deliveryFee || 0,
        customer,
        deliveryAddress
      });

      res.json({
        success: true,
        paymentUrl: paymentLink.paymentUrl,
        preferenceId: paymentLink.preferenceId,
        paymentUnavailable: false,
        orderId
      });

    } catch (paymentError) {
      // Si falla la creación del link, continuar sin pago online
      console.error('❌ Error creando link de pago:', paymentError);
      console.log('⚠️  Continuando pedido sin pago online');

      res.json({
        success: true,
        paymentUrl: null,
        paymentUnavailable: true,
        message: 'Pedido confirmado. El sistema de pago no está disponible temporalmente. Te contactaremos para coordinar el pago.',
        orderId,
        error: paymentError.message
      });
    }

  } catch (error) {
    console.error('❌ Error procesando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar pedido',
      message: error.message
    });
  }
});

/**
 * Webhook de Dialogflow CX para ejecutar acciones
 * POST /webhook/dialogflow
 */
app.post('/webhook/dialogflow', handleDialogflowWebhook);

/**
 * Webhook de Mercado Pago para notificaciones de pago
 * POST /webhook/mercadopago
 */
app.post('/webhook/mercadopago', async (req, res) => {
  try {
    console.log('💰 Notificación de Mercado Pago recibida');
    console.log('   Type:', req.query.type);
    console.log('   Data:', JSON.stringify(req.body, null, 2));

    const { type, data } = req.query;

    if (type === 'payment') {
      const paymentId = data?.id;
      console.log(`   Payment ID: ${paymentId}`);

      // TODO: Verificar el estado del pago con Mercado Pago API
      // TODO: Actualizar el estado de pago en Firestore
      // TODO: Enviar notificación al cliente por WhatsApp
    }

    // Mercado Pago requiere respuesta 200 OK
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error procesando webhook de Mercado Pago:', error);
    res.status(200).send('OK'); // Siempre responder 200 para evitar reintentos
  }
});

/**
 * Crear un nuevo pedido
 * POST /api/orders
 */
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    console.log('📝 Creando nuevo pedido para:', orderData.customerPhone);

    const order = await createOrder(orderData);

    // Asociar pedido a conversación
    if (order && order.orderId) {
      await linkOrderToConversation(orderData.customerPhone, order.orderId);
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener un pedido por ID
 * GET /api/orders/:orderId
 */
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🔍 Buscando pedido:', orderId);

    const order = await getOrder(orderId);

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
    console.error('❌ Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener pedidos de un cliente
 * GET /api/orders/customer/:phone
 */
app.get('/api/orders/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log('🔍 Buscando pedidos del cliente:', phone);

    const orders = await getCustomerOrders(phone, limit);

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('❌ Error obteniendo pedidos del cliente:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener pedido activo de un cliente
 * GET /api/orders/customer/:phone/active
 */
app.get('/api/orders/customer/:phone/active', async (req, res) => {
  try {
    const { phone } = req.params;
    console.log('🔍 Buscando pedido activo del cliente:', phone);

    const order = await getActiveOrder(phone);

    if (!order) {
      return res.json({
        success: true,
        hasActiveOrder: false,
        order: null
      });
    }

    res.json({
      success: true,
      hasActiveOrder: true,
      order,
      formatted: formatOrderForCustomer(order)
    });

  } catch (error) {
    console.error('❌ Error obteniendo pedido activo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Actualizar items de un pedido
 * PUT /api/orders/:orderId/items
 */
app.put('/api/orders/:orderId/items', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, total, mode } = req.body; // mode: 'merge' (default) o 'replace'

    console.log('✏️ Actualizando items del pedido:', orderId);
    console.log('   Items recibidos:', JSON.stringify(items));
    console.log('   Modo:', mode || 'merge (default)');

    // Obtener el pedido actual
    const currentOrder = await getOrder(orderId);
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    console.log('   Items actuales:', JSON.stringify(currentOrder.items));

    let finalItems;

    if (mode === 'replace') {
      // Modo REPLACE: Los items enviados reemplazan completamente los existentes
      finalItems = items;
      console.log('   🔄 Modo REPLACE: Reemplazando todos los items');
    } else {
      // Modo MERGE (default): Combinar items existentes con los nuevos
      const existingItems = currentOrder.items || [];
      const mergedItems = [...existingItems];

      // Para cada item nuevo, actualizar cantidad si existe o agregarlo
      items.forEach(newItem => {
        const existingIndex = mergedItems.findIndex(
          item => item.product.toLowerCase() === newItem.product.toLowerCase()
        );

        if (existingIndex >= 0) {
          // Producto ya existe, sumar la cantidad
          mergedItems[existingIndex].quantity += newItem.quantity;
          console.log(`   ✓ Sumando ${newItem.quantity} kg a ${newItem.product} existente (ahora ${mergedItems[existingIndex].quantity} kg)`);
        } else {
          // Producto nuevo, agregarlo
          mergedItems.push(newItem);
          console.log(`   ✓ Agregando nuevo producto: ${newItem.quantity} kg de ${newItem.product}`);
        }
      });

      finalItems = mergedItems;
    }

    console.log('   Items finales:', JSON.stringify(finalItems));

    const order = await updateOrderItems(orderId, finalItems, total);

    // Formatear mensaje con el pedido completo
    let itemsSummary = '';
    order.items.forEach(item => {
      const subtotal = item.quantity * item.pricePerKg;
      itemsSummary += `• ${item.quantity} kg de ${item.product} ($${item.pricePerKg}/kg) = $${subtotal}\n`;
    });

    const message = `Perfecto! Tu pedido:\n\n${itemsSummary}\nTotal: $${order.total}\n\n¿Querés agregar algo más?`;

    res.json({
      success: true,
      order,
      message
    });

  } catch (error) {
    console.error('❌ Error actualizando items:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Actualizar estado de un pedido
 * PUT /api/orders/:orderId/status
 */
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Actualizando estado del pedido ${orderId} a:`, status);

    const order = await updateOrderStatus(orderId, status);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Confirmar un pedido
 * POST /api/orders/:orderId/confirm
 */
app.post('/api/orders/:orderId/confirm', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryMethod, deliveryAddress } = req.body;

    console.log('✅ Confirmando pedido:', orderId);

    const order = await confirmOrder(orderId, {
      deliveryMethod,
      deliveryAddress
    });

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('❌ Error confirmando pedido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cancelar un pedido
 * POST /api/orders/:orderId/cancel
 */
app.post('/api/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('❌ Cancelando pedido:', orderId);

    const order = await cancelOrder(orderId);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('❌ Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Páginas de redirección después del pago
 */
app.get('/payment/success', (req, res) => {
  const { payment_id, external_reference } = req.query;
  res.send(`
    <html>
      <head><title>Pago Exitoso</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>✅ ¡Pago Exitoso!</h1>
        <p>Tu pedido #${external_reference} ha sido confirmado.</p>
        <p>ID de pago: ${payment_id}</p>
        <p>Te contactaremos pronto por WhatsApp.</p>
      </body>
    </html>
  `);
});

app.get('/payment/failure', (req, res) => {
  res.send(`
    <html>
      <head><title>Pago Fallido</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Pago Fallido</h1>
        <p>Hubo un problema con tu pago.</p>
        <p>Por favor, intenta nuevamente.</p>
      </body>
    </html>
  `);
});

app.get('/payment/pending', (req, res) => {
  res.send(`
    <html>
      <head><title>Pago Pendiente</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>⏳ Pago Pendiente</h1>
        <p>Tu pago está siendo procesado.</p>
        <p>Te notificaremos cuando se confirme.</p>
      </body>
    </html>
  `);
});

/**
 * Endpoint para enviar mensajes de WhatsApp desde el admin panel
 * POST /api/messages/send
 */
app.post('/api/messages/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: to y message son requeridos'
      });
    }

    console.log(`📤 Enviando mensaje a ${to}:`, message);

    // El número de Twilio ya viene con el prefijo whatsapp: en el secret
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    console.log(`📤 Usando número: ${fromNumber}`);

    // Enviar mensaje via Twilio
    const twilioMessage = await twilioClient.messages.create({
      from: fromNumber,
      to: to,
      body: message
    });

    // Obtener nombre del cliente desde Firestore
    const conversation = await getConversationByPhone(to);
    const customerName = conversation?.customerName || 'Cliente';

    // Guardar mensaje en Firestore
    await saveMessage({
      customerPhone: to,
      customerName: customerName,
      text: message,
      direction: 'outgoing'
    });

    console.log(`✅ Mensaje enviado: ${twilioMessage.sid}`);

    res.json({
      success: true,
      messageSid: twilioMessage.sid
    });

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 WhatsApp Bot Server iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 Webhook: http://localhost:${PORT}/webhook/whatsapp`);

  // Verificar estado de Dialogflow CX
  if (isDialogflowConfigured()) {
    console.log('✅ Dialogflow CX: Configurado');
  } else {
    console.log('⚠️  Dialogflow CX: No configurado (usando lógica simple)');
  }

  console.log('\n💡 Recuerda:');
  console.log('   1. Ejecutar ngrok: ngrok http 3000');
  console.log('   2. Configurar webhook en Twilio con la URL de ngrok');
  console.log('   3. Formato: https://<ngrok-id>.ngrok.io/webhook/whatsapp\n');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});
