import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ShoppingCart, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        {/* Logo/Header */}
        <div className="login-header">
          <div className="login-logo">
            <ShoppingCart size={36} color="white" />
          </div>
          <h1 className="login-title">FreshMarket</h1>
          <p className="login-subtitle">Panel de Administración</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert">
                <AlertCircle size={20} />
                <span className="alert-text">{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="admin@freshmarket.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }}></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-hint">
              Credenciales de prueba:
              <br />
              <span className="login-hint-code">admin@freshmarket.com</span> / <span className="login-hint-code">admin123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="copyright">
          © 2026 FreshMarket. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
