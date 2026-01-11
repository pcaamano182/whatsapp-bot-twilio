import * as authService from '../services/auth.service.js';

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un JWT token
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Obtiene el usuario autenticado actual
 */
export async function getCurrentUser(req, res, next) {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 * Crea un nuevo usuario (solo para admin)
 */
export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    const user = await authService.createUser({
      email,
      password,
      name,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      user
    });

  } catch (error) {
    if (error.message === 'El usuario ya existe') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
}

export default {
  login,
  getCurrentUser,
  register
};
