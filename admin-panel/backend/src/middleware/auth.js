import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y agrega el usuario al request
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No se proporcionó token de autenticación'
    });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
};

/**
 * Middleware para verificar que el usuario sea admin
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Se requieren permisos de administrador'
    });
  }
};

export default {
  authenticateToken,
  requireAdmin
};
