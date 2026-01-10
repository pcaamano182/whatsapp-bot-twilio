# 🏗️ Arquitectura Técnica — WhatsApp Bot

## Diagrama de Secuencia

```
┌──────────┐      ┌─────────┐      ┌───────┐      ┌──────────┐
│ Usuario  │      │ Twilio  │      │ ngrok │      │ Backend  │
│WhatsApp) │      │Sandbox) │      │       │      │(Express) │
└────┬─────┘      └────┬────┘      └───┬───┘      └────┬─────┘
     │                 │                │               │
     │  1. Envía msg   │                │               │
     │────────────────>│                │               │
     │                 │                │               │
     │                 │  2. POST       │               │
     │                 │  /webhook      │               │
     │                 │───────────────>│               │
     │                 │                │               │
     │                 │                │  3. Tunnel    │
     │                 │                │──────────────>│
     │                 │                │               │
     │                 │                │  4. Process   │
     │                 │                │  + TwiML      │
     │                 │                │<──────────────│
     │                 │                │               │
     │                 │  5. TwiML XML  │               │
     │                 │<───────────────│               │
     │                 │                │               │
     │  6. Respuesta   │                │               │
     │<────────────────│                │               │
     │                 │                │               │
```

---

## Componentes Detallados

### 1. Frontend (Usuario)

**Plataforma**: WhatsApp (iOS/Android/Web)

**Protocolo**: WhatsApp Business API (gestionado por Twilio)

**Entrada**: Texto plano

**Salida**: Mensajes recibidos vía WhatsApp

---

### 2. Twilio WhatsApp Sandbox

**Función**: Gateway entre WhatsApp y tu backend

**Configuración**:
```
Endpoint: POST https://<ngrok>.ngrok.io/webhook/whatsapp
Content-Type: application/x-www-form-urlencoded
```

**Request Body (ejemplo)**:
```
Body=hola&
From=whatsapp%3A%2B5491234567890&
WaId=5491234567890&
ProfileName=Pablo&
MessageSid=SM1234567890abcdef&
AccountSid=AC1234567890abcdef
```

**Respuesta esperada**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Texto de respuesta</Message>
</Response>
```

---

### 3. ngrok

**Función**: Túnel HTTPS público hacia localhost

**Puerto local**: 3000

**URL pública**: `https://<random-id>.ngrok.io`

**Limitaciones**:
- URL cambia en cada restart (plan gratuito)
- Requiere reconfiguración en Twilio

**Comando**:
```bash
ngrok http 3000
```

---

### 4. Backend (Node.js + Express)

**Puerto**: 3000

**Endpoints**:

| Método | Path | Función |
|--------|------|---------|
| `GET` | `/` | Info del servicio |
| `GET` | `/health` | Health check |
| `POST` | `/webhook/whatsapp` | Webhook principal |

**Stack**:
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Librería Twilio**: `twilio` (para generar TwiML)
- **Config**: `dotenv`

**Flujo en** `/webhook/whatsapp`:
1. Recibe `req.body` (url-encoded)
2. Extrae `Body`, `From`, `WaId`, `ProfileName`
3. Procesa mensaje (lógica simple por ahora)
4. Genera TwiML con `twilio.twiml.MessagingResponse()`
5. Responde con `Content-Type: text/xml`

**Logs**:
```javascript
console.log('📨 Mensaje recibido:');
console.log(`   De: ${profileName} (${senderNumber})`);
console.log(`   WhatsApp ID: ${whatsappId}`);
console.log(`   Mensaje: ${messageBody}`);
```

---

## Modelo de Datos

### Request (Twilio → Backend)

```typescript
interface TwilioWebhookPayload {
  Body: string;              // Texto del mensaje
  From: string;              // "whatsapp:+5491234567890"
  WaId: string;              // "5491234567890"
  ProfileName: string;       // Nombre del usuario
  MessageSid: string;        // ID único del mensaje
  AccountSid: string;        // Account SID de Twilio
  NumMedia?: string;         // Cantidad de archivos adjuntos
  MediaContentType0?: string;// Tipo de media (si aplica)
  MediaUrl0?: string;        // URL de media (si aplica)
}
```

### Response (Backend → Twilio)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Texto de respuesta</Message>
</Response>
```

O usando SDK:

```javascript
const twiml = new twilio.twiml.MessagingResponse();
twiml.message('Texto de respuesta');
res.type('text/xml').send(twiml.toString());
```

---

## Seguridad (Fase 3)

### Verificación de Firma Twilio

**Header**: `X-Twilio-Signature`

**Algoritmo**: HMAC-SHA1

**Validación**:
```javascript
import twilio from 'twilio';

