# 📘 WhatsApp Bot — Twilio + Backend Local

Bot de WhatsApp implementado con Twilio WhatsApp Sandbox y backend Node.js local.

---

## 🎯 Objetivo del Proyecto

Implementar un bot de WhatsApp que:

- ✅ Reciba mensajes enviados por usuarios vía WhatsApp
- ✅ Utilice **Twilio WhatsApp Sandbox** como proveedor
- ✅ Procese los mensajes en un **backend HTTP local**
- ✅ Responda automáticamente a los usuarios

### Restricciones de esta fase (POC Local)

- ❌ NO se usa GCP
- ❌ NO se usa Dialogflow (aún)
- ✅ Backend corre **localmente**
- ✅ Exposición pública vía **ngrok**

---

## 🏗️ Arquitectura Actual

```
Usuario (WhatsApp)
  ↓
Twilio WhatsApp Sandbox
  ↓  (Webhook HTTP POST)
ngrok (túnel HTTPS público)
  ↓
Backend local (Node.js + Express)
  ↓
Respuesta TwiML (XML)
  ↑
Twilio
  ↑
Usuario
```

---

## 🔧 Componentes Técnicos

### 1. Proveedor WhatsApp

**Twilio WhatsApp Sandbox**

Configuración clave en Twilio Console:
- **Campo**: `WHEN A MESSAGE COMES IN`
- **Método**: `POST`
- **URL**: `https://<ngrok-id>.ngrok.io/webhook/whatsapp`

### 2. Backend

| Componente | Tecnología |
|-----------|------------|
| **Lenguaje** | Node.js ≥ 18 |
| **Framework** | Express |
| **Formato Request** | `application/x-www-form-urlencoded` |
| **Endpoint Principal** | `POST /webhook/whatsapp` |

#### Payload Relevante (Twilio)

```javascript
{
  Body: "texto del mensaje",
  From: "whatsapp:+1234567890",  // ← usar como sessionId
  WaId: "1234567890",
  ProfileName: "Usuario WhatsApp"
}
```

#### Formato de Respuesta

**TwiML XML**

```xml
<Response>
  <Message>Texto de respuesta</Message>
</Response>
```

### 3. Exposición Pública

**Herramienta**: ngrok

```bash
ngrok http 3000
```

La URL generada (`https://<id>.ngrok.io`) se usa como webhook en Twilio.

---

## 🚀 Instalación y Ejecución

### Requisitos

- Node.js ≥ 18
- npm o yarn
- Cuenta de Twilio (con WhatsApp Sandbox activo)
- ngrok instalado

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env`:

```env
PORT=3000
# TWILIO_ACCOUNT_SID=tu_account_sid  # Para fase 3 (seguridad)
# TWILIO_AUTH_TOKEN=tu_auth_token    # Para fase 3 (seguridad)
```

### 3. Iniciar el servidor

```bash
npm start
```

O en modo desarrollo (auto-reload):

```bash
npm run dev
```

### 4. Exponer con ngrok

En otra terminal:

```bash
npm run ngrok
# o manualmente:
ngrok http 3000
```

**Copiar la URL generada** (ej: `https://abc123.ngrok.io`)

### 5. Configurar Twilio

1. Ir a [Twilio Console → WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. En **WHEN A MESSAGE COMES IN**:
   - **URL**: `https://abc123.ngrok.io/webhook/whatsapp`
   - **Método**: `POST`
3. Guardar configuración

### 6. Probar el bot

1. Enviar mensaje al número de sandbox de Twilio desde WhatsApp
2. Ver logs en la terminal del backend
3. Recibir respuesta automática

---

## 📂 Estructura del Proyecto

```
order_assistant/
├── src/
│   └── index.js          # Servidor Express + webhook WhatsApp
├── .env                  # Variables de entorno (no en git)
├── .gitignore
├── package.json
└── README.md
```

---

## 🔍 Estado Actual del Proyecto

### ✅ Completado

- [x] Twilio Sandbox activo
- [x] Backend local funcionando
- [x] Webhook Twilio → ngrok → localhost validado
- [x] Respuesta automática enviada a WhatsApp
- [x] Logging de mensajes

### ❌ Pendiente

- [ ] Integración con NLP (Dialogflow)
- [ ] Persistencia de datos
- [ ] Seguridad: verificación de firma Twilio
- [ ] Deployment en cloud (GCP)

---

## 🛤️ Roadmap Técnico

### **Fase 2 — Procesamiento Inteligente (Local)**

**Agregar**:
- Dialogflow ES o CX
- SDK local: `@google-cloud/dialogflow`
- Session ID = número de WhatsApp (`From`)

**Flujo**:
```
Mensaje → Dialogflow → Fulfillment → TwiML → Twilio
```

**Implementación**:
1. Crear agente en Dialogflow
2. Configurar service account en GCP
3. Descargar credenciales JSON
4. Integrar SDK en [src/index.js](src/index.js)

### **Fase 3 — Seguridad**

**Implementar**:
- Verificación de firma Twilio (`X-Twilio-Signature`)
- Validación de requests entrantes
- Rechazo de tráfico no autenticado

**Código**:
```javascript
import twilio from 'twilio';

const twilioSignature = req.headers['x-twilio-signature'];
const url = `https://your-domain.ngrok.io${req.path}`;
const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN,
  twilioSignature,
  url,
  req.body
);

