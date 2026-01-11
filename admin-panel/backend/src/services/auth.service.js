import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/firestore.js';

const usersCollection = db.collection('users');

/**
 * Crea un usuario administrador
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export async function createUser(userData) {
  const { email, password, name, role = 'admin' } = userData;

  // Verificar si el usuario ya existe
  const existingUser = await usersCollection.where('email', '==', email).get();

  if (!existingUser.empty) {
    throw new Error('El usuario ya existe');
  }

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email,
    passwordHash,
    name,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const docRef = await usersCollection.add(user);

  return {
    id: docRef.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

/**
 * Autentica un usuario y genera un JWT token
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Token y datos del usuario
 */
export async function login(email, password) {
  // Buscar usuario por email
  const snapshot = await usersCollection.where('email', '==', email).get();

  if (snapshot.empty) {
    throw new Error('Credenciales inválidas');
  }

  let user = null;
  let userId = null;

  snapshot.forEach(doc => {
    user = doc.data();
    userId = doc.id;
  });

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Credenciales inválidas');
  }

  // Generar JWT token
  const token = jwt.sign(
    {
      id: userId,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );

  return {
    token,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}

/**
 * Verifica si existe al menos un usuario admin
 * @returns {Promise<boolean>}
 */
export async function hasAdminUser() {
  const snapshot = await usersCollection.where('role', '==', 'admin').limit(1).get();
  return !snapshot.empty;
}

/**
 * Inicializa el usuario admin por defecto si no existe
 */
export async function initializeDefaultAdmin() {
  const hasAdmin = await hasAdminUser();

  if (!hasAdmin) {
    console.log('🔐 No se encontró usuario admin, creando usuario por defecto...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@freshmarket.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    await createUser({
      email: adminEmail,
      password: adminPassword,
      name: 'Administrador',
      role: 'admin'
    });

    console.log(`✅ Usuario admin creado:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  CAMBIAR LA CONTRASEÑA INMEDIATAMENTE`);
  }
}

export default {
  createUser,
  login,
  hasAdminUser,
  initializeDefaultAdmin
};
