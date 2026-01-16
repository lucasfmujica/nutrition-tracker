import { useState } from 'react';

/**
 * Authentication UI Component
 * Handles login, signup, and password reset
 */
export function AuthUI({ onAuth, error: externalError, isSupabaseConfigured }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        const result = await onAuth.signUp(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          setMessage('¡Cuenta creada! Revisa tu email para confirmar.');
          setMode('login');
        }
      } else if (mode === 'reset') {
        const result = await onAuth.resetPassword(email);
        if (result.error) {
          setError(result.error.message);
        } else {
          setMessage('Email de recuperación enviado. Revisa tu bandeja.');
        }
      } else {
        const result = await onAuth.signIn(email, password);
        if (result.error) {
          setError(result.error.message);
        }
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.');
    }

    setLoading(false);
  };

  const handleContinueOffline = () => {
    onAuth.continueOffline();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-slate-700/50 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🥗</div>
            <h1 className="text-2xl font-bold text-white mb-2">Nutrition Tracker</h1>
            <p className="text-slate-400">Modo local activo</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-200 text-sm">
              ⚠️ Supabase no está configurado. Los datos se guardarán localmente en este dispositivo.
            </p>
          </div>

          <button
            onClick={handleContinueOffline}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
          >
            Continuar sin cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🥗</div>
          <h1 className="text-2xl font-bold text-white mb-2">Nutrition Tracker</h1>
          <p className="text-slate-400">
            {mode === 'login' && 'Inicia sesión para sincronizar tus datos'}
            {mode === 'signup' && 'Crea una cuenta para guardar tus datos'}
            {mode === 'reset' && 'Recupera el acceso a tu cuenta'}
          </p>
        </div>

        {/* Error/Message display */}
        {(error || externalError) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm">{error || externalError}</p>
          </div>
        )}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <p className="text-emerald-300 text-sm">{message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="tu@email.com"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {mode === 'login' && 'Iniciar sesión'}
                {mode === 'signup' && 'Crear cuenta'}
                {mode === 'reset' && 'Enviar email'}
              </>
            )}
          </button>
        </form>

        {/* Mode switches */}
        <div className="mt-6 space-y-3 text-center">
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <div className="text-slate-500 text-sm">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Regístrate
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-slate-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Inicia sesión
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              ← Volver al login
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-800 text-slate-500">o</span>
          </div>
        </div>

        {/* Offline mode */}
        <button
          onClick={handleContinueOffline}
          className="w-full py-3 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-all border border-slate-600"
        >
          Continuar sin cuenta
        </button>
        <p className="text-slate-500 text-xs text-center mt-3">
          Los datos se guardarán solo en este dispositivo
        </p>
      </div>
    </div>
  );
}
