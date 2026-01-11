import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../api/client';
import { Package, DollarSign, Clock, TrendingUp, ShoppingBag } from 'lucide-react';
import Badge from '../components/Badge';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await ordersAPI.getStats();
      return response.data.stats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pedidos',
      value: stats?.total || 0,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pedidos Hoy',
      value: stats?.today || 0,
      icon: Clock,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Revenue Total',
      value: `$${stats?.revenue?.total || 0}`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Revenue Hoy',
      value: `$${stats?.revenue?.today || 0}`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    in_transit: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general de tus pedidos y ventas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Pedidos por Estado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Badge status={status}>{statusLabels[status]}</Badge>
              </div>
              <span className="text-2xl font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>

        {(!stats?.byStatus || Object.keys(stats.byStatus).length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No hay pedidos registrados aún
          </div>
        )}
      </div>
    </div>
  );
}
