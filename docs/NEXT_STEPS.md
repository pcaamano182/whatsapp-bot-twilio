# 🎯 Próximos Pasos - Integración Dialogflow CX

## ✅ Completado

- [x] SDK de Dialogflow CX instalado
- [x] Módulo `dialogflow-cx.js` creado
- [x] Webhook actualizado para usar Dialogflow CX
- [x] Documentación completa del agente
- [x] Guía paso a paso de configuración
- [x] Código subido a GitHub

---

## 📋 To-Do (en orden)

### 1. Crear Agente en Dialogflow CX Console

**Tiempo estimado**: 1 hora

📖 **Seguir**: [docs/DIALOGFLOW_CX_SETUP_GUIDE.md](DIALOGFLOW_CX_SETUP_GUIDE.md)

**Pasos**:
1. Ir a https://dialogflow.cloud.google.com/cx/projects
2. Crear agente "FreshMarket Bot"
3. Crear entities: `@product`, `@unit`
4. Crear 7 intents con training phrases
5. Crear 4 flows: Greeting, Order, Confirmation, End
6. Configurar pages y routes
7. Probar en simulator

**Checklist**:
- [ ] Agente creado
- [ ] Entities creadas (@product, @unit)
- [ ] Intents creados (7 intents)
- [ ] Flows configurados (4 flows)
- [ ] Conversación probada en simulator

---

### 2. Configurar Credenciales GCP

**Tiempo estimado**: 15 minutos

**Pasos**:
1. Crear Service Account en GCP
2. Asignar rol `Dialogflow API Client`
3. Descargar JSON key
4. Guardar en `credentials/dialogflow-cx-key.json`

**Checklist**:
- [ ] Service Account creado
- [ ] Rol asignado
- [ ] JSON key descargado
- [ ] Archivo guardado en `/credentials`

---

### 3. Configurar Variables de Entorno

**Tiempo estimado**: 5 minutos

**Editar archivo** `.env`:

```env
PORT=3001

# Dialogflow CX
GOOGLE_APPLICATION_CREDENTIALS=./credentials/dialogflow-cx-key.json
DIALOGFLOW_PROJECT_ID=tu-proyecto-id-aqui
DIALOGFLOW_LOCATION=global
DIALOGFLOW_AGENT_ID=tu-agent-id-aqui
DIALOGFLOW_LANGUAGE_CODE=es
```

**Obtener IDs**:
- `DIALOGFLOW_PROJECT_ID`: GCP Console → arriba a la izquierda
- `DIALOGFLOW_AGENT_ID`: Dialogflow CX → Agent Settings → copiar ID
- `DIALOGFLOW_LOCATION`: `global` (o la región que elegiste)

**Checklist**:
- [ ] Variables agregadas a `.env`
- [ ] Project ID correcto
- [ ] Agent ID correcto
- [ ] Path al JSON key correcto

---

### 4. Reiniciar Backend

**Tiempo estimado**: 2 minutos

```bash
# Detener servidor actual (Ctrl+C)

# Reiniciar
npm start
```

**Verificar**:
```
✅ Dialogflow CX: Configurado
```

Si ves:
```
⚠️  Dialogflow CX: No configurado (usando lógica simple)
```

→ Revisar variables de entorno y path al JSON key

**Checklist**:
- [ ] Servidor reiniciado
- [ ] Mensaje "Dialogflow CX: Configurado" visible
- [ ] Sin errores en consola

---

### 5. Probar Conversación Completa vía WhatsApp

**Tiempo estimado**: 10 minutos

**Conversación de prueba**:

```
You: hola
Bot: [Respuesta del agente CX]

You: sí
Bot: Perfecto! ¿Qué te gustaría pedir?

You: quiero 2 kilos de manzanas
Bot: Perfecto! Agregué 2 kilos de manzanas...

You: 1 kilo de tomates
Bot: Perfecto! Agregué 1 kilo de tomates...

You: no, eso es todo
Bot: 📋 Resumen de tu pedido...

You: sí
Bot: ¡Pedido confirmado! 🎉
```

