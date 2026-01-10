# 🎮 Próximos Pasos - Playbooks (Generative AI)

## 🌟 Enfoque Recomendado: Playbooks

En lugar de usar flows tradicionales determinísticos, vamos a usar **Playbooks** con **Generative AI** (LLM).

### ✅ Ventajas:

- **Más rápido**: 30 min vs 2 horas setup
- **Más natural**: Entiende variaciones automáticamente
- **Menos mantenimiento**: No necesitás training phrases
- **Más flexible**: Conversaciones fluidas

---

## 📋 To-Do Simple (Playbooks)

### 1. Crear Agente Generativo ⏱️ 10 min

1. Ir a: https://dialogflow.cloud.google.com/cx/projects
2. Seleccionar tu proyecto GCP
3. Click **"Create agent"**:
   ```
   Display name: FreshMarket Playbook Bot
   Language: Spanish - es
   Time zone: GMT-3
   Agent type: Generative AI Agent ← IMPORTANTE
   ```
4. Click **"Create"**

**Checklist**:
- [ ] Agente creado
- [ ] Tipo: "Generative AI Agent"

---

### 2. Habilitar Generative AI ⏱️ 2 min

1. **Agent Settings** → **Generative AI**
2. **Enable generative AI features**: ✓
3. **Model**: `gemini-1.5-pro`
4. **Temperature**: `0.3`
5. Click **"Save"**

**Checklist**:
- [ ] Generative AI habilitado
- [ ] Model seleccionado

---

### 3. Crear Playbook ⏱️ 10 min

