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
export async function downloadAudioFromTwilio(mediaUrl, accountSid, authToken) {
  try {
    console.log('📥 Descargando audio desde Twilio:', mediaUrl);

    const response = await axios.get(mediaUrl, {
      auth: {
        username: accountSid,
        password: authToken
      },
      responseType: 'arraybuffer'
    });

    console.log('✅ Audio descargado, tamaño:', response.data.length, 'bytes');
    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ Error descargando audio:', error);
    throw new Error('Failed to download audio from Twilio');
  }
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
  const hasCredentials = process.env.DIALOGFLOW_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  return !!hasCredentials;
}

export default {
  downloadAudioFromTwilio,
  transcribeAudio,
  isSpeechToTextConfigured
};
