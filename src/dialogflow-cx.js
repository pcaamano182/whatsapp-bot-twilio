import { SessionsClient } from '@google-cloud/dialogflow-cx';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del cliente Dialogflow CX
const client = new SessionsClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const location = process.env.DIALOGFLOW_LOCATION || 'global';
const agentId = process.env.DIALOGFLOW_AGENT_ID;
const languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'es';

/**
 * Detecta intent y procesa mensaje con Dialogflow CX
 * @param {string} text - Mensaje del usuario
 * @param {string} sessionId - ID de sesión (número de WhatsApp)
 * @returns {Promise<Object>} Respuesta de Dialogflow
 */
export async function detectIntentCX(text, sessionId) {
  try {
    // Construir session path
    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );

    console.log('🤖 Dialogflow CX Request:');
    console.log(`   Session: ${sessionId}`);
    console.log(`   Text: ${text}`);
    console.log(`   Session Path: ${sessionPath}`);

    // Request a Dialogflow CX
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
        },
        languageCode: languageCode,
      },
    };

    // Enviar request
    const [response] = await client.detectIntent(request);
    const queryResult = response.queryResult;

    console.log('✅ Dialogflow CX Response:');
    console.log(`   Intent: ${queryResult.intent?.displayName || 'No intent'}`);
    console.log(`   Confidence: ${queryResult.intentDetectionConfidence || 0}`);
    console.log(`   Response Messages: ${queryResult.responseMessages?.length || 0}`);

    // Extraer texto de respuesta
    const responseText = extractResponseText(queryResult);

    // Extraer parámetros
    const parameters = queryResult.parameters || {};

    // Información del match
    const match = queryResult.match || {};

    return {
      text: responseText,
      intent: queryResult.intent?.displayName || null,
      confidence: queryResult.intentDetectionConfidence || 0,
      parameters: parameters,
      match: {
        matchType: match.matchType || 'UNKNOWN',
        confidence: match.confidence || 0,
      },
      sessionInfo: response.queryResult.diagnosticInfo?.fields?.session_info || null,
      raw: queryResult, // Por si necesitamos acceder a datos completos
    };

  } catch (error) {
    console.error('❌ Error en Dialogflow CX:', error);
    throw error;
  }
}

/**
 * Extrae el texto de respuesta de los response messages
 * @param {Object} queryResult - Query result de Dialogflow CX
 * @returns {string} Texto de respuesta
 */
function extractResponseText(queryResult) {
  const messages = queryResult.responseMessages || [];

  // Buscar mensajes de tipo TEXT
  const textMessages = messages.filter(msg => msg.text);

  if (textMessages.length === 0) {
    return 'Lo siento, no tengo una respuesta en este momento.';
  }

  // Concatenar todos los textos
  const texts = textMessages
    .flatMap(msg => msg.text.text || [])
    .filter(Boolean);

  return texts.join('\n') || 'Lo siento, no tengo una respuesta en este momento.';
}

/**
 * Obtiene información de la sesión actual
 * @param {string} sessionId - ID de sesión
 * @returns {string} Session path
 */
export function getSessionPath(sessionId) {
  return client.projectLocationAgentSessionPath(
    projectId,
    location,
    agentId,
    sessionId
  );
}

/**
 * Verifica que la configuración de Dialogflow CX esté completa
 * @returns {boolean} true si está configurado
 */
export function isDialogflowConfigured() {
  const required = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.DIALOGFLOW_PROJECT_ID,
    process.env.DIALOGFLOW_AGENT_ID,
  ];

  const isConfigured = required.every(Boolean);

  if (!isConfigured) {
    console.warn('⚠️  Dialogflow CX no está completamente configurado');
    console.warn('   Variables faltantes en .env:');
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('   - GOOGLE_APPLICATION_CREDENTIALS');
    }
    if (!process.env.DIALOGFLOW_PROJECT_ID) {
      console.warn('   - DIALOGFLOW_PROJECT_ID');
    }
    if (!process.env.DIALOGFLOW_AGENT_ID) {
      console.warn('   - DIALOGFLOW_AGENT_ID');
    }
  }

  return isConfigured;
}

export default {
  detectIntentCX,
  getSessionPath,
  isDialogflowConfigured,
};
