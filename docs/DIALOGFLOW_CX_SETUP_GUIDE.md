# 🛠️ Guía de Configuración - Dialogflow CX Agent

## Paso a Paso para crear el Agente de Pedidos

---

## 📍 Paso 1: Crear el Agente

1. Ir a: https://dialogflow.cloud.google.com/cx/projects

2. Seleccionar tu proyecto GCP

3. Click en **"Create agent"**

4. Configurar:
   ```
   Display name: FreshMarket Bot
   Default language: Spanish - es
   Default time zone: (GMT-3:00) America/Buenos_Aires
   Location: global
   ```

5. Click **"Create"**

---

## 📍 Paso 2: Crear Custom Entities

### Entity 1: @product

1. Menu lateral → **Manage** → **Entity Types**
2. Click **"+ Create"**
3. Configurar:
   ```
   Display name: product
   ```

4. Agregar valores (frutas):
   ```
   Value               | Synonyms
   ---------------------|----------------------------------
   manzana             | manzanas, apple
   banana              | bananas, plátano, plátanos
   naranja             | naranjas, orange
   pera                | peras
   frutilla            | frutillas, fresa, fresas
   uva                 | uvas
   sandía              | sandias
   melón               | melones
   durazno             | duraznos, melocotón
   kiwi                | kiwis
   ```

5. Agregar valores (verduras):
   ```
   Value               | Synonyms
   ---------------------|----------------------------------
   tomate              | tomates
   lechuga             | lechugas
   zanahoria           | zanahorias
   papa                | papas, patata, patatas
   cebolla             | cebollas
   ajo                 | ajos
   espinaca            | espinacas
   brócoli             | brocoli
   calabaza            | calabazas, zapallo
   pimiento            | pimientos, morrón, morrones
   ```

6. Click **"Save"**

### Entity 2: @unit

1. Click **"+ Create"** nuevamente
2. Configurar:
   ```
   Display name: unit
   ```

3. Agregar valores:
   ```
   Value               | Synonyms
   ---------------------|----------------------------------
   kilo                | kilos, kg, kilogramo
   gramo               | gramos, gr, g
   unidad              | unidades, un
   ```

4. Click **"Save"**

---

## 📍 Paso 3: Crear Intents

### Intent 1: greeting

1. Menu lateral → **Manage** → **Intents**
2. Click **"+ Create"**
3. Display name: `greeting`
4. Training phrases (agregar ~10):
   ```
   hola
   buenos días
   buenas tardes
   buenas noches
   hey
   hola qué tal
   hola cómo estás
   buenas
   saludos
   qué tal
   ```
5. Click **"Save"**

### Intent 2: start_order

1. Click **"+ Create"**
2. Display name: `start_order`
3. Training phrases:
   ```
   sí
   si
   quiero hacer un pedido
   hacer pedido
   sí quiero ordenar
   comprar
   quiero comprar
   me gustaría pedir
   ```
4. Click **"Save"**

### Intent 3: add_product (CON PARÁMETROS)

1. Click **"+ Create"**
2. Display name: `add_product`
3. Training phrases (marcar parámetros):

   **IMPORTANTE**: Cuando escribas las frases, seleccioná las palabras para asignarles entidades

   ```
   quiero 2 kilos de manzanas
   └─────┘ └──────┘ └────────┘
     ^       ^         ^
     |       |         |
   (texto) (quantity) (product)

   Anotar como:
   quiero @sys.number:quantity @unit:unit de @product:product
   ```

   **Frases completas**:
   ```
   quiero [2]{quantity} [kilos]{unit} de [manzanas]{product}
   dame [1]{quantity} [kilo]{unit} de [tomates]{product}
   [3]{quantity} [kilos]{unit} de [naranjas]{product}
   agregar [500]{quantity} [gramos]{unit} de [espinaca]{product}
   necesito [bananas]{product}
   [lechuga]{product} por favor
   quiero [2]{quantity} [kilos]{unit} de [manzanas]{product} y [1]{quantity} [kilo]{unit} de [tomates]{product}
   ```

4. **Parameters** (configurar debajo de training phrases):

   | Parameter | Entity | Required | Default value | Prompts |
   |-----------|--------|----------|---------------|---------|
   | `product` | `@product` | ✓ | - | "¿Qué producto querés?" |
   | `quantity` | `@sys.number` | ✓ | - | "¿Cuánto querés?" |
   | `unit` | `@unit` | ✗ | `kilo` | - |

5. Click **"Save"**

### Intent 4: add_more

1. Click **"+ Create"**
2. Display name: `add_more`
3. Training phrases:
   ```
   sí
   sí quiero agregar más
   agregar más
   algo más
   otro producto
   también
   ```
4. Click **"Save"**

### Intent 5: finish_order

1. Click **"+ Create"**
2. Display name: `finish_order`
3. Training phrases:
   ```
   no
   nada más
   eso es todo
   terminar
   listo
   confirmar
   ya está
   eso sería todo
   ```
4. Click **"Save"**

### Intent 6: confirm_yes

1. Click **"+ Create"**
2. Display name: `confirm_yes`
3. Training phrases:
   ```
   sí
   confirmar
   está bien
   perfecto
   adelante
   ok
   dale
   ```
4. Click **"Save"**

### Intent 7: confirm_no

1. Click **"+ Create"**
2. Display name: `confirm_no`
3. Training phrases:
   ```
   no
   cambiar
   modificar
   cancelar
   volver
   ```
4. Click **"Save"**

---

## 📍 Paso 4: Crear Flows y Pages

### Flow 1: Greeting Flow

1. Menu lateral → **Build** → **Flows**
2. Click **"+ Create"**
3. Display name: `Greeting Flow`
4. Click **"Save"**

