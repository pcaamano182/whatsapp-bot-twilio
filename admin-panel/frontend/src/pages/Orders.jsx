import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('');
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

  const statuses = ['', 'pending', 'confirmed', 'preparing', 'in_transit', 'delivered', 'cancelled'];

  const handleStatusChange = (orderId, newStatus) => {
    if (confirm('¿Actualizar el estado del pedido?')) {
      updateStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  if (isLoading) {
    return <div className="p-8">Cargando pedidos...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="preparing">Preparando</option>
          <option value="in_transit">En Camino</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((order) => (
                <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono">{order.orderId}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {order.items?.map((item, i) => (
                      <div key={i}>{item.quantity}kg {item.product}</div>
                    ))}
                  </td>
                  <td className="py-3 px-4 font-semibold">${order.total}</td>
                  <td className="py-3 px-4">
                    <Badge status={order.status} />
                  </td>
                  <td className="py-3 px-4">
                    {order.canEdit && (
                      <select
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Cambiar estado</option>
                        <option value="confirmed">Confirmar</option>
                        <option value="preparing">Preparar</option>
                        <option value="in_transit">Enviar</option>
                        <option value="delivered">Entregar</option>
                        <option value="cancelled">Cancelar</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!data || data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay pedidos para mostrar
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
