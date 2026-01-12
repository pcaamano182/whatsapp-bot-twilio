import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../api/client';
import Badge from '../components/Badge';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  ChevronDown,
  RefreshCw,
  Filter,
} from 'lucide-react';

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const response = await ordersAPI.getAll({ status: statusFilter || undefined });
      return response.data.orders;
    },
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => ordersAPI.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['stats']);
    },
  });

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    in_transit: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmar', disabled: ['delivered', 'cancelled'] },
    { value: 'preparing', label: 'Preparar', disabled: ['delivered', 'cancelled', 'pending'] },
    { value: 'in_transit', label: 'Enviar', disabled: ['delivered', 'cancelled', 'pending', 'confirmed'] },
    { value: 'delivered', label: 'Entregar', disabled: ['cancelled'] },
    { value: 'cancelled', label: 'Cancelar', disabled: ['delivered'] },
  ];

  const handleStatusChange = (orderId, currentStatus, newStatus) => {
    if (confirm(`¿Cambiar estado a "${statusLabels[newStatus]}"?`)) {
      updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper para detectar coordenadas y convertir a link de Google Maps
  const formatAddress = (address) => {
    if (!address) return null;

    // Detectar si es una ubicación con coordenadas
    // Formato: "Ubicación compartida: -34.9011, -56.1645" o "Ubicación: -34.9011, -56.1645"
    const coordsMatch = address.match(/Ubicación.*?:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);

    if (coordsMatch) {
      const lat = coordsMatch[1];
      const lng = coordsMatch[2];
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      return {
        isLocation: true,
        lat,
        lng,
        mapsUrl,
        display: `📍 ${lat}, ${lng}`,
      };
    }

    // Si no es coordenadas, es una dirección de texto
    return {
      isLocation: false,
      display: address,
    };
  };

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
      <div className="orders-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">
            {data?.length || 0} pedido{data?.length !== 1 ? 's' : ''} encontrado{data?.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="filter-container">
          <Filter size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="preparing">Preparando</option>
            <option value="in_transit">En Camino</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {data?.map((order) => (
          <div key={order.orderId} className="order-card">
            {/* Card Header */}
            <div className="order-card-header">
              <div className="order-id-container">
                <div className="order-icon">
                  <Package size={20} color="#16a34a" />
                </div>
                <div>
                  <p className="order-id-label">Pedido</p>
                  <p className="order-id-value">#{order.orderId}</p>
                </div>
              </div>
              <Badge status={order.status}>{statusLabels[order.status]}</Badge>
            </div>

            {/* Card Body */}
            <div className="order-card-body">
              {/* Customer Info */}
              <div className="customer-info">
                <div className="info-row">
                  <User size={16} />
                  <span className="info-row-value">{order.customerName || 'Cliente'}</span>
                </div>
                <div className="info-row">
                  <Phone size={16} />
                  <span className="info-row-secondary">{order.customerPhone}</span>
                </div>
                {order.deliveryAddress && (() => {
                  const addressInfo = formatAddress(order.deliveryAddress);
                  return addressInfo ? (
                    <div className="info-row">
                      <MapPin size={16} />
                      {addressInfo.isLocation ? (
                        <a
                          href={addressInfo.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="info-row-link"
                        >
                          {addressInfo.display}
                        </a>
                      ) : (
                        <span className="info-row-secondary">{addressInfo.display}</span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Order Details */}
              <div className="order-items">
                <p className="items-label">Items del Pedido:</p>
                <div className="items-list">
                  {order.items?.map((item, i) => (
                    <div key={i} className="item-row">
                      <span className="item-name">{item.product}</span>
                      <span className="item-quantity">{item.quantity}kg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="order-footer">
                <div className="order-date">
                  <Calendar size={16} />
                  <span className="order-date-text">{formatDate(order.createdAt)}</span>
                </div>
                <div className="order-total">
                  <DollarSign size={16} />
                  <span className="order-total-amount">${order.total}</span>
                </div>
              </div>

              {/* Status Actions */}
              {order.canEdit && (
                <div className="order-actions">
                  <p className="actions-label">Actualizar Estado:</p>
                  <div className="actions-grid">
                    {statusOptions
                      .filter((opt) => !opt.disabled.includes(order.status) && opt.value !== order.status)
                      .map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(order.orderId, order.status, opt.value)}
                          disabled={updateStatusMutation.isLoading}
                          className="action-btn"
                        >
                          {updateStatusMutation.isLoading ? (
                            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                          ) : (
                            opt.label
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!data || data.length === 0) && (
        <div className="empty-state">
          <Package size={64} style={{ margin: '0 auto 1rem' }} />
          <h3 className="empty-state-title">No hay pedidos</h3>
          <p className="empty-state-text">
            {statusFilter
              ? `No hay pedidos con el estado "${statusLabels[statusFilter]}"`
              : 'No hay pedidos para mostrar en este momento'}
          </p>
        </div>
      )}
    </div>
  );
}
