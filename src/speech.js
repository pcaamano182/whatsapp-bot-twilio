/**
 * Módulo para transcribir audio usando Google Cloud Speech-to-Text
 */

import speech from '@google-cloud/speech';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configurar cliente de Speech-to-Text
const clientOptions = {};

if (process.env.DIALOGFLOW_CREDENTIALS) {
  try {
    const credentials = JSON.parse(process.env.DIALOGFLOW_CREDENTIALS);
    clientOptions.credentials = credentials;
  } catch (error) {
    console.error('❌ Error parseando DIALOGFLOW_CREDENTIALS:', error);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const speechClient = new speech.SpeechClient(clientOptions);

/**
 * Descarga un archivo de audio desde Twilio
 * @param {string} mediaUrl - URL del archivo de audio en Twilio
 * @param {string} accountSid - Twilio Account SID
 * @param {string} authToken - Twilio Auth Token
 * @returns {Promise<Buffer>} Buffer con el contenido del audio
 */
/**
 * Helper para esperar un tiempo determinado
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadAudioFromTwilio(mediaUrl, accountSid, authToken, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📥 Descargando audio desde Twilio (intento ${attempt}/${retries}):`, mediaUrl);
      if (attempt === 1) {
        console.log('   Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'NO CONFIGURADO');
        console.log('   Auth Token:', authToken ? 'CONFIGURADO' : 'NO CONFIGURADO');
      }

      const response = await axios.get(mediaUrl, {
        auth: {
          username: accountSid,
          password: authToken
        },
        responseType: 'arraybuffer',
        timeout: 10000 // 10 segundos timeout
      });

      console.log('✅ Audio descargado, tamaño:', response.data.length, 'bytes');
      return Buffer.from(response.data);
    } catch (error) {
      lastError = error;

      console.error(`❌ Error descargando audio (intento ${attempt}/${retries}):`);
      console.error('   Status:', error.response?.status);
      console.error('   Status Text:', error.response?.statusText);
      console.error('   Error Message:', error.message);

      // Si es 404, el audio puede no estar disponible aún, reintentar
      if (error.response?.status === 404) {
        if (attempt < retries) {
          const waitTime = attempt * 1000; // Esperar 1s, 2s, 3s...
          console.log(`   ⏳ Audio no disponible aún. Reintentando en ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        } else {
          console.error('   ⚠️  El audio ya no está disponible en Twilio después de múltiples intentos');
        }
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('   ⚠️  Credenciales de Twilio incorrectas');
        throw error; // No reintentar si las credenciales son incorrectas
      }

      // Si no es 404 o ya agotamos los intentos, lanzar error
      if (attempt === retries) {
        throw new Error(`Failed to download audio from Twilio after ${retries} attempts (${error.response?.status || error.message})`);
      }
    }
  }

  // Esto no debería ocurrir, pero por seguridad
  throw lastError;
}

/**
 * Transcribe un archivo de audio a texto
 * @param {Buffer} audioBuffer - Buffer con el contenido del audio
 * @param {string} contentType - Tipo de contenido (ej: 'audio/ogg')
 * @returns {Promise<string>} Texto transcrito
 */
export async function transcribeAudio(audioBuffer, contentType = 'audio/ogg') {
  try {
    console.log('🎤 Transcribiendo audio...');

    // Determinar encoding basado en el content type
    let encoding = 'OGG_OPUS';
    if (contentType.includes('amr')) {
      encoding = 'AMR';
    } else if (contentType.includes('mp3')) {
      encoding = 'MP3';
    } else if (contentType.includes('wav')) {
      encoding = 'LINEAR16';
    }

    const audio = {
      content: audioBuffer.toString('base64'),
    };

    const config = {
      encoding: encoding,
      sampleRateHertz: 16000,
      languageCode: 'es-ES', // Español
      model: 'default',
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    console.log('✅ Audio transcrito:', transcription);

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('No se pudo transcribir el audio. Puede estar vacío o ser inaudible.');
    }

    return transcription;
  } catch (error) {
    console.error('❌ Error transcribiendo audio:', error);
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
}

/**
 * Verifica si Speech-to-Text está configurado
 * @returns {boolean}
 */
export function isSpeechToTextConfigured() {
  // En Cloud Run (K_SERVICE existe), las credenciales se obtienen automáticamente del service account
  const isCloudRun = !!process.env.K_SERVICE;
  const hasCredentials = isCloudRun || process.env.DIALOGFLOW_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  console.log('🔍 [isSpeechToTextConfigured] Verificando configuración Speech-to-Text...');
  console.log(`   Ejecutando en Cloud Run: ${isCloudRun}`);
  console.log(`   Credenciales disponibles: ${hasCredentials}`);

  return hasCredentials;
}

export default {
  downloadAudioFromTwilio,
  transcribeAudio,
  isSpeechToTextConfigured
};