**Verificar en logs del backend**:
```
🤖 Dialogflow CX Request:
   Session: whatsapp:+59895262076
   Text: quiero 2 kilos de manzanas

✅ Dialogflow CX Response:
   Intent: add_product
   Confidence: 0.95
```

**Checklist**:
- [ ] Saludo funciona
- [ ] Agente detecta productos
- [ ] Agente extrae cantidades
- [ ] Agente mantiene contexto (múltiples productos)
- [ ] Confirmación funciona
- [ ] Intents aparecen en logs

---

### 6. Ajustar y Mejorar

**Iteración continua**

**Si el bot no entiende**:
1. Revisar logs para ver qué intent detectó
2. Agregar training phrases similares en Dialogflow CX
3. Re-entrenar y probar nuevamente

**Mejoras opcionales**:
- [ ] Agregar más productos a entity `@product`
- [ ] Manejar errores (producto no disponible)
- [ ] Agregar validación de cantidades
- [ ] Mejorar mensajes de confirmación
- [ ] Agregar opción de cancelar pedido
- [ ] Guardar pedidos en base de datos

---

## 🐛 Troubleshooting

### Error: "Authentication failed"

**Solución**:
- Verificar que el JSON key esté en la ruta correcta
- Verificar que `GOOGLE_APPLICATION_CREDENTIALS` apunte al archivo correcto
- Verificar que el Service Account tenga el rol `Dialogflow API Client`

### Error: "Agent not found"

**Solución**:
- Verificar `DIALOGFLOW_PROJECT_ID`
- Verificar `DIALOGFLOW_AGENT_ID`
- Verificar `DIALOGFLOW_LOCATION` (debe coincidir con location del agente)

### Bot no usa Dialogflow (usa lógica simple)

**Solución**:
- Verificar que todas las variables de entorno estén configuradas
- Reiniciar servidor después de editar `.env`
- Verificar logs: debe decir "✅ Dialogflow CX: Configurado"

### Intent no detectado correctamente

**Solución**:
- Agregar más training phrases en Dialogflow CX
- Revisar que los parámetros estén marcados correctamente
- Probar en el simulator de Dialogflow primero

---

## 📊 Testing Checklist

- [ ] Saludo inicial funciona
- [ ] Puede agregar 1 producto
- [ ] Puede agregar múltiples productos
- [ ] Extrae cantidad correctamente
- [ ] Extrae unidad correctamente (kilos, gramos)
- [ ] Mantiene contexto entre mensajes
- [ ] Puede finalizar pedido
- [ ] Muestra resumen de pedido
- [ ] Puede confirmar pedido
- [ ] Puede cancelar/modificar pedido
- [ ] Maneja mensajes fuera de contexto
- [ ] Logs muestran intents detectados

---

## 🎯 Éxito

Cuando veas esta conversación funcionando en WhatsApp:

```
User: hola
Bot: ¡Hola! 👋 Bienvenido a FreshMarket...

User: sí
Bot: Perfecto! ¿Qué te gustaría pedir?

User: quiero 2 kilos de manzanas y 1 kilo de tomates
Bot: Perfecto! Agregué los productos...

User: listo
Bot: 📋 Resumen de tu pedido:
1. 2 kilos de manzanas
2. 1 kilo de tomates
¿Confirmás?

User: sí
Bot: ¡Pedido confirmado! 🎉
```

**¡Fase 2 completada!** 🎉

---

## 🚀 Siguiente Fase

Cuando la integración funcione:
- Fase 3: Agregar seguridad (verificación de firma Twilio)
- Fase 4: Persistir pedidos en base de datos
- Fase 5: Deploy a GCP Cloud Run

---

## 📚 Recursos

- [Dialogflow CX Docs](https://cloud.google.com/dialogflow/cx/docs)
- [Guía de Setup](DIALOGFLOW_CX_SETUP_GUIDE.md)
- [Diseño del Agente](DIALOGFLOW_CX_DESIGN.md)
- [TODO del Proyecto](../TODO.md)
