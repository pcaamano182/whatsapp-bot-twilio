# 🎮 Dialogflow CX Playbooks - Agente Generativo

## 🌟 ¿Qué son los Playbooks?

Los **Playbooks** son la nueva funcionalidad de Dialogflow CX que usa **Generative AI** (LLM) en lugar de reglas determinísticas.

### Diferencias clave:

| Aspecto | Flows Tradicionales | Playbooks (Generative AI) |
|---------|---------------------|----------------------------|
| **Lógica** | Determinística (if/then) | Generativa (LLM) |
| **Training Phrases** | Necesarias (~10 por intent) | Opcionales (el LLM entiende naturalmente) |
| **Flexibilidad** | Baja (solo entiende lo entrenado) | Alta (entiende variaciones naturales) |
| **Mantenimiento** | Alto (agregar frases manualmente) | Bajo (el LLM generaliza) |
| **Contexto** | Limitado | Natural (conversación fluida) |
| **Setup** | Complejo (flows, pages, routes) | Simple (instrucciones en texto) |

---

## 🎯 Arquitectura con Playbooks

```
Usuario envía mensaje
  ↓
Dialogflow CX Playbook (LLM)
  ├─ Lee instrucciones del playbook
  ├─ Entiende intención del usuario
  ├─ Ejecuta tools/functions si es necesario
  └─ Genera respuesta natural
  ↓
Backend recibe respuesta
  ↓
Usuario en WhatsApp
```

---

## 📋 Diseño del Playbook para Pedidos

### Playbook: "Order Management"

**Objetivo**: Tomar pedidos de frutas y verduras de forma conversacional

**Instrucciones del Playbook** (en lenguaje natural):

```
You are a friendly virtual assistant for FreshMarket, a fruit and vegetable delivery service.

Your goal is to help customers place orders for fresh produce.

## Behavior:
1. Greet customers warmly in Spanish
2. Ask what products they'd like to order
3. For each product, collect:
   - Product name (fruit or vegetable)
   - Quantity (number)
   - Unit (kilos, gramos, or unidades)
4. Keep track of all items in the order
5. When the customer is done, show a summary of their order
6. Ask for confirmation
7. If confirmed, finalize the order and provide an order number

## Available Products:
Fruits: manzanas, bananas, naranjas, peras, frutillas, uvas, sandía, melón, duraznos, kiwis
Vegetables: tomates, lechuga, zanahorias, papas, cebollas, ajo, espinaca, brócoli, calabaza, pimientos

## Rules:
- Always respond in Spanish
- Be friendly and helpful
- If a product is not in the list, politely inform the customer
- Default unit is "kilos" if not specified
- Keep responses concise and clear
- Use emojis to make the conversation friendly 😊🥬🍎

## Conversation Flow:
1. Customer greets → Respond with greeting and ask if they want to order
2. Customer says yes → Ask what they'd like to order
3. Customer mentions products → Confirm each product and ask if they want more
4. Customer says no/done → Show order summary and ask for confirmation
5. Customer confirms → Finalize order with order number
6. Customer cancels → Cancel order and offer to start again

## Example:
Customer: "hola"
You: "¡Hola! 👋 Bienvenido a FreshMarket. ¿Querés hacer un pedido de frutas y verduras frescas?"

Customer: "sí, quiero 2 kilos de manzanas"
You: "Perfecto! Agregué 2 kilos de manzanas a tu pedido. ¿Querés agregar algo más?"

Customer: "también 1 kilo de tomates"
You: "Genial! Agregué 1 kilo de tomates. ¿Algo más?"

Customer: "no, eso es todo"
You: "📋 Resumen de tu pedido:
1. 2 kilos de manzanas
2. 1 kilo de tomates

¿Confirmás el pedido?"

Customer: "sí"
You: "¡Pedido confirmado! 🎉 Tu número de pedido es #12345. Te contactaremos pronto para coordinar la entrega. ¡Gracias por tu compra!"
```

---

## 🛠️ Tools/Functions (Opcional)

Para hacer el playbook más potente, podés definir **tools** que el LLM puede llamar:

### Tool 1: `add_product_to_order`

**Descripción**: Agrega un producto al pedido del usuario

**Parámetros**:
```json
{
  "product": {
    "type": "string",
    "description": "Nombre del producto (fruta o verdura)"
  },
  "quantity": {
    "type": "number",
    "description": "Cantidad del producto"
  },
  "unit": {
    "type": "string",
    "description": "Unidad de medida (kilos, gramos, unidades)",
    "default": "kilos"
  }
}
```

**Implementación** (webhook):
```javascript
// Tu backend recibe el tool call
{
  "tool": "add_product_to_order",
  "parameters": {
    "product": "manzanas",
    "quantity": 2,
    "unit": "kilos"
  }
}

// Tu backend responde con el resultado
{
  "success": true,
  "message": "Producto agregado correctamente",
  "order": {
    "items": [
      {"product": "manzanas", "quantity": 2, "unit": "kilos"}
    ]
  }
}
```