5. **Crear Page: Welcome**
   - Dentro de Greeting Flow, click **"+"** en Pages
   - Display name: `Welcome`
   - **Entry fulfillment**:
     - Click en **"Welcome"** → **Entry fulfillment**
     - Agent says: `¡Hola! 👋 Bienvenido a FreshMarket. ¿Querés hacer un pedido de frutas y verduras?`
   - **Add route**:
     - Intent: `greeting`
     - Fulfillment: `¡Hola! 😊 ¿Querés hacer un pedido?`
   - **Add route**:
     - Intent: `start_order`
     - Transition: `Order Flow` (lo crearemos después)

### Flow 2: Order Flow

1. Click **"+ Create"**
2. Display name: `Order Flow`
3. Click **"Save"**

4. **Crear Page: Collect Products**
   - Click **"+"** en Pages
   - Display name: `Collect Products`
   - **Entry fulfillment**:
     - `Perfecto! ¿Qué te gustaría pedir? Tenemos frutas y verduras frescas 🥬🍎`

   - **Add route 1** (agregar producto):
     - Intent: `add_product`
     - Parameter presets:
       - `$session.params.order_items` = `$session.params.order_items + [{product: $intent.params.product, quantity: $intent.params.quantity, unit: $intent.params.unit}]`
     - Fulfillment: `Perfecto! Agregué $intent.params.quantity $intent.params.unit de $intent.params.product. ¿Querés agregar algo más?`
     - Transition: `Collect Products` (mismo page, loop)

   - **Add route 2** (terminar):
     - Intent: `finish_order`
     - Transition: `Confirmation Flow`

### Flow 3: Confirmation Flow

1. Click **"+ Create"**
2. Display name: `Confirmation Flow`
3. Click **"Save"**

4. **Crear Page: Review Order**
   - Click **"+"** en Pages
   - Display name: `Review Order`
   - **Entry fulfillment** (usar webhook - lo configuraremos después):
     - Por ahora: `📋 Tu pedido está listo. ¿Confirmás?`

   - **Add route 1**:
     - Intent: `confirm_yes`
     - Transition: `End Flow`

   - **Add route 2**:
     - Intent: `confirm_no`
     - Transition: `Order Flow`

### Flow 4: End Flow

1. Click **"+ Create"**
2. Display name: `End Flow`
3. Click **"Save"**

4. **Crear Page: Order Confirmed**
   - Click **"+"** en Pages
   - Display name: `Order Confirmed`
   - **Entry fulfillment**:
     - `¡Pedido confirmado! 🎉 Gracias por tu compra. Te contactaremos pronto.`
   - **Add route**:
     - Condition: `true`
     - End session: ✓

---

## 📍 Paso 5: Conectar Default Start Flow

1. Ir a **Default Start Flow**
2. Click en **Start** page
3. **Add route**:
   - Condition: `true`
   - Transition: `Greeting Flow`

---

## 📍 Paso 6: Probar en el Simulator

1. Click en **"Test Agent"** (esquina superior derecha)
2. Probar conversación:
   ```
   You: hola
   Bot: ¡Hola! 👋 Bienvenido...

   You: sí
   Bot: Perfecto! ¿Qué te gustaría pedir?

   You: quiero 2 kilos de manzanas
   Bot: Perfecto! Agregué 2 kilos de manzanas...

   You: no, eso es todo
   Bot: 📋 Tu pedido está listo...

   You: sí
   Bot: ¡Pedido confirmado! 🎉
   ```

---

## 📍 Paso 7: Obtener Credenciales

### Crear Service Account

1. Ir a: https://console.cloud.google.com/iam-admin/serviceaccounts

2. Click **"+ Create Service Account"**

3. Configurar:
   ```
   Service account name: dialogflow-cx-client
   Description: Service account for WhatsApp bot integration
   ```

4. Click **"Create and continue"**

5. **Grant role**:
   - Role: `Dialogflow API Client`
   - Click **"Continue"** → **"Done"**

6. Click en el service account creado

7. Tab **"Keys"** → **"Add Key"** → **"Create new key"**

8. Type: **JSON**

9. Click **"Create"** (se descarga el archivo)

10. **Mover el archivo**:
    ```bash
    # Crear carpeta credentials si no existe
    mkdir credentials

    # Mover y renombrar
    mv ~/Downloads/tu-proyecto-xxxxx.json credentials/dialogflow-cx-key.json
    ```

---

## 📍 Paso 8: Configurar Variables de Entorno

1. Editar `.env`:
   ```env
   PORT=3001

   # Dialogflow CX
   GOOGLE_APPLICATION_CREDENTIALS=./credentials/dialogflow-cx-key.json
   DIALOGFLOW_PROJECT_ID=tu-proyecto-id
   DIALOGFLOW_LOCATION=global
   DIALOGFLOW_AGENT_ID=tu-agent-id
   DIALOGFLOW_LANGUAGE_CODE=es
   ```

2. **Obtener IDs**:
   - **Project ID**: En GCP Console, arriba a la izquierda
   - **Agent ID**: En Dialogflow CX, Settings del agent → copiar ID
   - **Location**: `global` (o la región que elegiste)

---

## ✅ Checklist Final

- [ ] Agente creado en Dialogflow CX
- [ ] Entities `@product` y `@unit` creadas
- [ ] 7 intents creados con training phrases
- [ ] 4 flows creados (Greeting, Order, Confirmation, End)
- [ ] Pages configuradas con fulfillments
- [ ] Routes conectadas entre flows
- [ ] Agente probado en simulator
- [ ] Service account creado
- [ ] JSON key descargado
- [ ] Variables de entorno configuradas

---

## 🚀 Siguiente Paso

Una vez completado esto, podemos integrar el agente con el backend de WhatsApp!

**Archivo a crear/modificar**: `src/dialogflow-cx.js`
