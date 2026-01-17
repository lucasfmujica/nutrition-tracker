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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Combined loading state
  const loading = internalLoading || externalLoading || googleLoading;

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

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setGoogleLoading(true);

    try {
      const result = await onAuth.signInWithGoogle();
      if (result?.error) {
        setError(result.error.message || 'Error al iniciar sesión con Google');
        setGoogleLoading(false);
      }
      // If successful, the page will redirect, so no need to setGoogleLoading(false)
    } catch (err) {
      console.error('[Auth] Google sign-in error:', err);
      setError('Error al iniciar sesión con Google');
      setGoogleLoading(false);
    }
  };

  // LukenFit Logo
  const LukenFitLogo = () => (
    <div className="mx-auto mb-6 relative flex flex-col items-center gap-3">
      <svg viewBox="0 0 32 32" className="w-20 h-20">
        <defs>
          <linearGradient id="authLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2563EB' }} />
            <stop offset="100%" style={{ stopColor: '#0891B2' }} />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="#F8FAFC" stroke="url(#authLogoGrad)" strokeWidth="1.5" />
        <path d="M10 7 L10 21 L19 21 L19 18 L13 18 L13 7 Z" fill="url(#authLogoGrad)" />
        <path d="M18 7 L14 15 L17 15 L15 25 L23 14 L19 14 L22 7 Z" fill="url(#authLogoGrad)" opacity="0.9" />
      </svg>
      <h1 className="text-2xl font-black text-gray-900 tracking-tighter">LUKEN<span className="text-blue-600">FIT</span></h1>
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
            <p className="text-gray-500 mt-2">Modo local activo</p>
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
          <p className="text-gray-500 text-sm mt-2">
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

        {/* Google Sign-In */}
        {mode !== 'reset' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="px-4 bg-white text-gray-400 font-bold">O</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Conectando...' : 'Continuar con Google'}
            </button>
          </>
        )}

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
