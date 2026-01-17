import { useState } from 'react';

/**
 * Authentication UI Component - LukenFit
 * Light Theme Design
 */
export function AuthUI({ onAuth, error: externalError, isSupabaseConfigured, loading: externalLoading }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Combined loading state
  const loading = internalLoading || externalLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setInternalLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setInternalLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setInternalLoading(false);
          return;
        }
        const result = await onAuth.signUp(email, password);
        if (result?.error) {
          // Error handling similar to previous...
          let errorMsg = result.error.message || 'Error desconocido';
           if (errorMsg.includes('already registered')) errorMsg = 'Este email ya está registrado. Intenta iniciar sesión.';
           else if (errorMsg.includes('valid email')) errorMsg = 'Por favor ingresa un email válido.';
           else if (errorMsg.includes('Password')) errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
           else if (errorMsg.includes('Database error')) errorMsg = 'Error de configuración del servidor.';
          setError(errorMsg);
        } else if (result?.needsConfirmation) {
          setMessage('¡Cuenta creada! Revisa tu email para confirmar.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          setMessage('¡Cuenta creada! Redirigiendo...');
        }
      } else if (mode === 'reset') {
        const result = await onAuth.resetPassword(email);
        if (result?.error) {
          setError(result.error.message || 'Error al enviar email');
        } else {
          setMessage('Email de recuperación enviado. Revisa tu bandeja.');
        }
      } else {
        // LOGIN
        const result = await onAuth.signIn(email, password);
        if (result?.error) {
          let errorMsg = result.error.message || 'Error desconocido';
          if (errorMsg.includes('Invalid login')) errorMsg = 'Email o contraseña incorrectos.';
          else if (errorMsg.includes('Email not confirmed')) errorMsg = 'Debes confirmar tu email. Revisa tu bandeja.';
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[Auth] Error:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleContinueOffline = () => {
    onAuth.continueOffline();
  };

  // LukenFit Logo
  const LukenFitLogo = () => (
    <div className="w-16 h-16 mx-auto mb-6 relative">
      <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
        <span className="text-white font-bold text-2xl">LF</span>
      </div>
    </div>
  );

  const containerClasses = "min-h-screen bg-gray-50 flex items-center justify-center p-4";
  const cardClasses = "bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-xl shadow-gray-200/50";

  if (!isSupabaseConfigured) {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          <div className="text-center mb-6">
            <LukenFitLogo />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">LukenFit</h1>
            <p className="text-gray-500">Modo local activo</p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
            <p className="text-amber-700 text-sm">
              ⚠️ Supabase no está configurado. Los datos se guardarán localmente en este dispositivo.
            </p>
          </div>

          <button
            onClick={handleContinueOffline}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
          >
            Continuar sin cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Header */}
        <div className="text-center mb-8">
          <LukenFitLogo />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">LukenFit</h1>
          <p className="text-gray-500 text-sm">
            {mode === 'login' && 'Inicia sesión para sincronizar tus datos'}
            {mode === 'signup' && 'Crea una cuenta para guardar tus datos'}
            {mode === 'reset' && 'Recupera el acceso a tu cuenta'}
          </p>
        </div>

        {/* Messages */}
        {(error || externalError) && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            <p className="text-red-600 text-sm font-medium">{error || externalError}</p>
          </div>
        )}
        {message && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-blue-600 text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              placeholder="tu@email.com"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </span>
            ) : (
              <>
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'signup' && 'Crear Cuenta'}
                {mode === 'reset' && 'Enviar Email'}
              </>
            )}
          </button>
        </form>

        {/* Mode switches */}
        <div className="mt-8 space-y-4 text-center">
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <div className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                  className="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1"
                >
                  Regístrate
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1"
              >
                Inicia sesión
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              ← Volver al login
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="px-4 bg-white text-gray-400 font-bold">O continúa como invitado</span>
          </div>
        </div>

        {/* Offline mode */}
        <button
          onClick={handleContinueOffline}
          className="w-full py-3.5 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all border-2 border-dashed border-gray-200 hover:border-gray-300"
        >
          Usar sin cuenta
        </button>
      </div>
    </div>
  );
}
