import React from 'react';

export const AuthLogin = ({ email, setEmail, password, setPassword, onSubmit, loading, setMode, error, message, handleGoogleSignIn, handleContinueOffline, LukenFitLogo }) => {
  return (
    <>
      <div className="text-center mb-8">
        <LukenFitLogo />
        <p className="text-gray-500 text-sm mt-2">
          Inicia sesión para sincronizar tus datos
        </p>
      </div>

      {(error) && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-blue-600 text-sm font-medium">{message}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
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
            'Iniciar Sesión'
          )}
        </button>
      </form>

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
        Continuar con Google
      </button>

      <div className="mt-8 space-y-4 text-center">
        <button
          onClick={() => { setMode('reset'); }}
          className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
        <div className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => { setMode('signup'); }}
            className="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1"
          >
            Regístrate
          </button>
        </div>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest">
          <span className="px-4 bg-white text-gray-400 font-bold">O continúa como invitado</span>
        </div>
      </div>

      <button
        onClick={handleContinueOffline}
        className="w-full py-3.5 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all border-2 border-dashed border-gray-200 hover:border-gray-300"
      >
        Usar sin cuenta
      </button>
    </>
  );
};
