import db from '../config/firestore.js';

const conversationsCollection = db.collection('conversations');
const messagesCollection = db.collection('messages');

/**
 * Get all conversations with pagination
 */
export async function getAllConversations(options = {}) {
  const { limit = 50, startAfter, orderBy = 'lastMessageAt', orderDirection = 'desc' } = options;

  let query = conversationsCollection;

  query = query.orderBy(orderBy, orderDirection);

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const conversations = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    conversations.push({
      id: doc.id,
      ...data,
      lastMessageAt: data.lastMessageAt?.toDate?.() || data.lastMessageAt,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    });
  });

  return {
    conversations,
    count: conversations.length,
    hasMore: conversations.length === limit
  };
}

/**
 * Get conversation by phone number
 */
export async function getConversationByPhone(phoneNumber) {
  const snapshot = await conversationsCollection
    .where('phoneNumber', '==', phoneNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  let conversation = null;
  snapshot.forEach(doc => {
    const data = doc.data();
    conversation = {
      id: doc.id,
      ...data,
      lastMessageAt: data.lastMessageAt?.toDate?.() || data.lastMessageAt,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    };
  });

  return conversation;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId, options = {}) {
  const { limit = 100, startAfter } = options;

  let query = messagesCollection
    .where('conversationId', '==', conversationId)
    .orderBy('timestamp', 'desc');

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const messages = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate?.() || data.timestamp,
    });
  });

  // Return messages in chronological order (oldest first)
  return messages.reverse();
}

/**
 * Get conversation statistics
 */
export async function getConversationsStats() {
  const snapshot = await conversationsCollection.get();

  const total = snapshot.size;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let today = 0;
  let withOrders = 0;
  let active = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const lastMessageAt = data.lastMessageAt?.toDate?.() || new Date(data.lastMessageAt);

    // Count conversations from today
    if (lastMessageAt >= todayStart) {
      today++;
    }

    // Count conversations with orders
    if (data.hasOrders) {
      withOrders++;
    }

    // Count active conversations (last 24 hours)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (lastMessageAt >= twentyFourHoursAgo) {
      active++;
    }
  });

  return {
    total,
    today,
    withOrders,
    active
  };
}

/**
 * Create or update a conversation
 */
export async function createOrUpdateConversation(data) {
  const { phoneNumber, customerName, lastMessage, lastMessageDirection } = data;

  // Check if conversation exists
  const existing = await getConversationByPhone(phoneNumber);

  const conversationData = {
    phoneNumber,
    customerName: customerName || existing?.customerName || 'Cliente',
    lastMessage: lastMessage || '',
    lastMessageDirection: lastMessageDirection || 'incoming',
    lastMessageAt: new Date(),
    updatedAt: new Date(),
  };

  if (existing) {
    // Update existing conversation
    await conversationsCollection.doc(existing.id).update(conversationData);
    return { id: existing.id, ...conversationData };
  } else {
    // Create new conversation
    conversationData.createdAt = new Date();
    conversationData.messageCount = 0;
    conversationData.hasOrders = false;

    const docRef = await conversationsCollection.add(conversationData);
    return { id: docRef.id, ...conversationData };
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(conversationId, messageData) {
  const { text, direction, sender } = messageData;

  const message = {
    conversationId,
    text,
    direction, // 'incoming' or 'outgoing'
    sender: sender || (direction === 'incoming' ? 'customer' : 'bot'),
    timestamp: new Date(),
    read: false,
  };

  const docRef = await messagesCollection.add(message);

  // Update conversation message count and last message
  const conversationRef = conversationsCollection.doc(conversationId);
  const conversationSnapshot = await conversationRef.get();
  const currentCount = conversationSnapshot.data()?.messageCount || 0;

  await conversationRef.update({
    messageCount: currentCount + 1,
    lastMessage: text,
    lastMessageDirection: direction,
    lastMessageAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: docRef.id, ...message };
}

/**
 * Mark conversation as having orders
 */
export async function markConversationWithOrders(phoneNumber) {
  const conversation = await getConversationByPhone(phoneNumber);

  if (conversation) {
    await conversationsCollection.doc(conversation.id).update({
      hasOrders: true,
      updatedAt: new Date(),
    });
  }
}

/**
 * Search conversations by customer name or phone
 */
export async function searchConversations(searchTerm) {
  const normalizedSearch = searchTerm.toLowerCase();

  const snapshot = await conversationsCollection.get();
  const conversations = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const customerName = (data.customerName || '').toLowerCase();
    const phoneNumber = (data.phoneNumber || '').toLowerCase();

    if (customerName.includes(normalizedSearch) || phoneNumber.includes(normalizedSearch)) {
      conversations.push({
        id: doc.id,
        ...data,
        lastMessageAt: data.lastMessageAt?.toDate?.() || data.lastMessageAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });
    }
  });

  // Sort by last message date
  conversations.sort((a, b) => {
    const dateA = new Date(a.lastMessageAt || 0);
    const dateB = new Date(b.lastMessageAt || 0);
    return dateB - dateA;
  });

  return conversations;
}
