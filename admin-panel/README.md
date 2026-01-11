# 📊 Panel de Administración FreshMarket

Panel web completo para administrar pedidos del bot de WhatsApp.

## ✨ Características

### Backend (Node.js + Express)
- ✅ Autenticación JWT con bcrypt
- ✅ Arquitectura Middleware → Router → Controller → Service
- ✅ Integración con Firestore
- ✅ API REST completa
- ✅ CORS configurado
- ✅ Manejo de errores centralizado

### Frontend (React + Vite)
- ✅ React 18 con Vite
- ✅ React Router (SPA sin recargas)
- ✅ TanStack Query para data fetching
- ✅ Zustand para state management
- ✅ Tailwind CSS responsive
- ✅ Autenticación completa
- ✅ Dashboard con estadísticas
- ✅ Gestión de pedidos
- ✅ Actualización de estados en tiempo real

## 🚀 Inicio Rápido

### 1. Backend

```bash
cd admin-panel/backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm start
```

El backend estará en: `http://localhost:5000`

### 2. Frontend

```bash
cd admin-panel/frontend
npm install
npm run dev
```

El frontend estará en: `http://localhost:5173`

### 3. Crear Usuario Admin

**Opción A: Desde Firebase Console (Recomendado para desarrollo local)**

1. Ir a: https://console.firebase.google.com/project/dialogflow-testing-454915/firestore
2. Crear colección `users`
3. Agregar documento con estos campos:
   ```json
   {
     "email": "admin@freshmarket.com",
     "passwordHash": "$2a$10$N9qo8uL/WuD4F4.gZp6z.uNBQf5r7HXrR1dT0J6zM0YX.TkY9VmGK",
     "name": "Admin",
     "role": "admin",
     "createdAt": "2026-01-11T12:00:00.000Z",
     "updatedAt": "2026-01-11T12:00:00.000Z"
   }
   ```
   Password hash = `admin123`

4. Login en http://localhost:5173/login con:
   - Email: `admin@freshmarket.com`
   - Password: `admin123`

**Opción B: Deploy a Cloud Run**

El backend en Cloud Run tendrá los permisos correctos automáticamente.

```bash
cd admin-panel/backend
gcloud run deploy admin-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Usar el endpoint de setup
curl -X POST https://admin-backend-XXX.run.app/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freshmarket.com","password":"admin123","name":"Admin"}'
```

## 📱 Capturas de Pantalla

### Login
![Login](docs/screenshots/login.png)

### Dashboard
- Estadísticas generales
- Pedidos totales
- Revenue
- Pedidos por estado

### Gestión de Pedidos
- Lista completa de pedidos
- Filtros por estado
- Ver detalles
- Actualizar estado con un click
- Badge de colores por estado

## 🔑 API Endpoints

### Autenticación
```
POST   /api/auth/setup      - Crear primer admin (público)
POST   /api/auth/login      - Login
GET    /api/auth/me         - Usuario actual (requiere auth)
POST   /api/auth/register   - Crear nuevo admin (requiere auth)
```

### Pedidos
```
GET    /api/orders          - Lista de pedidos (con filtros)
GET    /api/orders/stats    - Estadísticas
GET    /api/orders/:id      - Detalle de pedido
PATCH  /api/orders/:id/status - Actualizar estado
```

## 🎨 Componentes UI

- `Button` - Botones con variantes (primary, secondary, danger, ghost)
- `Card` - Tarjetas con sombra
- `Badge` - Badges de colores para estados
- `Layout` - Layout principal con navegación
- `ProtectedRoute` - Rutas protegidas por autenticación

## 📊 Páginas

### Login (`/login`)
- Formulario de login
- Validación de credenciales
- Redirección automática

### Dashboard (`/`)
- 4 cards de estadísticas
- Pedidos por estado
- Revenue total y del día

### Orders (`/orders`)
- Tabla de pedidos
- Filtro por estado
- Select para cambiar estado
- Vista de items y totales

## 🔐 Autenticación

### Flow
1. Usuario ingresa email/password
2. Backend verifica con bcrypt
3. Genera JWT token (válido 24h)
4. Frontend guarda token en localStorage
5. Todas las requests incluyen header `Authorization: Bearer TOKEN`
6. Si token expira → redirect a /login

### Zustand Store
```javascript
const { user, login, logout, isAuthenticated } = useAuthStore();
```

## 🛠️ Tecnologías

### Backend
- Express.js
- JWT + bcryptjs
- Firestore
- CORS
- dotenv

### Frontend
- React 18
- Vite
- React Router v6
- TanStack Query v5
- Zustand
- Axios
- Tailwind CSS
- Lucide React (icons)

## 📦 Deploy a Producción

### Backend a Cloud Run

```bash
cd admin-panel/backend

# Build y deploy
gcloud run deploy admin-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances=2 \
  --set-env-vars="JWT_SECRET=your-production-secret,NODE_ENV=production"
```

### Frontend a Firebase Hosting

```bash
cd admin-panel/frontend

# Build
npm run build

# Deploy
firebase init hosting
firebase deploy --only hosting
```

O usar Cloud Storage + Cloud CDN:

```bash
# Build
npm run build

# Upload a bucket
gsutil -m cp -r dist/* gs://your-bucket/

# Configure Cloud CDN
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT tokens con expiración
- ✅ CORS configurado
- ✅ Rutas protegidas
- ✅ Validación de inputs
- ✅ Error handling sin exponer detalles internos

## 🐛 Troubleshooting

### Backend no inicia
- Verificar `.env` existe y tiene las variables correctas
- Verificar credenciales de Firestore
- Ver logs: `npm start`

### Frontend no conecta
- Verificar `VITE_API_URL` en `.env`
- Verificar backend está corriendo en puerto 5000
- Verificar CORS en backend

### No puedo crear usuario
- Usar Firebase Console manualmente
- O deploy backend a Cloud Run primero
- Verificar permisos de Firestore

### Token expiró
- Logout y login de nuevo
- O configurar `JWT_EXPIRES_IN` más largo en `.env`

## 📝 Próximas Mejoras

- [ ] Paginación en tabla de pedidos
- [ ] Búsqueda por cliente/teléfono
- [ ] Ver conversaciones de WhatsApp
- [ ] Exportar pedidos a CSV
- [ ] Notificaciones en tiempo real
- [ ] Dashboard con gráficos
- [ ] Múltiples roles (admin, viewer)
- [ ] Cambio de contraseña
- [ ] 2FA

## 🤝 Contribuir

El código está organizado para ser fácil de extender:

```
backend/src/
  config/       - Configuración (Firestore, etc)
  middleware/   - Autenticación, errores
  routes/       - Definición de rutas
  controllers/  - Lógica de request/response
  services/     - Lógica de negocio

frontend/src/
  api/          - Cliente HTTP
  components/   - Componentes reutilizables
  pages/        - Páginas principales
  store/        - Estado global (Zustand)
```

## 📄 Licencia

MIT
