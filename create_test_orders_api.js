// Script para crear pedidos de prueba usando el API del backend

const testOrders = [
  {
    orderId: 'ORD-20260112-TEST1',
    customerPhone: 'whatsapp:+59899111111',
    customerName: 'María González',
    status: 'pending',
    items: [
      { product: 'tomates', quantity: 2, pricePerKg: 150, subtotal: 300 },
      { product: 'manzanas', quantity: 1, pricePerKg: 180, subtotal: 180 }
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Ubicación: -34.9011, -54.9576', // Centro de Maldonado
    total: 980,
    deliveryFee: 500,
    paymentUrl: null,
    paymentStatus: 'pending',
    canEdit: true
  },
  {
    orderId: 'ORD-20260112-TEST2',
    customerPhone: 'whatsapp:+59899222222',
    customerName: 'Juan Pérez',
    status: 'confirmed',
    items: [
      { product: 'bananas', quantity: 3, pricePerKg: 120, subtotal: 360 },
      { product: 'naranjas', quantity: 2, pricePerKg: 140, subtotal: 280 }
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Ubicación: -34.9156, -54.9489', // Playa Mansa
    total: 1140,
    deliveryFee: 500,
    paymentUrl: null,
    paymentStatus: 'pending',
    canEdit: true
  },
  {
    orderId: 'ORD-20260112-TEST3',
    customerPhone: 'whatsapp:+59899333333',
    customerName: 'Ana Martínez',
    status: 'preparing',
    items: [
      { product: 'lechuga', quantity: 1, pricePerKg: 100, subtotal: 100 },
      { product: 'zanahoria', quantity: 2, pricePerKg: 110, subtotal: 220 },
      { product: 'peras', quantity: 1.5, pricePerKg: 150, subtotal: 225 }
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Ubicación: -34.9087, -54.9412', // Punta del Este
    total: 1045,
    deliveryFee: 500,
    paymentUrl: null,
    paymentStatus: 'pending',
    canEdit: true
  },
  {
    orderId: 'ORD-20260112-TEST4',
    customerPhone: 'whatsapp:+59899444444',
    customerName: 'Carlos Rodríguez',
    status: 'pending',
    items: [
      { product: 'papas', quantity: 5, pricePerKg: 90, subtotal: 450 },
      { product: 'cebollas', quantity: 2, pricePerKg: 100, subtotal: 200 }
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Ubicación: -34.8823, -54.9634', // San Carlos
    total: 1150,
    deliveryFee: 500,
    paymentUrl: null,
    paymentStatus: 'pending',
    canEdit: true
  },
  {
    orderId: 'ORD-20260112-TEST5',
    customerPhone: 'whatsapp:+59899555555',
    customerName: 'Lucía Fernández',
    status: 'confirmed',
    items: [
      { product: 'fresas', quantity: 1, pricePerKg: 280, subtotal: 280 },
      { product: 'uvas', quantity: 2, pricePerKg: 220, subtotal: 440 },
      { product: 'kiwis', quantity: 1, pricePerKg: 300, subtotal: 300 }
    ],
    deliveryMethod: 'delivery',
    deliveryAddress: 'Ubicación: -34.9245, -54.9512', // La Barra
    total: 1520,
    deliveryFee: 500,
    paymentUrl: null,
    paymentStatus: 'pending',
    canEdit: true
  }
];

async function createTestOrders() {
  const API_URL = 'https://whatsapp-bot-693944688614.us-central1.run.app/api';

  console.log('📦 Creando pedidos de prueba en Maldonado...\n');

  for (const order of testOrders) {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'eBx0D7aW0DIxNUKVs5JZGSS45Dq/TsNxeQ4vWF518MQ='
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      console.log(`✅ Pedido creado: ${order.orderId}`);
      console.log(`   Cliente: ${order.customerName}`);
      console.log(`   Estado: ${order.status}`);
      console.log(`   Ubicación: ${order.deliveryAddress}`);
      console.log(`   Total: $${order.total}\n`);
    } catch (error) {
      console.error(`❌ Error creando pedido ${order.orderId}:`, error.message);
    }
  }

  console.log('✅ Proceso completado!');
  console.log('\n📍 Ubicaciones en Maldonado:');
  console.log('   - Centro de Maldonado');
  console.log('   - Playa Mansa');
  console.log('   - Punta del Este');
  console.log('   - San Carlos');
  console.log('   - La Barra');
}

createTestOrders();
