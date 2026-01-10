# 🤖 Dialogflow CX - Diseño del Agente de Pedidos

## 🎯 Objetivo

Crear un agente conversacional capaz de:
1. Saludar al cliente
2. Tomar pedidos de frutas y verduras
3. Confirmar cantidades y productos
4. Finalizar el pedido

---

## 🏗️ Arquitectura del Agente CX

### Flows (Flujos)

```
Default Start Flow
  ↓
Greeting Flow (Saludo)
  ↓
Order Flow (Tomar Pedido)
  ↓
Confirmation Flow (Confirmar)
  ↓
End Flow (Finalizar)
```

---

## 📋 Estructura Detallada

### **Flow 1: Default Start Flow**

**Purpose**: Punto de entrada

**Pages**:
- `Start Page` (automático)
  - Transition → `Greeting Flow`

---

### **Flow 2: Greeting Flow**

**Purpose**: Saludar al cliente y dar bienvenida

#### **Page: Welcome**

**Entry Fulfillment**:
```
"¡Hola! 👋 Bienvenido a FreshMarket. Soy tu asistente virtual para pedidos de frutas y verduras frescas."
```

**Intent: greeting**
- Training phrases:
  - "hola"
  - "buenos días"
  - "buenas tardes"
  - "hey"
  - "hola qué tal"

**Response**:
```
"¡Hola! 😊 ¿Querés hacer un pedido de frutas y verduras?"
```

**Intent: start_order**
- Training phrases:
  - "sí"
  - "quiero hacer un pedido"
  - "sí, quiero ordenar"
  - "hacer pedido"
  - "comprar"

**Transition**: → `Order Flow`

---

### **Flow 3: Order Flow**

**Purpose**: Recolectar productos y cantidades

#### **Page: Collect Products**

**Entry Fulfillment**:
```
"Perfecto! ¿Qué te gustaría pedir? Tenemos frutas y verduras frescas del día 🥬🍎"
```

#### **Intent: add_product**

**Training phrases**:
```
- quiero [2] kilos de [manzanas]
- dame [1] kilo de [tomates]
- [3] kilos de [naranjas]
- agregar [500] gramos de [espinaca]
- necesito [bananas]
- [lechuga] por favor
```

**Parameters**:

| Parameter | Entity | Required | Prompts |
|-----------|--------|----------|---------|
| `product` | `@product` (custom) | ✓ | "¿Qué producto querés?" |
| `quantity` | `@sys.number` | ✓ | "¿Cuántos kilos?" |
| `unit` | `@unit` (custom) | ✗ | (default: "kilo") |

**Custom Entity: @product**
```
Frutas:
- manzana, manzanas
- banana, bananas, plátano
- naranja, naranjas
- pera, peras
- frutilla, frutillas, fresa
- uva, uvas
- sandía, sandias
- melón, melones
- durazno, duraznos
- kiwi, kiwis

Verduras:
- tomate, tomates
- lechuga, lechugas
- zanahoria, zanahorias
- papa, papas, patata
- cebolla, cebollas
- ajo, ajos
- espinaca, espinacas
- brócoli
- calabaza, calabazas
- pimiento, pimientos, morrón
```

**Custom Entity: @unit**
```
- kilo, kilos, kg
- gramo, gramos, gr
- unidad, unidades
```

**Fulfillment** (cuando se completan parámetros):
```
"Perfecto! Agregué $quantity $unit de $product a tu pedido. ¿Querés agregar algo más?"
```

**Session Parameters** (almacenar):
```javascript
{
  order_items: [
    {product: "manzanas", quantity: 2, unit: "kilos"},
    {product: "tomates", quantity: 1, unit: "kilo"}
  ],
  total_items: 2
}
```

---

#### **Intent: add_more**

**Training phrases**:
```
- sí, quiero agregar más
- sí, algo más
- agregar otro producto
- también quiero [producto]
```

**Transition**: Loop to `Collect Products` page

---

#### **Intent: finish_order**

**Training phrases**:
```
- no, eso es todo
- nada más
- terminar pedido
- listo
- confirmar pedido
- eso sería todo
```

**Transition**: → `Confirmation Flow`

---

### **Flow 4: Confirmation Flow**

**Purpose**: Revisar y confirmar el pedido

#### **Page: Review Order**

**Entry Fulfillment**:
```javascript
// Generar resumen dinámico
const items = session.parameters.order_items;
let summary = "📋 Resumen de tu pedido:\n\n";

items.forEach((item, index) => {
  summary += `${index + 1}. ${item.quantity} ${item.unit} de ${item.product}\n`;
});

summary += "\n¿Confirmás el pedido?";

return summary;
```