1. Menu → **"Playbooks"** → **"+ Create"**
2. **Display name**: `Order Management Playbook`
3. **Instructions**: Copiar de [DIALOGFLOW_PLAYBOOKS_GUIDE.md](DIALOGFLOW_PLAYBOOKS_GUIDE.md#playbook-order-management)

   ```
   You are a friendly virtual assistant for FreshMarket...
   [Copiar instrucciones completas]
   ```

4. **Examples** (opcional):
   ```
   User: hola
   Agent: ¡Hola! 👋 Bienvenido a FreshMarket...
   ```

5. Click **"Save"**

**Checklist**:
- [ ] Playbook creado
- [ ] Instrucciones copiadas
- [ ] Guardado

---

### 4. Configurar Entry Point ⏱️ 2 min

1. **Build** → **Default Start Flow**
2. Click **"Start"** page
3. **Add route**:
   - Condition: `true`
   - Transition: **"Playbook: Order Management Playbook"**
4. Click **"Save"**

**Checklist**:
- [ ] Route configurada
- [ ] Apunta al playbook

---

### 5. Probar en Simulator ⏱️ 5 min

1. Click **"Test Agent"**
2. Probar:
   ```
   You: hola
   Bot: [Respuesta generativa]

   You: quiero 2 kilos de manzanas y 1 de tomates
   Bot: [Debería entender ambos productos]

   You: listo
   Bot: [Resumen del pedido]
   ```

**Checklist**:
- [ ] Bot responde a saludos
- [ ] Entiende pedidos con múltiples productos
- [ ] Genera resumen
- [ ] Responde en español

---

### 6. Configurar Credenciales ⏱️ 10 min

1. Ir a: https://console.cloud.google.com/iam-admin/serviceaccounts
2. **+ Create Service Account**:
   ```
   Name: dialogflow-cx-client
   Role: Dialogflow API Client
   ```
3. **Keys** → **Add Key** → **JSON**
4. Mover archivo a:
   ```bash
   mkdir credentials
   mv ~/Downloads/tu-key.json credentials/dialogflow-cx-key.json
   ```

5. Editar `.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./credentials/dialogflow-cx-key.json
   DIALOGFLOW_PROJECT_ID=tu-proyecto-id
   DIALOGFLOW_LOCATION=global
   DIALOGFLOW_AGENT_ID=tu-agent-id
   DIALOGFLOW_LANGUAGE_CODE=es
   ```

**Obtener IDs**:
- Project ID: GCP Console (arriba a la izquierda)
- Agent ID: Dialogflow CX → Agent Settings → copiar ID

**Checklist**:
- [ ] Service Account creado
- [ ] JSON key descargado
- [ ] Archivo en `/credentials`
- [ ] Variables en `.env` configuradas

---

### 7. Reiniciar Backend ⏱️ 1 min

```bash
# Detener servidor (Ctrl+C en terminal de npm start)
npm start
```

**Verificar**:
```
✅ Dialogflow CX: Configurado
```

**Checklist**:
- [ ] Servidor reiniciado
- [ ] Mensaje de configuración OK

---

### 8. Probar en WhatsApp ⏱️ 5 min

Enviar mensajes de prueba:

```
You: hola
Bot: [Saludo del playbook]

You: quiero 2 kilos de manzanas
Bot: [Confirma manzanas]

You: también 1 kilo de tomates
Bot: [Confirma tomates]

You: listo
Bot: [Resumen]

You: sí
Bot: [Confirmación con número de orden]
```

**Verificar logs**:
```
🤖 Dialogflow CX Request:
   Text: quiero 2 kilos de manzanas

✅ Dialogflow CX Response:
   Response: Perfecto! Agregué 2 kilos...
```

**Checklist**:
- [ ] Conversación funciona end-to-end
- [ ] Bot entiende variaciones naturales
- [ ] Logs muestran requests/responses
- [ ] Todo en español

---

## 🎯 Total Time: ~45 minutos

**Mucho más rápido que flows tradicionales!**

---

## ✨ Ventajas que verás inmediatamente

### 1. Entiende variaciones naturales

```
✅ "quiero 2 kilos de manzanas"
✅ "dame dos kilos de manzana"
✅ "necesito manzanas, 2 kilos"
✅ "poneme 2kg de manzana"
```

### 2. Multi-producto en un mensaje

```
You: "quiero 2 kilos de manzanas, 1 de tomates y 500 gramos de espinaca"
Bot: [Entiende los 3 productos correctamente]
```

### 3. Conversación fluida

```
User: "hola"
Bot: "¿Querés hacer un pedido?"

User: "manzanas"
Bot: "¿Cuántos kilos?"

User: "dos"
Bot: "Perfecto! 2 kilos de manzanas..."
```

---

## 🔧 Ajustes Opcionales

### Modificar el tono del bot

Editar instrucciones del playbook:

```markdown
## Tone:
- Be very enthusiastic and use lots of emojis 🎉
- Or: Be professional and concise
- Or: Be casual and friendly like a neighbor
```

### Agregar validaciones

```markdown
## Validation Rules:
- Minimum order: 500 gramos
- Maximum quantity per product: 10 kilos
- If customer requests more, say: "Por ahora solo podemos enviar hasta 10 kilos..."
```

### Personalizar mensajes

```markdown
## Custom Messages:
- Order confirmation: "¡Genial! Tu pedido #[ID] está confirmado..."
- Out of stock: "Ups, [producto] no está disponible hoy..."
```

---

## 🐛 Troubleshooting Específico para Playbooks

### El bot responde en inglés

**Solución**:
- Agregar en instrucciones: `ALWAYS respond in Spanish`
- Configurar `DIALOGFLOW_LANGUAGE_CODE=es` en `.env`

### Respuestas muy largas

**Solución**:
- Reducir `Max output tokens` a 150
- Agregar: `Keep responses concise (max 2 sentences)`

### No mantiene contexto

**Solución**:
- Verificar que estás usando el mismo `sessionId` (número de WhatsApp)
- Agregar: `Remember all products mentioned in this conversation`

---

## 📊 Comparación: Playbooks vs Flows

| Tarea | Flows Tradicionales | Playbooks |
|-------|---------------------|-----------|
| Setup inicial | 2+ horas | 45 min |
| Crear intents | 7 intents × 10 frases = 70 frases | 0 frases |
| Crear entities | 2 entities × 20 valores = 40 valores | 0 |
| Crear flows | 4 flows + pages + routes | 1 playbook |
| Entiende variaciones | Solo las entrenadas | Todas naturalmente |
| Mantenimiento | Alto | Bajo |

---

## 🎯 Éxito = Esta conversación funcionando

```
User: hola
Bot: ¡Hola! 👋 Bienvenido a FreshMarket. ¿Querés hacer un pedido?

User: sí, dame 2 kilos de manzanas y medio kilo de tomates

Bot: Perfecto! Agregué a tu pedido:
- 2 kilos de manzanas
- 0.5 kilos de tomates
¿Querés algo más?

User: no, confirmá

Bot: 📋 Resumen de tu pedido:
1. 2 kilos de manzanas
2. 0.5 kilos de tomates

¿Confirmás el pedido?

User: dale

Bot: ¡Pedido confirmado! 🎉
Número de pedido: #ORD-87492
Te contactaremos pronto para coordinar la entrega.
¡Gracias por tu compra! 😊
```

**¡Fase 2 completada con Playbooks!** 🎮

---

## 📚 Recursos

- **Guía completa**: [DIALOGFLOW_PLAYBOOKS_GUIDE.md](DIALOGFLOW_PLAYBOOKS_GUIDE.md)
- **Documentación oficial**: [Dialogflow CX Playbooks](https://cloud.google.com/dialogflow/cx/docs/concept/playbook)
- **TODO del proyecto**: [TODO.md](../TODO.md)
