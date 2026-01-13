import fetch from 'node-fetch';

const API_URL = 'https://whatsapp-bot-693944688614.us-central1.run.app/api';
const WEBHOOK_URL = 'https://whatsapp-bot-693944688614.us-central1.run.app/webhook/whatsapp';
const API_KEY = 'eBx0D7aW0DIxNUKVs5JZGSS45Dq/TsNxeQ4vWF518MQ=';
const TEST_PHONE = 'whatsapp:+59899999997';

async function createOrder(orderId, withReceipt = false) {
  const order = {
    orderId: orderId,
    customerPhone: TEST_PHONE,
    customerName: 'Test Multiple Orders',
    status: 'confirmed',
    items: [
      { product: 'manzanas', quantity: 2, pricePerKg: 150, subtotal: 300 },
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Test Address',
    total: 800,
    deliveryFee: 500,
    createdAt: new Date().toISOString(),
    canEdit: true
  };

  if (withReceipt) {
    order.paymentReceipt = {
      url: 'https://storage.googleapis.com/freshmarket-receipts/test.pdf',
      uploadedAt: new Date(),
      verified: false
    };
  }

  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(order)
  });

  const result = await response.json();
  return result.order;
}

async function sendPdf() {
  const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const webhookData = new URLSearchParams({
    'Body': '',
    'From': TEST_PHONE,
    'ProfileName': 'Test Multiple Orders',
    'NumMedia': '1',
    'MediaContentType0': 'application/pdf',
    'MediaUrl0': testPdfUrl,
    'WaId': TEST_PHONE.replace('whatsapp:', '')
  });

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: webhookData.toString()
  });

  return await response.text();
}

async function runTest() {
  console.log('\n🧪 === TEST DE MÚLTIPLES PEDIDOS CON COMPROBANTES ===\n');

  try {
    // Paso 1: Crear pedido VIEJO con comprobante (simulando pedido anterior)
    console.log('📦 Paso 1: Creando pedido viejo CON comprobante...');
    const oldOrder = await createOrder(`ORD-OLD-${Date.now()}`, true);
    console.log(`   ✅ Pedido viejo creado: ${oldOrder.orderId} (CON comprobante)`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Paso 2: Crear pedido NUEVO sin comprobante (pedido actual)
    console.log('\n📦 Paso 2: Creando pedido nuevo SIN comprobante...');
    const newOrder = await createOrder(`ORD-NEW-${Date.now()}`, false);
    console.log(`   ✅ Pedido nuevo creado: ${newOrder.orderId} (SIN comprobante)`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Paso 3: Enviar PDF - debería adjuntarse al pedido NUEVO
    console.log('\n📤 Paso 3: Enviando PDF por WhatsApp...');
    const response = await sendPdf();
    console.log('   Respuesta del bot:');
    console.log('   ' + response.replace(/\n/g, '\n   '));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 4: Verificar que se adjuntó al pedido NUEVO
    console.log('\n🔍 Paso 4: Verificando adjunto...');

    const newOrderCheck = await fetch(`${API_URL}/orders/${newOrder.orderId}`, {
      headers: { 'x-api-key': API_KEY }
    });
    const newOrderData = await newOrderCheck.json();

    const oldOrderCheck = await fetch(`${API_URL}/orders/${oldOrder.orderId}`, {
      headers: { 'x-api-key': API_KEY }
    });
    const oldOrderData = await oldOrderCheck.json();

    console.log(`\n   Pedido VIEJO (${oldOrder.orderId}):`);
    console.log(`   - Tiene comprobante: ${!!oldOrderData.order?.paymentReceipt ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - URL: ${oldOrderData.order?.paymentReceipt?.url || 'N/A'}`);

    console.log(`\n   Pedido NUEVO (${newOrder.orderId}):`);
    console.log(`   - Tiene comprobante: ${!!newOrderData.order?.paymentReceipt ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - URL: ${newOrderData.order?.paymentReceipt?.url || 'N/A'}`);

    // Verificar resultado
    console.log('\n' + '='.repeat(60));
    if (newOrderData.order?.paymentReceipt && !response.includes('ya tiene un comprobante')) {
      console.log('✅ TEST EXITOSO: El comprobante se adjuntó al pedido NUEVO');
      console.log('   El sistema correctamente ignora pedidos con comprobante');
    } else if (response.includes('ya tiene un comprobante') || response.includes('ya enviaste un comprobante')) {
      console.log('❌ TEST FALLIDO: El sistema encontró el pedido viejo con comprobante');
      console.log('   Debería haber encontrado el pedido nuevo sin comprobante');
    } else {
      console.log('⚠️  RESULTADO INESPERADO');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error en test:', error.message);
    console.error(error);
  }
}

runTest();
