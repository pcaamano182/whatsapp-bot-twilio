import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversationsAPI } from '../api/client';
import {
  MessageCircle,
  User,
  Phone,
  Calendar,
  Search,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';

export default function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await conversationsAPI.getAll();
      return response.data.conversations;
    },
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const response = await conversationsAPI.getMessages(selectedConversation.id);
      return response.data.messages;
    },
    enabled: !!selectedConversation?.id,
  });

  // Scroll automático al último mensaje cuando se cargan los mensajes
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredConversations = searchTerm
    ? conversations?.filter(
        (conv) =>
          conv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Conversaciones</h1>
        <p className="page-subtitle">
          {conversations?.length || 0} conversación{conversations?.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Conversations Layout */}
      <div className="conversations-container">
        {/* Sidebar - List of Conversations */}
        <div className="conversations-sidebar">
          {/* Search */}
          <div className="conversation-search">
            <div className="search-icon-wrapper">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Conversation List */}
          <div className="conversation-list">
            {filteredConversations?.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversation?.id === conversation.id ? 'active' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="conversation-item-avatar">
                  <User size={20} color="white" />
                </div>
                <div className="conversation-item-content">
                  <div className="conversation-item-header">
                    <span className="conversation-item-name">
                      {conversation.customerName || 'Cliente'}
                    </span>
                    <span className="conversation-item-time">
                      {formatDate(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="conversation-item-footer">
                    <Phone size={12} />
                    <span className="conversation-item-phone">{conversation.phoneNumber}</span>
                    {conversation.hasOrders && (
                      <ShoppingBag size={12} style={{ marginLeft: 'auto' }} color="#16a34a" />
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="conversation-item-preview">
                      {conversation.lastMessage.length > 50
                        ? conversation.lastMessage.substring(0, 50) + '...'
                        : conversation.lastMessage}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="conversation-item-icon" />
              </div>
            ))}

            {(!filteredConversations || filteredConversations.length === 0) && (
              <div className="empty-state-text" style={{ textAlign: 'center', padding: '2rem' }}>
                {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones aún'}
              </div>
            )}
          </div>
        </div>

        {/* Main - Selected Conversation Messages */}
        <div className="conversation-messages-container">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="conversation-header">
                <div className="conversation-header-avatar">
                  <User size={24} color="white" />
                </div>
                <div className="conversation-header-info">
                  <h2 className="conversation-header-name">
                    {selectedConversation.customerName || 'Cliente'}
                  </h2>
                  <div className="conversation-header-meta">
                    <Phone size={14} />
                    <span>{selectedConversation.phoneNumber}</span>
                  </div>
                </div>
                {selectedConversation.hasOrders && (
                  <div className="conversation-header-badge">
                    <ShoppingBag size={16} />
                    <span>Con Pedidos</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="conversation-messages">
                {isLoadingMessages ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                  </div>
                ) : messages && messages.length > 0 ? (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message ${message.direction === 'outgoing' ? 'message-outgoing' : 'message-incoming'}`}
                      >
                        <div className="message-bubble">
                          <p className="message-text">{message.text}</p>
                          <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="empty-state-text" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay mensajes en esta conversación
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="conversation-empty-state">
              <MessageCircle size={64} style={{ marginBottom: '1rem' }} />
              <h3 className="empty-state-title">Selecciona una conversación</h3>
              <p className="empty-state-text">
                Elige una conversación de la lista para ver los mensajes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
