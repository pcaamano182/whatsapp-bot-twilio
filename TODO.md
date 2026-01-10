# 📋 TODO - WhatsApp Bot Twilio

## 🎯 Roadmap del Proyecto

---

## ✅ Fase 1 - POC Local (COMPLETADO)

- [x] Configurar Twilio WhatsApp Sandbox
- [x] Implementar backend Express con webhook
- [x] Configurar TwiML para respuestas
- [x] Exponer localmente con ngrok/localtunnel
- [x] Validar flujo completo de mensajes
- [x] Agregar logging y debug
- [x] Documentación inicial (README + ARCHITECTURE)
- [x] Configurar repositorio Git
- [x] Subir código a GitHub

---

## 🚧 Fase 2 - Procesamiento Inteligente (EN PROGRESO)

### Dialogflow Integration

- [ ] Crear proyecto en Google Cloud Platform
- [ ] Habilitar Dialogflow API
- [ ] Crear agente de Dialogflow
- [ ] Configurar intents básicos:
  - [ ] Intent: Saludar
  - [ ] Intent: Ayuda
  - [ ] Intent: Pedir información
  - [ ] Intent: Finalizar conversación
- [ ] Crear entidades personalizadas (si aplica)
- [ ] Configurar contextos para mantener estado
- [ ] Crear Service Account en GCP
- [ ] Asignar rol `roles/dialogflow.client`
- [ ] Descargar credenciales JSON
- [ ] Instalar SDK: `@google-cloud/dialogflow`
- [ ] Integrar código en backend:
  - [ ] Función `detectIntent()`
  - [ ] Usar `From` como sessionId
  - [ ] Manejar respuestas de Dialogflow
  - [ ] Logging de intents y parámetros
- [ ] Probar conversaciones en WhatsApp
- [ ] Ajustar training phrases según feedback

### Mejoras al Backend

- [ ] Agregar manejo de errores robusto
- [ ] Implementar retry logic para Dialogflow
- [ ] Agregar timeout a requests
- [ ] Logging estructurado (winston o similar)

---

## 🔒 Fase 3 - Seguridad

### Verificación de Firma Twilio

- [ ] Implementar validación de `X-Twilio-Signature`
- [ ] Configurar variables de entorno:
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
- [ ] Rechazar requests no autenticados (403)
- [ ] Agregar tests de seguridad

### Otras Medidas

- [ ] Rate limiting (express-rate-limit)
- [ ] Validación de input del usuario
- [ ] Sanitización de datos
- [ ] CORS configurado correctamente
- [ ] Variables sensibles en `.env` (no hardcoded)

---

## 💾 Fase 4 - Persistencia (OPCIONAL)

### Base de Datos

- [ ] Decidir motor de BD (MongoDB, PostgreSQL, Firestore)
- [ ] Diseñar schema:
  - [ ] Usuarios (WhatsApp ID, nombre, metadata)
  - [ ] Conversaciones (sessionId, mensajes, timestamp)
  - [ ] Pedidos/Transacciones (si aplica)
- [ ] Implementar conexión a BD
- [ ] Guardar historial de mensajes
- [ ] Guardar contexto de usuario
- [ ] Implementar queries básicas
- [ ] Agregar índices para performance

---

## ☁️ Fase 5 - Deployment en Producción

### Google Cloud Platform

- [ ] Crear Dockerfile
- [ ] Configurar Cloud Build
- [ ] Desplegar en Cloud Run:
  - [ ] Configurar variables de entorno
  - [ ] Configurar Secret Manager para credenciales
  - [ ] Asignar Service Account con IAM
  - [ ] Configurar autoscaling
  - [ ] Configurar health checks
- [ ] Configurar dominio custom (opcional)
- [ ] Configurar SSL/TLS
- [ ] Actualizar webhook en Twilio con URL de producción

### Monitoreo y Observabilidad

- [ ] Configurar Cloud Logging
- [ ] Configurar Cloud Monitoring
- [ ] Crear dashboards de métricas:
  - [ ] Request count
  - [ ] Latency
  - [ ] Error rate
  - [ ] Dialogflow API usage
- [ ] Configurar alertas:
  - [ ] Error rate > 5%
  - [ ] Latency > 2s
  - [ ] API quota exceeded
- [ ] Implementar health check endpoint mejorado

---

## 🚀 Fase 6 - Funcionalidades Avanzadas

### Features

- [ ] Soporte para multimedia (imágenes, PDFs)
- [ ] Mensajes proactivos (fuera de ventana 24h)
- [ ] Templates de WhatsApp aprobados
- [ ] Integración con CRM/ERP
- [ ] Webhooks para eventos externos
- [ ] Respuestas automáticas fuera de horario
- [ ] Transferencia a agente humano
- [ ] Analytics de conversaciones

### Mejoras UX

- [ ] Botones interactivos (Quick Replies)
- [ ] Listas de opciones
- [ ] Mensajes con formato rich (bold, italic)
- [ ] Typing indicators
- [ ] Read receipts

---

## 🧪 Testing

- [ ] Unit tests (Jest)
- [ ] Integration tests (webhook + Dialogflow)
- [ ] E2E tests (simulación de conversaciones)
- [ ] Load testing (k6 o Artillery)
- [ ] Security testing (OWASP)
- [ ] CI/CD pipeline (GitHub Actions)

---

## 📚 Documentación

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Onboarding para nuevos desarrolladores
- [ ] Diagramas de arquitectura actualizados
- [ ] Video demo del bot funcionando

---

## 🐛 Bugs Conocidos / Mejoras Pendientes

- [ ] (Agregar bugs según se encuentren)

---

## 💡 Ideas / Backlog

- [ ] Multi-idioma (i18n)
- [ ] A/B testing de respuestas
- [ ] Machine Learning para mejorar intents
- [ ] Integración con WhatsApp Business API (producción real)
- [ ] Dashboard web para administradores
- [ ] Reportes automáticos diarios/semanales

---

## 📝 Notas

- **Prioridad actual**: Fase 2 - Integración con Dialogflow
- **Colaboradores**: Pablo Caamano, mcaamano182
- **Última actualización**: 2026-01-10

---

## 🔗 Links Útiles

- [Twilio Console](https://console.twilio.com/)
- [Dialogflow Console](https://dialogflow.cloud.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Repositorio GitHub](https://github.com/pcaamano182/whatsapp-bot-twilio)
