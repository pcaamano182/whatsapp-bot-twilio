import fetch from 'node-fetch';

const API_URL = 'https://whatsapp-bot-693944688614.us-central1.run.app/api';
const API_KEY = 'eBx0D7aW0DIxNUKVs5JZGSS45Dq/TsNxeQ4vWF518MQ=';
const TEST_PHONE = 'whatsapp:+59899999999';

// 1. Crear un pedido de prueba
async function createTestOrder() {
  console.log('📦 Creando pedido de prueba...');

  const order = {
    orderId: `ORD-TEST-RECEIPT-${Date.now()}`,
    customerPhone: TEST_PHONE,
    customerName: 'Test Receipt User',
    status: 'confirmed',
    items: [
      { product: 'manzanas', quantity: 2, pricePerKg: 150, subtotal: 300 },
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Calle de prueba 123',
    total: 800,
    deliveryFee: 500,
    createdAt: new Date().toISOString(),
    canEdit: true
  };

  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(order)
  });

  const result = await response.json();
  console.log('✅ Pedido creado:', result.order?.orderId);
  return result.order;
}

// 2. Crear un PDF simple de prueba (base64)
function createTestPdfBase64() {
  // PDF mínimo válido en base64
  return 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvVGltZXMtUm9tYW4+PgplbmRvYmoKNSAwIG9iago8PC9MZW5ndGggNDQ+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKENvbXByb2JhbnRlIGRlIFBydWViYSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NCAwMDAwMCBuIAowMDAwMDAwMTIxIDAwMDAwIG4gCjAwMDAwMDAyNDQgMDAwMDAgbiAKMDAwMDAwMDMyMyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQxNQolJUVPRgo=';
}

// 3. Simular el webhook de Twilio con un PDF
async function simulatePdfWebhook(orderPhone) {
  console.log('📤 Simulando envío de PDF via webhook...');

  // Crear URL de prueba de un PDF (usando una URL pública de ejemplo)
  const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const webhookData = new URLSearchParams({
    'Body': '',
    'From': orderPhone,
    'ProfileName': 'Test Receipt User',
    'NumMedia': '1',
    'MediaContentType0': 'application/pdf',
    'MediaUrl0': testPdfUrl,
    'WaId': orderPhone.replace('whatsapp:', '')
  });

  const response = await fetch(`${API_URL.replace('/api', '')}/webhook/whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: webhookData.toString()
  });

  const result = await response.text();
  console.log('📨 Respuesta del webhook:');
  console.log(result);
  return result;
}

// 4. Verificar que el pedido tenga el comprobante adjunto
async function verifyReceiptAttached(orderId) {
  console.log('🔍 Verificando comprobante en pedido...');

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: {
      'x-api-key': API_KEY
    }
  });

  const result = await response.json();

  if (result.order?.paymentReceipt) {
    console.log('✅ Comprobante adjuntado correctamente:');
    console.log('   URL:', result.order.paymentReceipt.url);
    console.log('   Verificado:', result.order.paymentReceipt.verified);
    console.log('   Subido:', result.order.paymentReceipt.uploadedAt);
    return true;
  } else {
    console.log('❌ Comprobante NO encontrado en el pedido');
    console.log('   Pedido completo:', JSON.stringify(result.order, null, 2));
    return false;
  }
}

// 5. Ejecutar flujo completo
async function runTest() {
  try {
    console.log('\n🧪 === TEST DE COMPROBANTES DE PAGO ===\n');

    // Paso 1: Crear pedido de prueba
    const order = await createTestOrder();
    console.log('');

    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 2: Simular envío de PDF
    await simulatePdfWebhook(TEST_PHONE);
    console.log('');

    // Esperar procesamiento
    console.log('⏳ Esperando procesamiento (5 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Paso 3: Verificar comprobante
    const success = await verifyReceiptAttached(order.orderId);

    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ TEST EXITOSO: Sistema de comprobantes funcionando');
    } else {
      console.log('❌ TEST FALLIDO: Revisar logs del sistema');
    }
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error(error);
  }
}

runTest();
