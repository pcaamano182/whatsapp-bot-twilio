import express from 'express';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

/**
 * Webhook principal de WhatsApp
 * Recibe mensajes desde Twilio WhatsApp Sandbox
 */
app.post('/webhook/whatsapp', (req, res) => {
  try {
    // Extraer datos del payload de Twilio
    const {
      Body: messageBody,
      From: senderNumber,
      WaId: whatsappId,
      ProfileName: profileName
    } = req.body;

    // Log del mensaje recibido
    console.log('📨 Mensaje recibido:');
    console.log(`   De: ${profileName} (${senderNumber})`);
    console.log(`   WhatsApp ID: ${whatsappId}`);
    console.log(`   Mensaje: ${messageBody}`);

    // Crear respuesta TwiML
    const twiml = new twilio.twiml.MessagingResponse();

    // Lógica de respuesta simple (Phase 1)
    let responseMessage;

    if (messageBody?.toLowerCase().includes('hola')) {
      responseMessage = `Hola ${profileName} 👋, ¿en qué puedo ayudarte?`;
    } else if (messageBody?.toLowerCase().includes('ayuda')) {
      responseMessage = 'Soy un bot de WhatsApp. Estoy en fase de desarrollo 🤖';
    } else {
      responseMessage = `Recibí tu mensaje: "${messageBody}"\n\nEste bot está en construcción 🚧`;
    }

    twiml.message(responseMessage);

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
      health: '/health'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 WhatsApp Bot Server iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 Webhook: http://localhost:${PORT}/webhook/whatsapp`);
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
