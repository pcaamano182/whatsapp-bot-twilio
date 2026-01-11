import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firestore
const firestoreConfig = {
  projectId: process.env.DIALOGFLOW_PROJECT_ID
};

const db = new Firestore(firestoreConfig);

const conversationsCollection = db.collection('conversations');
const messagesCollection = db.collection('messages');

/**
 * Guarda un mensaje en Firestore y actualiza/crea la conversación
 * @param {Object} messageData - Datos del mensaje
 * @param {string} messageData.customerPhone - Número de teléfono del cliente (formato: whatsapp:+59899123456)
 * @param {string} messageData.customerName - Nombre del cliente
 * @param {string} messageData.text - Texto del mensaje
 * @param {string} messageData.direction - Dirección del mensaje ('incoming' o 'outgoing')
 */
export async function saveMessage(messageData) {
  try {
    const { customerPhone, customerName, text, direction } = messageData;

    // Buscar o crear conversación
    let conversationId;
    let conversationRef;

    const existingConversations = await conversationsCollection
      .where('customerPhone', '==', customerPhone)
      .limit(1)
      .get();

    if (existingConversations.empty) {
      // Crear nueva conversación
      const newConversation = {
        customerPhone,
        customerName,
        lastMessage: text,
        lastMessageDirection: direction,
        lastMessageAt: new Date(),
        messageCount: 1,
        unreadCount: direction === 'incoming' ? 1 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      conversationRef = await conversationsCollection.add(newConversation);
      conversationId = conversationRef.id;

      console.log(`✅ Nueva conversación creada: ${conversationId}`);
    } else {
      // Actualizar conversación existente
      const doc = existingConversations.docs[0];
      conversationId = doc.id;
      conversationRef = conversationsCollection.doc(conversationId);

      const currentData = doc.data();
      const currentCount = currentData.messageCount || 0;
      const currentUnread = currentData.unreadCount || 0;

      await conversationRef.update({
        customerName, // Actualizar nombre por si cambió
        lastMessage: text,
        lastMessageDirection: direction,
        lastMessageAt: new Date(),
        messageCount: currentCount + 1,
        unreadCount: direction === 'incoming' ? currentUnread + 1 : currentUnread,
        updatedAt: new Date(),
      });

      console.log(`✅ Conversación actualizada: ${conversationId}`);
    }

    // Guardar mensaje
    const message = {
      conversationId,
      text,
      direction,
      sender: direction === 'incoming' ? 'customer' : 'bot',
      timestamp: new Date(),
      read: direction === 'outgoing', // Los mensajes salientes se marcan como leídos automáticamente
    };

    const messageRef = await messagesCollection.add(message);

    console.log(`✅ Mensaje guardado: ${messageRef.id}`);

    return {
      conversationId,
      messageId: messageRef.id,
    };
  } catch (error) {
    console.error('❌ Error guardando mensaje:', error);
    // No lanzar error para no interrumpir el flujo del webhook
    return null;
  }
}

/**
 * Asocia un pedido con una conversación
 * @param {string} customerPhone - Número de teléfono del cliente
 * @param {string} orderId - ID del pedido
 */
export async function linkOrderToConversation(customerPhone, orderId) {
  try {
    const conversations = await conversationsCollection
      .where('customerPhone', '==', customerPhone)
      .limit(1)
      .get();

    if (!conversations.empty) {
      const conversationRef = conversations.docs[0].ref;
      const currentData = conversations.docs[0].data();
      const currentOrders = currentData.orderIds || [];

      if (!currentOrders.includes(orderId)) {
        await conversationRef.update({
          orderIds: [...currentOrders, orderId],
          updatedAt: new Date(),
        });

        console.log(`✅ Pedido ${orderId} asociado a conversación`);
      }
    }
  } catch (error) {
    console.error('❌ Error asociando pedido a conversación:', error);
  }
}
