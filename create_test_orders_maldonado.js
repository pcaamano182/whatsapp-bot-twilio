import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

const db = new Firestore({
  projectId: process.env.DIALOGFLOW_PROJECT_ID
});

const ordersCollection = db.collection('orders');

// 5 ubicaciones en Maldonado, Uruguay
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    deliveryAddress: 'Ubicación: -34.9087, -54.9412', // Punta del Este (zona residencial)
    total: 1045,
    deliveryFee: 500,
    paymentUrl: null,
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
    canEdit: true
  }
];

async function createTestOrders() {
  console.log('📦 Creando pedidos de prueba en Maldonado...\n');

  for (const order of testOrders) {
    try {
      await ordersCollection.doc(order.orderId).set(order);
      console.log(`✅ Pedido creado: ${order.orderId}`);
      console.log(`   Cliente: ${order.customerName}`);
      console.log(`   Estado: ${order.status}`);
      console.log(`   Ubicación: ${order.deliveryAddress}`);
      console.log(`   Total: $${order.total}\n`);
    } catch (error) {
      console.error(`❌ Error creando pedido ${order.orderId}:`, error.message);
    }
  }

  console.log('✅ Todos los pedidos de prueba fueron creados!');
  console.log('\n📍 Ubicaciones:');
  console.log('   - Centro de Maldonado');
  console.log('   - Playa Mansa');
  console.log('   - Punta del Este');
  console.log('   - San Carlos');
  console.log('   - La Barra');
}

createTestOrders()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
