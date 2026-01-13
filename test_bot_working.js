import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://whatsapp-bot-693944688614.us-central1.run.app/webhook/whatsapp';
const TEST_PHONE = 'whatsapp:+59899999998';

async function testBotResponse() {
  console.log('\n🧪 === TEST DE BOT FUNCIONANDO ===\n');

  // Simular mensaje simple
  const testMessage = 'Hola';

  console.log(`📤 Enviando mensaje: "${testMessage}"`);

  const webhookData = new URLSearchParams({
    'Body': testMessage,
    'From': TEST_PHONE,
    'ProfileName': 'Test User',
    'NumMedia': '0',
    'WaId': TEST_PHONE.replace('whatsapp:', ''),
    'To': 'whatsapp:+14155238886',
    'MessageSid': 'TEST_' + Date.now(),
    'AccountSid': 'TEST_ACCOUNT'
  });

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: webhookData.toString()
    });

    const result = await response.text();
    console.log('\n📨 Respuesta del bot:');
    console.log(result);

    // Verificar que NO sea el mensaje de "en construcción"
    if (result.includes('en construcción')) {
      console.log('\n' + '='.repeat(50));
      console.log('❌ ERROR: Bot todavía responde "en construcción"');
      console.log('='.repeat(50) + '\n');
      return false;
    }

    // Verificar que tenga una respuesta de Dialogflow
    if (result.includes('<Message>') && result.includes('</Message>')) {
      console.log('\n' + '='.repeat(50));
      console.log('✅ ÉXITO: Bot está respondiendo correctamente');
      console.log('   La respuesta viene de Dialogflow CX');
      console.log('='.repeat(50) + '\n');
      return true;
    }

    console.log('\n' + '='.repeat(50));
    console.log('⚠️  WARNING: Respuesta inesperada del bot');
    console.log('='.repeat(50) + '\n');
    return false;

  } catch (error) {
    console.error('\n❌ Error en el test:', error.message);
    return false;
  }
}

// Ejecutar test
testBotResponse();