const twilioSignature = req.headers['x-twilio-signature'];
const url = `https://your-domain.ngrok.io/webhook/whatsapp`;
const params = req.body;

const isValid = twilio.validateRequest(
  process.env.TWILIO_AUTH_TOKEN,
  twilioSignature,
  url,
  params
);

if (!isValid) {
  return res.status(403).send('Forbidden');
}
```

**Referencias**:
- [Twilio Security: Request Validation](https://www.twilio.com/docs/usage/security#validating-requests)

---

## Escalabilidad (Fase 4)

### Migración a GCP Cloud Run

**Arquitectura objetivo**:

```
Usuario (WhatsApp)
  ↓
Twilio Sandbox
  ↓
Cloud Load Balancer (HTTPS)
  ↓
Cloud Run (contenedor)
  ↓
Dialogflow CX
  ↓
Cloud Firestore (opcional)
```

**Configuración**:

1. **Dockerizar backend**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "src/index.js"]
```

2. **Deploy a Cloud Run**:
```bash
gcloud run deploy whatsapp-bot \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

3. **Variables de entorno** (Secret Manager):
```bash
gcloud secrets create TWILIO_AUTH_TOKEN --data-file=.env
```

4. **IAM**:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member serviceAccount:SA_EMAIL \
  --role roles/dialogflow.client
```

---

## Integración Dialogflow (Fase 2)

### Setup

1. Crear agente en Dialogflow Console
2. Crear Service Account en GCP:
   ```bash
   gcloud iam service-accounts create dialogflow-client
   gcloud iam service-accounts keys create key.json \
     --iam-account dialogflow-client@PROJECT_ID.iam.gserviceaccount.com
   ```

3. Dar permisos:
   ```bash
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:dialogflow-client@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/dialogflow.client"
   ```

### Código de integración

```javascript
import dialogflow from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';

const sessionClient = new dialogflow.SessionsClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

async function detectIntent(text, sessionId) {
  const sessionPath = sessionClient.projectAgentSessionPath(
    process.env.DIALOGFLOW_PROJECT_ID,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
        languageCode: 'es',
      },
    },
  };

  const [response] = await sessionClient.detectIntent(request);
  return response.queryResult.fulfillmentText;
}

// En el webhook:
app.post('/webhook/whatsapp', async (req, res) => {
  const { Body, From } = req.body;
  const sessionId = From; // whatsapp:+5491234567890

  const replyText = await detectIntent(Body, sessionId);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(replyText);
  res.type('text/xml').send(twiml.toString());
});
```

---

## Monitoreo y Observabilidad

### Logs estructurados

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Message received', {
  from: senderNumber,
  body: messageBody,
  timestamp: new Date().toISOString()
});
```

### Métricas (Cloud Run)

- Request count
- Request latency
- Error rate
- Container CPU/Memory usage

### Alertas

```yaml
# alert-policy.yaml
displayName: "High error rate"
conditions:
  - displayName: "Error rate > 5%"
    conditionThreshold:
      filter: 'metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"'
      comparison: COMPARISON_GT
      thresholdValue: 0.05
      duration: 60s
```

---

## Consideraciones de WhatsApp Business API

### Ventana de 24 horas

- Puedes responder **gratis** dentro de 24h desde el último mensaje del usuario
- Fuera de ventana: requiere **Message Template** aprobado

### Templates

Ejemplo:
```
Hola {{1}}, tu pedido #{{2}} está en camino 🚚
```

Aprobación: 1-2 días hábiles (Meta)

### Límites de Twilio Sandbox

- Máximo 5 usuarios concurrentes
- Solo números pre-autorizados (`join <sandbox-keyword>`)
- **Producción requiere**: Twilio WhatsApp Business Profile + aprobación Meta

---

## Decisiones de Diseño

| Decisión | Justificación |
|----------|---------------|
| **Express** | Simplicidad, ecosistema maduro |
| **TwiML** | Formato nativo de Twilio |
| **ngrok** | Desarrollo local sin infraestructura |
| **SessionId = From** | Mantiene contexto por usuario |
| **Sin base de datos** | Fase POC, no requiere persistencia aún |

---

## Referencias

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp/api)
- [TwiML Messaging](https://www.twilio.com/docs/messaging/twiml)
- [Dialogflow Node.js SDK](https://github.com/googleapis/nodejs-dialogflow)
- [GCP Cloud Run](https://cloud.google.com/run/docs)
