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
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pedidos',
      value: stats?.total || 0,
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: '#2563eb',
    },
    {
      title: 'Pedidos Hoy',
      value: stats?.today || 0,
      icon: Clock,
      iconBg: 'bg-purple-100',
      iconColor: '#9333ea',
    },
    {
      title: 'Revenue Total',
      value: `$${stats?.revenue?.total || 0}`,
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: '#16a34a',
    },
    {
      title: 'Revenue Hoy',
      value: `$${stats?.revenue?.today || 0}`,
      icon: TrendingUp,
      iconBg: 'bg-orange-100',
      iconColor: '#ea580c',
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
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general de tus pedidos y ventas</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">{stat.title}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: stat.iconBg }}>
                <stat.icon size={32} color={stat.iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon">
            <ShoppingBag size={24} color="#16a34a" />
          </div>
          <h2 className="card-title">Pedidos por Estado</h2>
        </div>

        <div className="status-grid">
          {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="status-item">
              <div>
                <Badge status={status}>{statusLabels[status]}</Badge>
              </div>
              <span className="status-count">{count}</span>
            </div>
          ))}
        </div>

        {(!stats?.byStatus || Object.keys(stats.byStatus).length === 0) && (
          <div className="empty-state-text" style={{ textAlign: 'center', padding: '2rem 0' }}>
            No hay pedidos registrados aún
          </div>
        )}
      </div>
    </div>
  );
}
