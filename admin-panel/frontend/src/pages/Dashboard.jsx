import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../api/client';
import Card from '../components/Card';
import { Package, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await ordersAPI.getStats();
      return response.data.stats;
    },
  });

  if (isLoading) {
    return <div className="p-8">Cargando estadísticas...</div>;
  }

  const statCards = [
    {
      title: 'Total Pedidos',
      value: stats?.total || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pedidos Hoy',
      value: stats?.today || 0,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Revenue Total',
      value: `$${stats?.revenue?.total || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Revenue Hoy',
      value: `$${stats?.revenue?.today || 0}`,
      icon: CheckCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Pedidos por Estado</h2>
        <div className="space-y-3">
          {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
              <span className="font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
