# Cloud Run Security & Cost Protection

## Protección contra Ataques y Costos Excesivos

### 1. Límites de Cloud Run (CRÍTICO)

```bash
# Deploy con límites estrictos de recursos
gcloud run deploy whatsapp-bot \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances=3 \
  --concurrency=10 \
  --cpu=1 \
  --memory=512Mi \
  --timeout=60s \
  --min-instances=0 \
  --set-env-vars="DIALOGFLOW_PROJECT_ID=dialogflow-testing-454915,DIALOGFLOW_LOCATION=us-central1,DIALOGFLOW_AGENT_ID=a445a772-01a0-4f99-b149-0a83e888107a,DIALOGFLOW_LANGUAGE_CODE=es"
```

**Explicación de límites:**
- `--max-instances=3`: Máximo 3 contenedores corriendo simultáneamente
- `--concurrency=10`: Máximo 10 requests concurrentes por contenedor = **30 requests totales máximo**
- `--cpu=1` y `--memory=512Mi`: Recursos mínimos (más barato)
- `--timeout=60s`: Timeout de 1 minuto por request
- `--min-instances=0`: Escala a cero cuando no hay tráfico (gratis)

**Costo estimado con estos límites:**
- Si los 3 contenedores corren 24/7 todo el mes: ~$15 USD
- Con uso normal (escala a 0): ~$2-3 USD/mes
- **Incluso bajo ataque máximo sostenido, no podrá exceder ~$15-20/mes**

### 2. Application-Level Rate Limiting

Para mayor protección, agregamos rate limiting por número de teléfono:

```javascript
// Ya está incluido en el código - limita 10 mensajes por minuto por número
```

### 3. Twilio Rate Limiting

Twilio también tiene sus propios límites que puedes configurar:
- https://console.twilio.com/us1/develop/sms/settings/geo-permissions
- Bloquear países de donde no esperas tráfico
- Limitar cantidad de mensajes por día

### 4. Monitoreo y Alertas

```bash
# Configurar alerta cuando se exceda el 50% del presupuesto
gcloud billing budgets update <BUDGET_ID> \
  --threshold-rule=percent=50,basis=forecasted-spend
```

### 5. Cloud Armor (Opcional - $0.50/regla/mes)

Para protección DDoS profesional:

```bash
# Habilitar Cloud Armor
gcloud services enable compute.googleapis.com

# Crear política de seguridad
gcloud compute security-policies create whatsapp-protection \
  --description "Protección contra DDoS y bots"

# Agregar regla de rate limiting global
gcloud compute security-policies rules create 1000 \
  --security-policy whatsapp-protection \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 100 \
  --rate-limit-threshold-interval-sec 60 \
  --ban-duration-sec 600
```

**Nota:** Cloud Armor requiere Load Balancer, lo cual añade ~$18/mes adicional. **NO recomendado** para este proyecto personal.

## Recomendación Final

**Para tu caso (proyecto personal, presupuesto $10/mes):**

1. ✅ **Usar los límites de Cloud Run** (max-instances=3, concurrency=10)
2. ✅ **Presupuesto de $10 con auto-shutdown** (ya configurado)
3. ✅ **Rate limiting en código** (ya incluido)
4. ✅ **Monitorear uso diario** en https://console.cloud.google.com/billing
5. ❌ **NO usar Cloud Armor** (muy caro para proyecto personal)

Con estos límites, **incluso en el peor escenario de ataque sostenido 24/7, el costo máximo será ~$15-20/mes** y el sistema automáticamente deshabilitará la facturación al alcanzar $10.

## Cálculo de Capacidad Máxima

Con los límites configurados:
- **30 requests concurrentes** máximo (3 instancias × 10 concurrency)
- **~1800 requests/minuto** estimado (30 concurrent × 2 requests/sec)
- **~2.6 millones requests/mes** máximo teórico

Para un bot de WhatsApp personal, esto es **más que suficiente**.

## Qué pasa si hay un ataque

1. Cloud Run alcanzará el límite de 3 instancias
2. Requests adicionales quedarán en cola o recibirán error 429 (Too Many Requests)
3. El rate limiter en código bloqueará usuarios que envíen >10 msgs/min
4. Si el costo alcanza $10, el presupuesto deshabilitará automáticamente la facturación
5. **Costo máximo absoluto: ~$15-20** (considerando el retraso en actualizaciones de facturación)