### Tool 2: `get_order_summary`

**Descripción**: Obtiene el resumen del pedido actual

**Parámetros**: Ninguno

**Respuesta**:
```json
{
  "items": [
    {"product": "manzanas", "quantity": 2, "unit": "kilos"},
    {"product": "tomates", "quantity": 1, "unit": "kilo"}
  ],
  "total_items": 2
}
```

### Tool 3: `confirm_order`

**Descripción**: Confirma y finaliza el pedido

**Parámetros**: Ninguno

**Respuesta**:
```json
{
  "order_id": "ORD-12345",
  "status": "confirmed",
  "timestamp": "2026-01-10T20:00:00Z"
}
```

---

## 🚀 Paso a Paso - Crear Agente con Playbooks

### 1. Crear Agente en Dialogflow CX

1. Ir a: https://dialogflow.cloud.google.com/cx/projects
2. Seleccionar tu proyecto GCP
3. Click **"Create agent"**
4. Configurar:
   ```
   Display name: FreshMarket Playbook Bot
   Default language: Spanish - es
   Time zone: (GMT-3:00) America/Buenos_Aires
   Location: global
   ```
5. **IMPORTANTE**: En "Agent type" seleccionar **"Generative AI Agent"**
6. Click **"Create"**

---

### 2. Habilitar Generative AI

1. En el agente, ir a **"Agent Settings"**
2. Tab **"Generative AI"**
3. **Enable generative AI features**: ✓
4. **Model**: Seleccionar `gemini-1.5-pro` (recomendado) o `gemini-1.5-flash` (más rápido)
5. Click **"Save"**

---

### 3. Crear Playbook

1. Menu lateral → **"Playbooks"**
2. Click **"+ Create"**
3. **Display name**: `Order Management Playbook`
4. **Description**: `Handles fruit and vegetable orders with generative AI`

5. **Instructions** (copiar el texto de arriba):
   ```
   You are a friendly virtual assistant for FreshMarket...
   [Copiar todas las instrucciones del playbook de arriba]
   ```

6. **Examples** (opcional pero recomendado):

   Agregar ejemplos de conversaciones:

   **Example 1**:
   ```
   User: hola
   Agent: ¡Hola! 👋 Bienvenido a FreshMarket. ¿Querés hacer un pedido?
   ```

   **Example 2**:
   ```
   User: quiero 2 kilos de manzanas
   Agent: Perfecto! Agregué 2 kilos de manzanas. ¿Querés algo más?
   ```

7. Click **"Save"**

---

### 4. Configurar Start Page (Entry Point)

1. Ir a **"Build"** → **"Default Start Flow"**
2. Click en **"Start"** page
3. En **"Entry fulfillment"**:
   - **Agent says**: Dejar vacío (el playbook se encarga)

4. **Add route**:
   - **Condition**: `true` (siempre)
   - **Transition**: Seleccionar **"Playbook: Order Management Playbook"**
   - Click **"Save"**

---

### 5. Configurar Tools (Opcional - Avanzado)

Si querés que el LLM llame funciones en tu backend:

1. En el Playbook, sección **"Tools"**
2. Click **"+ Add tool"**

**Tool: add_product_to_order**
```json
{
  "name": "add_product_to_order",
  "description": "Adds a product to the customer's order",
  "parameters": {
    "type": "object",
    "properties": {
      "product": {
        "type": "string",
        "description": "Product name (fruit or vegetable)"
      },
      "quantity": {
        "type": "number",
        "description": "Product quantity"
      },
      "unit": {
        "type": "string",
        "description": "Unit of measure (kilos, gramos, unidades)",
        "enum": ["kilos", "gramos", "unidades"]
      }
    },
    "required": ["product", "quantity"]
  }
}
```

3. **Webhook**: Configurar URL de tu backend (lo haremos después)

---

### 6. Probar en Simulator

1. Click **"Test Agent"** (esquina superior derecha)
2. Probar conversación:
   ```
   You: hola
   Bot: [Respuesta del LLM]

   You: quiero 2 kilos de manzanas y 1 kilo de tomates
   Bot: [LLM entiende y responde naturalmente]

   You: listo
   Bot: [Muestra resumen]
   ```

**Nota**: El LLM puede responder de formas ligeramente diferentes cada vez (no es determinístico)

---

### 7. Configurar Credenciales (igual que antes)

1. Crear Service Account en GCP
2. Asignar rol `Dialogflow API Client`
3. Descargar JSON key
4. Configurar `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./credentials/dialogflow-cx-key.json
DIALOGFLOW_PROJECT_ID=tu-proyecto-id
DIALOGFLOW_LOCATION=global
DIALOGFLOW_AGENT_ID=tu-agent-id
DIALOGFLOW_LANGUAGE_CODE=es
```

