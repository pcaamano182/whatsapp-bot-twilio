# 💳 Guía de Integración - Mercado Pago

## ✅ Integración Completada

La integración con Mercado Pago está implementada en el backend. Ahora necesitás configurar tu cuenta de Mercado Pago.

---

## 📋 Pasos para Configurar Mercado Pago

### 1. Crear Cuenta en Mercado Pago (Uruguay)

1. Ve a [https://www.mercadopago.com.uy](https://www.mercadopago.com.uy)
2. Regístrate o inicia sesión
3. Ve a **Tu cuenta → Tus credenciales**
4. Activa modo "Producción" cuando estés listo (por ahora usa "Prueba")

### 2. Obtener Access Token

1. En el panel de Mercado Pago, ve a **Tus integraciones**
2. Copia el **Access Token** (puede ser de prueba o producción)
3. Pega el token en el archivo `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXX-XXXXXXXX
```

### 3. Actualizar BASE_URL en .env

Si cambia la URL de serveo/ngrok, actualiza:

```env
BASE_URL=https://tu-nueva-url.serveousercontent.com
```

---

## 🔌 Endpoints Implementados

### 1. Crear Link de Pago
**POST** `/api/create-payment`

**Body (JSON):**
```json
{
  "orderId": "ORD-12345",
  "items": [
    {
      "product": "manzanas",
      "quantity": 2,
      "subtotal": 360
    }
  ],
  "total": 860,
  "deliveryFee": 500,
  "customer": {
    "name": "Pablo",
    "phone": "+59898852466"
  },
  "deliveryAddress": "Av. Corrientes 5000, CABA"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=...",
  "preferenceId": "123456-abc-def",
  "orderId": "ORD-12345"
}
```

### 2. Webhook de Notificaciones
**POST** `/webhook/mercadopago`

Mercado Pago enviará notificaciones automáticamente cuando:
- El pago es aprobado
- El pago falla
- El pago está pendiente

### 3. Páginas de Redirección

Después del pago, el cliente es redirigido a:

- **Éxito**: `/payment/success`
- **Fallo**: `/payment/failure`
- **Pendiente**: `/payment/pending`

---

## 🤖 Actualizar Playbook de Dialogflow CX

Necesitás actualizar el Playbook para que después de confirmar el pedido, genere un link de pago.

### Cambios en las Instrucciones del Playbook:

Agrega esta sección después de "8. Order Confirmation":

```
8. Order Confirmation:
   - If customer confirms (sí, dale, confirmar, ok), generate order ID
   - Order ID format: ORD-[5 random digits]
   - IMPORTANT: After confirmation, tell customer you'll send payment link
   - Final message:
     "¡Pedido confirmado! 🎉

     Número de pedido: #[order_id]
     Total: $[total_amount]

     📲 Te enviaré el link de pago de Mercado Pago en un momento.

     Podés pagar con:
     • Tarjeta de débito/crédito
     • Prex
     • Transferencia bancaria

     ¡Gracias por tu compra en FreshMarket! 😊"
```

**NOTA:** El link de pago real será generado por el backend cuando detecte que el pedido fue confirmado. Por ahora, el Playbook solo debe mencionar que se enviará el link.

---

## 🧪 Cómo Probar la Integración

### Opción 1: Probar el endpoint directamente

```bash
curl -X POST http://localhost:3002/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-99999",
    "items": [{
      "product": "manzanas",
      "quantity": 2,
      "subtotal": 360
    }],
    "total": 360,
    "deliveryFee": 0,
    "customer": {
      "name": "Test User",
      "phone": "+59898852466"
    }
  }'
```

### Opción 2: Flujo completo desde WhatsApp

1. Haz un pedido normal por WhatsApp
2. Confirma el pedido
3. El backend debería generar el link de pago
4. Recibirás el link por WhatsApp
5. Abre el link y realiza el pago de prueba

---

## 🔐 Seguridad y Producción

### Antes de ir a producción:

1. **Usa Access Token de Producción** (no de prueba)
2. **Valida webhooks** con firma de Mercado Pago
3. **Guarda pedidos** en una base de datos
4. **Implementa reintentos** para pagos fallidos
5. **Agrega logging** de todas las transacciones

### Webhooks en Producción

Configura la URL del webhook en Mercado Pago:
```
https://tu-dominio.com/webhook/mercadopago
```

---

## 💡 Siguiente Paso: Integración Automática

Para que el Playbook envíe automáticamente el link de pago, necesitarías:

1. **Opción A:** Crear una tool/función en Dialogflow CX que llame al endpoint `/api/create-payment`
2. **Opción B:** Detectar en el backend cuando el Playbook confirma un pedido y enviar automáticamente el link por WhatsApp usando Twilio
3. **Opción C (Recomendada):** Usar Dialogflow CX Webhooks para llamar al backend cuando se confirme un pedido

¿Querés que implemente alguna de estas opciones?

---

## 📚 Documentación Adicional

- [Mercado Pago - Documentación Oficial](https://www.mercadopago.com.uy/developers)
- [Mercado Pago - Crear Preferencia de Pago](https://www.mercadopago.com.uy/developers/es/docs/checkout-pro/integrate-preferences)
- [Mercado Pago - Webhooks](https://www.mercadopago.com.uy/developers/es/docs/your-integrations/notifications/webhooks)