if (!isValid) {
  return res.status(403).send('Forbidden');
}
```

### **Fase 4 — Escalabilidad / Producción**

**Migrar backend a**:
- **GCP Cloud Run**
- Variables de entorno (Secret Manager)
- IAM (`roles/dialogflow.client`)
- Logging / Monitoring (Cloud Logging)

---

## ⚠️ Consideraciones Importantes

| Aspecto | Detalle |
|---------|---------|
| **Ventana de WhatsApp** | Solo puedes responder **dentro de 24h** desde el último mensaje del usuario |
| **Mensajes fuera de ventana** | Requieren **templates aprobados** por WhatsApp |
| **Twilio Sandbox** | Limitado a números pre-autorizados (desarrollo) |
| **ngrok URL** | Cambia en cada restart (salvo plan pago) → reconfigurar Twilio |

---

## 🤖 Instrucciones para otra IA / Desarrollador

> **Contexto del proyecto**:
> Este proyecto implementa un bot de WhatsApp usando Twilio WhatsApp Sandbox.
> Actualmente el backend corre **localmente** y responde con **TwiML**.
> El siguiente paso esperado es **integrar Dialogflow** manteniendo el backend local,
> usando el número del remitente como `sessionId`, y luego asegurar el webhook con
> verificación de firma Twilio.

**Endpoints actuales**:
- `GET /` → Info del servicio
- `GET /health` → Health check
- `POST /webhook/whatsapp` → Webhook principal (recibe mensajes de Twilio)

**Payload de entrada** (Twilio → Backend):
```javascript
{
  Body: "mensaje del usuario",
  From: "whatsapp:+1234567890",
  WaId: "1234567890",
  ProfileName: "Nombre Usuario"
}
```

**Payload de salida** (Backend → Twilio):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Texto de respuesta</Message>
</Response>
```

---

## 📝 Logs de Ejemplo

```
🚀 WhatsApp Bot Server iniciado
📍 Puerto: 3000
🌐 Webhook: http://localhost:3000/webhook/whatsapp

💡 Recuerda:
   1. Ejecutar ngrok: ngrok http 3000
   2. Configurar webhook en Twilio con la URL de ngrok
   3. Formato: https://<ngrok-id>.ngrok.io/webhook/whatsapp

[2026-01-10T15:30:45.123Z] POST /webhook/whatsapp
📨 Mensaje recibido:
   De: Pablo (whatsapp:+5491234567890)
   WhatsApp ID: 5491234567890
   Mensaje: hola
✅ Respuesta enviada: Hola Pablo 👋, ¿en qué puedo ayudarte?
```

---

## 🎯 Resultado Esperado Final

Un bot de WhatsApp:
- ✅ Conversacional (Dialogflow)
- ✅ Escalable (GCP Cloud Run)
- ✅ Seguro (firma Twilio, IAM)
- ✅ Desplegado en producción
- ✅ Monitoreado y observable

---

## 📚 Recursos

- [Twilio WhatsApp Sandbox](https://www.twilio.com/docs/whatsapp/sandbox)
- [TwiML Reference](https://www.twilio.com/docs/messaging/twiml)
- [Dialogflow ES Docs](https://cloud.google.com/dialogflow/es/docs)
- [ngrok Documentation](https://ngrok.com/docs)

---

## 📄 Licencia

ISC