---

## 🔌 Integración con Backend (ya está lista!)

El código en [src/dialogflow-cx.js](../src/dialogflow-cx.js) **ya funciona con Playbooks** sin cambios!

El SDK de Dialogflow CX es el mismo, solo cambia la configuración en Console.

---

## ✨ Ventajas de Playbooks

### 1. **Entendimiento Natural**

❌ **Sin Playbooks**:
```
User: "dame dos kilos de tomate"
Bot: [No entiende porque entrenaste "quiero 2 kilos de tomates"]
```

✅ **Con Playbooks**:
```
User: "dame dos kilos de tomate"
Bot: "Perfecto! Agregué 2 kilos de tomates..."
[El LLM entiende la variación naturalmente]
```

### 2. **Multi-intent en un mensaje**

❌ **Sin Playbooks**:
```
User: "quiero 2 kilos de manzanas y 1 kilo de tomates"
Bot: [Solo captura el primer producto]
```

✅ **Con Playbooks**:
```
User: "quiero 2 kilos de manzanas y 1 kilo de tomates"
Bot: "Perfecto! Agregué:
- 2 kilos de manzanas
- 1 kilo de tomates
¿Querés algo más?"
```

### 3. **Conversación Contextual**

✅ **Con Playbooks**:
```
User: "hola"
Bot: "¡Hola! ¿Querés hacer un pedido?"

User: "sí, manzanas"
Bot: "¿Cuántos kilos de manzanas?"

User: "dos"
Bot: "Perfecto! 2 kilos de manzanas. ¿Algo más?"
```

El LLM mantiene contexto automáticamente.

---

## 🎛️ Configuración Avanzada

### Generative Settings

En **Agent Settings → Generative AI**:

```
Temperature: 0.3
  ↑ Más bajo = más consistente
  ↑ Más alto = más creativo

Max output tokens: 256
  ↑ Respuestas más largas si es necesario

Top-p: 0.95
  ↑ Diversidad de respuestas
```

**Recomendado para pedidos**:
- Temperature: `0.3` (consistente)
- Max tokens: `200`

---

## 💰 Costos

**Dialogflow CX con Generative AI**:
- **Requests**: ~$0.007 por request (vs $0.002 tradicional)
- **Tokens**: Se cobra por tokens procesados

**Para desarrollo**: Gratis dentro del free tier

---

## 🧪 Testing Checklist

- [ ] El bot saluda naturalmente
- [ ] Entiende variaciones ("dame", "quiero", "necesito")
- [ ] Captura múltiples productos en un mensaje
- [ ] Mantiene contexto entre mensajes
- [ ] Genera resumen del pedido
- [ ] Confirma pedido correctamente
- [ ] Responde en español consistentemente
- [ ] Usa emojis apropiadamente

---

## 🔄 Migración del enfoque anterior

**No es necesario crear**:
- ❌ Intents con training phrases
- ❌ Entities personalizadas (@product, @unit)
- ❌ Múltiples flows (Greeting, Order, Confirmation)
- ❌ Pages y routes complejas

**Solo necesitas**:
- ✅ 1 Playbook con instrucciones claras
- ✅ Configurar generative AI
- ✅ Probar y ajustar las instrucciones

---

## 📝 Ejemplo de Instrucciones Mejoradas

Podés hacer las instrucciones aún más específicas:

```markdown
## Product Validation:
- If customer asks for a product not in the list, say:
  "Lo siento, no tenemos [producto] disponible. Nuestros productos son: [lista]"

## Quantity Handling:
- If customer doesn't specify quantity, ask: "¿Cuánto querés de [producto]?"
- Accept natural numbers: "dos", "tres" → convert to 2, 3
- Default unit is "kilos"

## Order Summary Format:
Always format the summary like this:
📋 Resumen de tu pedido:
1. [quantity] [unit] de [product]
2. [quantity] [unit] de [product]

Total de items: [count]

¿Confirmás el pedido?

## Order Confirmation:
Generate order ID: ORD-[5 random digits]
Say: "¡Pedido confirmado! 🎉 Tu número de pedido es #[order_id]..."
```

---

## 🚀 ¿Qué hacer ahora?

1. ✅ Seguir esta guía para crear el agente con Playbooks
2. ✅ Usar las mismas credenciales y código backend (ya compatible)
3. ✅ Probar en el simulator de Dialogflow
4. ✅ Probar vía WhatsApp

**Tiempo estimado**: 30 minutos (mucho más rápido que flows tradicionales)

---

## 📚 Referencias

- [Dialogflow CX Playbooks Docs](https://cloud.google.com/dialogflow/cx/docs/concept/playbook)
- [Generative AI in Dialogflow](https://cloud.google.com/dialogflow/cx/docs/concept/generative)
- [Gemini Models](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
