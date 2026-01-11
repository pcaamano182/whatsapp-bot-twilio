export default function Badge({ status, children }) {
  const statusClasses = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    preparing: 'badge-preparing',
    in_transit: 'badge-in_transit',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  };

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    in_transit: 'En Camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <span className={`badge ${statusClasses[status] || 'badge-pending'}`}>
      {children || statusLabels[status] || status}
    </span>
  );
}
