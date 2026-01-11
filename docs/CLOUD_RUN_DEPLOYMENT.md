# 🚀 Despliegue en Google Cloud Run

## Preparación

### 1. Instalar Google Cloud SDK

Si no lo tenés instalado:
```bash
# Descargar e instalar desde: https://cloud.google.com/sdk/docs/install
```

### 2. Autenticarse con GCP

```bash
gcloud auth login
gcloud config set project dialogflow-testing-454915
```

## Despliegue

### Opción A: Despliegue Automático (Recomendado)

```bash
# 1. Habilitar APIs necesarias
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 2. Crear Secret para Dialogflow credentials
gcloud secrets create dialogflow-cx-key --data-file=credentials/dialogflow-cx-key.json

# 3. Desplegar a Cloud Run
gcloud run deploy whatsapp-bot \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DIALOGFLOW_PROJECT_ID=dialogflow-testing-454915,DIALOGFLOW_LOCATION=us-central1,DIALOGFLOW_AGENT_ID=a445a772-01a0-4f99-b149-0a83e888107a,DIALOGFLOW_LANGUAGE_CODE=es" \
  --set-secrets="GOOGLE_APPLICATION_CREDENTIALS=dialogflow-cx-key:latest" \
  --set-env-vars="MERCADOPAGO_ACCESS_TOKEN=your_token_here"
```

### Opción B: Build Manual

```bash
# 1. Build de la imagen
gcloud builds submit --tag gcr.io/dialogflow-testing-454915/whatsapp-bot

# 2. Deploy
gcloud run deploy whatsapp-bot \
  --image gcr.io/dialogflow-testing-454915/whatsapp-bot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Configurar Variables de Entorno

Después del despliegue, configurá las variables de entorno en la consola de Cloud Run o vía CLI:

```bash
gcloud run services update whatsapp-bot \
  --region us-central1 \
  --set-env-vars="PORT=8080,DIALOGFLOW_PROJECT_ID=dialogflow-testing-454915,DIALOGFLOW_LOCATION=us-central1,DIALOGFLOW_AGENT_ID=a445a772-01a0-4f99-b149-0a83e888107a,DIALOGFLOW_LANGUAGE_CODE=es"
```

### Configurar Mercado Pago (Opcional)

```bash
gcloud run services update whatsapp-bot \
  --region us-central1 \
  --set-env-vars="MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-token"
```

### Configurar BASE_URL

Una vez desplegado, obtendrás una URL como: `https://whatsapp-bot-xxxxx-uc.a.run.app`

```bash
gcloud run services update whatsapp-bot \
  --region us-central1 \
  --set-env-vars="BASE_URL=https://whatsapp-bot-xxxxx-uc.a.run.app"
```

## Obtener la URL del Servicio

```bash
gcloud run services describe whatsapp-bot \
  --region us-central1 \
  --format="value(status.url)"
```

## Actualizar Webhook en Twilio

Una vez desplegado, actualizá el webhook en Twilio Console con:

```
https://whatsapp-bot-xxxxx-uc.a.run.app/webhook/whatsapp
```

## Verificar Logs

```bash
gcloud run services logs read whatsapp-bot \
  --region us-central1 \
  --limit=50
```

## Monitoreo

Ver logs en tiempo real:
```bash
gcloud run services logs tail whatsapp-bot --region us-central1
```

## Actualizar el Servicio

Después de hacer cambios en el código:

```bash
git add .
git commit -m "Update service"
git push

# Redesplegar
gcloud run deploy whatsapp-bot \
  --source . \
  --platform managed \
  --region us-central1
```

## Troubleshooting

### Error: Credentials not found

Verificá que el secret esté configurado:
```bash
gcloud secrets describe dialogflow-cx-key
```

### Error: Permission denied

Otorgar permisos al Service Account:
```bash
gcloud projects add-iam-policy-binding dialogflow-testing-454915 \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/dialogflow.client"
```

### Ver Service Account

```bash
gcloud run services describe whatsapp-bot \
  --region us-central1 \
  --format="value(spec.template.spec.serviceAccountName)"
```

## Costos

Cloud Run es **muy económico** para este tipo de aplicación:
- Primeros 2 millones de requests/mes: **GRATIS**
- Después: ~$0.40 por millón de requests
- Para un bot de WhatsApp con uso moderado: **$0-5/mes**

## Seguridad

### Validar Twilio Signature (Recomendado)

Agregar validación de firma de Twilio en producción para evitar requests no autorizados.

### HTTPS

Cloud Run provee HTTPS automáticamente con certificado SSL administrado.

## Ventajas de Cloud Run vs Serveo/Localtunnel

✅ **URL permanente** - No cambia nunca
✅ **Alta disponibilidad** - 99.95% uptime SLA
✅ **Escalado automático** - Maneja picos de tráfico
✅ **HTTPS incluido** - Certificado SSL gratis
✅ **Sin mantenimiento** - Google administra todo
✅ **Monitoreo integrado** - Logs y métricas en GCP
✅ **Muy económico** - Tier gratuito generoso
