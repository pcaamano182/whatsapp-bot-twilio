# 🤖 Dialogflow CX - Dos Opciones

Tenés dos formas de implementar el agente conversacional:

---

## 🎮 Opción 1: Playbooks (Generative AI) - **RECOMENDADO** ⭐

**Usa LLM (Large Language Model) para conversaciones naturales**

### ✅ Ventajas:
- ⚡ Setup rápido: ~45 minutos
- 🧠 Entiende lenguaje natural sin training
- 💬 Conversaciones más fluidas
- 🔧 Menos mantenimiento
- 🎯 Multi-intent en un mensaje

### ⏱️ Tiempo de implementación:
**45 minutos total**

### 📖 Guía:
→ [NEXT_STEPS_PLAYBOOKS.md](NEXT_STEPS_PLAYBOOKS.md)

→ [DIALOGFLOW_PLAYBOOKS_GUIDE.md](DIALOGFLOW_PLAYBOOKS_GUIDE.md)

### Ejemplo de uso:

```
User: "dame 2 kilos de manzanas y medio de tomates"
Bot: [Entiende automáticamente ambos productos]

User: "poneme también espinaca"
Bot: [Mantiene contexto y agrega al pedido]
```

---

## 🔧 Opción 2: Flows Tradicionales (Determinístico)

**Usa reglas if/then con intents y entities**

### ✅ Ventajas:
- 🎯 Más control sobre respuestas exactas
- 💰 Costo ligeramente menor
- 📊 Comportamiento 100% predecible

### ⚠️ Desventajas:
- ⏳ Setup lento: ~2 horas
- 📝 Necesita muchas training phrases
- 🔄 Alto mantenimiento
- ❌ No entiende variaciones no entrenadas

### ⏱️ Tiempo de implementación:
**2+ horas**

### 📖 Guía:
→ [DIALOGFLOW_CX_SETUP_GUIDE.md](DIALOGFLOW_CX_SETUP_GUIDE.md)

→ [DIALOGFLOW_CX_DESIGN.md](DIALOGFLOW_CX_DESIGN.md)

---

## 🤔 ¿Cuál elegir?

### Elegí **Playbooks** si:
- ✅ Querés implementar rápido
- ✅ Necesitás conversaciones naturales
- ✅ El bot debe entender variaciones de lenguaje
- ✅ Querés menos mantenimiento

### Elegí **Flows** si:
- ✅ Necesitás control total sobre cada respuesta
- ✅ El flujo es muy específico y crítico
- ✅ Querés minimizar costos al máximo
- ✅ Tenés tiempo para mantener training phrases

---

## 💡 Recomendación

Para este proyecto de pedidos de frutas y verduras:

### 🎮 **Playbooks** es la mejor opción porque:

1. Las conversaciones de pedidos son naturales y variadas
2. Los usuarios dirán cosas como:
   - "dame 2 kilos de manzanas"
   - "quiero manzanas, 2 kilos"
   - "poneme manzanas"
   - "necesito 2kg de manzana"

   → Con Playbooks todas funcionan automáticamente
   → Con Flows necesitarías entrenar cada variación

3. Es común que los usuarios pidan múltiples productos en un mensaje
   → Playbooks lo maneja naturalmente
   → Flows requiere lógica compleja

4. El mantenimiento es mínimo
   → Solo ajustás las instrucciones del playbook
   → No necesitás agregar training phrases constantemente

---

## 🚀 Empezar

### Con Playbooks (45 min):
1. Seguir [NEXT_STEPS_PLAYBOOKS.md](NEXT_STEPS_PLAYBOOKS.md)
2. Crear agente generativo
3. Crear 1 playbook con instrucciones
4. ¡Listo!

### Con Flows (2+ horas):
1. Seguir [DIALOGFLOW_CX_SETUP_GUIDE.md](DIALOGFLOW_CX_SETUP_GUIDE.md)
2. Crear 7 intents con training phrases
3. Crear 2 entities
4. Crear 4 flows con pages y routes
5. Probar y ajustar

---

## 💰 Costos Comparados

**Playbooks**:
- ~$0.007 por request
- Se cobra por tokens del LLM

**Flows**:
- ~$0.002 por request
- Precio fijo por request

**Para desarrollo**: Ambos gratis en free tier

**Para producción con ~1000 requests/mes**:
- Playbooks: ~$7/mes
- Flows: ~$2/mes

**La diferencia es mínima comparada con el tiempo de desarrollo y mantenimiento**

---

## 🔄 ¿Puedo cambiar después?

Sí, podés:
- Empezar con Playbooks → Migrar a Flows (si necesitás más control)
- Empezar con Flows → Migrar a Playbooks (si querés más flexibilidad)

El código del backend es el mismo para ambos (SDK de Dialogflow CX)

---

## 📊 Tabla Comparativa

| Aspecto | Playbooks | Flows |
|---------|-----------|-------|
| **Setup** | 45 min | 2+ horas |
| **Training phrases** | No necesita | ~70 frases |
| **Entities** | Auto | Manual (40 valores) |
| **Flows/Pages** | 1 playbook | 4 flows + pages |
| **Entiende variaciones** | ✅ Sí | ❌ Solo entrenadas |
| **Multi-intent/mensaje** | ✅ Sí | ❌ No |
| **Contexto natural** | ✅ Sí | ⚠️ Limitado |
| **Mantenimiento** | Bajo | Alto |
| **Costo** | $0.007/req | $0.002/req |
| **Predecibilidad** | Media | Alta |
| **Flexibilidad** | Alta | Baja |

---

## 🎯 Decisión Final

### Para este proyecto: **Playbooks** 🎮

**Razón**: Mejor experiencia de usuario + menos tiempo de desarrollo + menos mantenimiento

**Backend ya preparado**: El código en `src/dialogflow-cx.js` funciona con ambas opciones sin cambios

---

## 📚 Siguiente Paso

Ir a: [NEXT_STEPS_PLAYBOOKS.md](NEXT_STEPS_PLAYBOOKS.md)

**¡Empezá en 5 minutos!** 🚀
