import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firestore
// En Cloud Run usa Application Default Credentials automáticamente
// En local usa GOOGLE_APPLICATION_CREDENTIALS si está configurado
const firestoreConfig = {
  projectId: process.env.DIALOGFLOW_PROJECT_ID
};

// Solo en desarrollo local, usar el archivo de credenciales
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production') {
  firestoreConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const db = new Firestore(firestoreConfig);

export default db;