**Example Output**:
```
📋 Resumen de tu pedido:

1. 2 kilos de manzanas
2. 1 kilo de tomates
3. 500 gramos de espinaca

¿Confirmás el pedido?
```

**Intent: confirm_yes**

**Training phrases**:
```
- sí
- confirmar
- está bien
- perfecto
- adelante
```

**Transition**: → `End Flow` (Success)

**Intent: confirm_no / modify_order**

**Training phrases**:
```
- no
- cambiar
- modificar
- quitar algo
- agregar más
```

**Transition**: → `Order Flow` (back to collect products)

---

### **Flow 5: End Flow**

**Purpose**: Finalizar conversación

#### **Page: Order Confirmed**

**Entry Fulfillment**:
```
"¡Pedido confirmado! 🎉

Tu pedido será procesado y te contactaremos pronto para coordinar la entrega.

Número de pedido: #${session.parameters.order_id}

¡Gracias por tu compra! 😊"
```

#### **Page: Order Cancelled**

**Entry Fulfillment**:
```
"Pedido cancelado. Si querés hacer un nuevo pedido, escribí 'hola'. ¡Hasta pronto! 👋"
```

---

## 🎨 Conversation Example

```
Bot: ¡Hola! 👋 Bienvenido a FreshMarket. Soy tu asistente virtual.

User: hola

Bot: ¡Hola! 😊 ¿Querés hacer un pedido de frutas y verduras?

User: sí

Bot: Perfecto! ¿Qué te gustaría pedir? Tenemos frutas y verduras frescas del día 🥬🍎

User: quiero 2 kilos de manzanas

Bot: Perfecto! Agregué 2 kilos de manzanas a tu pedido. ¿Querés agregar algo más?

User: sí, 1 kilo de tomates

Bot: Perfecto! Agregué 1 kilo de tomates a tu pedido. ¿Querés agregar algo más?

User: también 500 gramos de espinaca

Bot: Perfecto! Agregué 500 gramos de espinaca a tu pedido. ¿Querés agregar algo más?

User: no, eso es todo

Bot: 📋 Resumen de tu pedido:

1. 2 kilos de manzanas
2. 1 kilo de tomates
3. 500 gramos de espinaca

¿Confirmás el pedido?

User: sí

Bot: ¡Pedido confirmado! 🎉

Tu pedido será procesado y te contactaremos pronto para coordinar la entrega.

Número de pedido: #12345

¡Gracias por tu compra! 😊
```

---

## 🔧 Configuration Summary

### Flows to Create:
1. ✅ Default Start Flow (pre-exists)
2. Greeting Flow
3. Order Flow
4. Confirmation Flow
5. End Flow

### Intents to Create:
1. `greeting`
2. `start_order`
3. `add_product` (with parameters)
4. `add_more`
5. `finish_order`
6. `confirm_yes`
7. `confirm_no`

### Custom Entities:
1. `@product` (frutas y verduras)
2. `@unit` (kilos, gramos, unidades)

### Session Parameters:
```javascript
{
  order_items: Array<{
    product: string,
    quantity: number,
    unit: string
  }>,
  total_items: number,
  order_id: string
}
```

---

## 🚀 Next Steps

### 1. Create Agent in Dialogflow CX Console

1. Go to: https://dialogflow.cloud.google.com/cx/
2. Create new agent:
   - **Name**: `FreshMarket Bot`
   - **Location**: `global` or your preferred region
   - **Language**: `Spanish - es`
   - **Time Zone**: `(GMT-3:00) America/Buenos_Aires`

### 2. Create Custom Entities

Navigate to **Manage → Entity Types** and create `@product` and `@unit`

### 3. Create Flows and Pages

Follow the structure above to create each flow and page

### 4. Create Intents

Add training phrases and parameter extraction

### 5. Test in Simulator

Use the built-in simulator to test the conversation flow

### 6. Get Credentials

1. Create Service Account
2. Assign role: `roles/dialogflow.client`
3. Download JSON key
4. Save as `credentials/dialogflow-cx-key.json`

### 7. Integrate with Backend

Update `src/index.js` to use Dialogflow CX SDK instead of simple responses

---

## 📊 Success Metrics

- [ ] Agent responds to greetings
- [ ] Agent can collect multiple products
- [ ] Agent extracts quantity and unit correctly
- [ ] Agent generates order summary
- [ ] Agent confirms and saves order
- [ ] Full conversation works via WhatsApp

---

## 🔗 Resources

- [Dialogflow CX Docs](https://cloud.google.com/dialogflow/cx/docs)
- [Build a CX Agent](https://cloud.google.com/dialogflow/cx/docs/quick/build-agent)
- [Session Parameters](https://cloud.google.com/dialogflow/cx/docs/concept/parameter)
