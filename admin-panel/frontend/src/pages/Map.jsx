import { useState, useEffect, useRef } from 'react';
import { MapPin, Package, Phone, User, DollarSign } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function Map() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Cargar Leaflet CSS y JS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        fetchPendingOrders();
      };
      document.body.appendChild(script);
    } else {
      fetchPendingOrders();
    }

    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orders.length > 0 && mapRef.current && window.L && !leafletMapRef.current) {
      initMap();
    } else if (orders.length > 0 && leafletMapRef.current) {
      updateMarkers();
    }
  }, [orders]);

  const fetchPendingOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener pedidos');
      }

      const data = await response.json();
      const ordersList = data.orders || data.data || data;

      const pendingWithLocation = ordersList.filter(order => {
        const isPending = ['pending', 'confirmed', 'preparing'].includes(order.status);
        const hasLocation = order.deliveryAddress && extractCoordinates(order.deliveryAddress);
        return isPending && hasLocation;
      });

      setOrders(pendingWithLocation);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractCoordinates = (address) => {
    if (!address) return null;

    let coordsMatch = address.match(/Ubicación.*?:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);

    if (!coordsMatch) {
      coordsMatch = address.match(/^(-?\d+\.?\d+),\s*(-?\d+\.?\d+)$/);
    }

    if (coordsMatch) {
      return {
        lat: parseFloat(coordsMatch[1]),
        lng: parseFloat(coordsMatch[2])
      };
    }

    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'preparing': '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'preparing': 'Preparando'
    };
    return texts[status] || status;
  };

  const getMapCenter = () => {
    if (orders.length === 0) {
      return { lat: -34.9011, lng: -56.1645 };
    }

    const coords = orders.map(order => extractCoordinates(order.deliveryAddress)).filter(Boolean);
    if (coords.length === 0) {
      return { lat: -34.9011, lng: -56.1645 };
    }

    const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
    const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

    return { lat: avgLat, lng: avgLng };
  };

  const initMap = () => {
    if (!window.L) return;

    const center = getMapCenter();

    leafletMapRef.current = window.L.map(mapRef.current).setView([center.lat, center.lng], 13);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMapRef.current);

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!leafletMapRef.current || !window.L) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = [];

    // Crear nuevos marcadores
    orders.forEach((order) => {
      const coords = extractCoordinates(order.deliveryAddress);
      if (!coords) return;

      // Crear icono personalizado
      const icon = window.L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 30px;
          height: 30px;
          background-color: ${getStatusColor(order.status)};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">📦</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = window.L.marker([coords.lat, coords.lng], { icon })
        .addTo(leafletMapRef.current);

      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${order.orderId}</h3>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Cliente:</strong> ${order.customerName}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Estado:</strong> ${getStatusText(order.status)}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Total:</strong> $${order.total}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Productos:</strong> ${order.items?.length || 0}</p>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedOrder(order);
      });

      markersRef.current.push(marker);
      bounds.push([coords.lat, coords.lng]);
    });

    // Ajustar vista para mostrar todos los marcadores
    if (bounds.length > 0) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>
          <MapPin size={24} />
          Mapa de Pedidos Pendientes
        </h2>
        <div className="map-stats">
          <span className="stat-badge">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} pendiente{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando pedidos...</div>
      ) : (
        <div className="map-content">
          <div ref={mapRef} className="map-view" style={{ height: '100%', width: '100%' }} />

          <div className="map-sidebar">
            <h3>Pedidos en el mapa ({orders.length})</h3>
            <div className="orders-list">
              {orders.map((order) => {
                const coords = extractCoordinates(order.deliveryAddress);
                return (
                  <div
                    key={order.orderId}
                    className={`order-card ${selectedOrder?.orderId === order.orderId ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedOrder(order);
                      if (leafletMapRef.current && coords) {
                        leafletMapRef.current.setView([coords.lat, coords.lng], 16, {
                          animate: true
                        });
                      }
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                        {order.orderId}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#4b5563' }}>
                      <div style={{ marginBottom: '4px' }}>
                        👤 {order.customerName}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        📱 {order.customerPhone}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        📦 {order.items?.length || 0} productos
                      </div>
                      <div style={{ marginBottom: '4px', fontWeight: 'bold', color: '#111827' }}>
                        💰 ${order.total}
                      </div>
                      {coords && (
                        <div>
                          <a
                            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: '#16a34a', textDecoration: 'none', fontWeight: '500' }}
                          >
                            📍 Ver ubicación
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="empty-state">
                  <MapPin size={48} opacity={0.3} />
                  <p>No hay pedidos pendientes con ubicación</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;
