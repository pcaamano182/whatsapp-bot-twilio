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
  const [expandedOrder, setExpandedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const response = await ordersAPI.getAll({ status: statusFilter || undefined });
      return response.data.orders;
    },
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">
            {data?.length || 0} pedido{data?.length !== 1 ? 's' : ''} encontrado{data?.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-none focus:outline-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="preparing">Preparando</option>
            <option value="in_transit">En Camino</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.map((order) => (
          <div
            key={order.orderId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Pedido</p>
                    <p className="font-mono text-sm font-bold text-gray-900">#{order.orderId}</p>
                  </div>
                </div>
                <Badge status={order.status}>{statusLabels[order.status]}</Badge>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{order.customerName || 'Cliente'}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{order.customerPhone}</span>
                </div>
                {order.deliveryAddress && (
                  <div className="flex items-start space-x-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{order.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Items del Pedido:</p>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700">{item.product}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.quantity}kg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-green-700">${order.total}</span>
                </div>
              </div>

              {/* Status Actions */}
              {order.canEdit && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Actualizar Estado:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {statusOptions
                      .filter((opt) => !opt.disabled.includes(order.status) && opt.value !== order.status)
                      .map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(order.orderId, order.status, opt.value)}
                          disabled={updateStatusMutation.isLoading}
                          className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updateStatusMutation.isLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin mx-auto" />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pedidos</h3>
          <p className="text-gray-500">
            {statusFilter
              ? `No hay pedidos con el estado "${statusLabels[statusFilter]}"`
              : 'No hay pedidos para mostrar en este momento'}
          </p>
        </div>
      )}
    </div>
  );
}
