import React from 'react';

export const AuthResetPassword = ({ email, setEmail, onSubmit, loading, setMode, error, message, handleContinueOffline, LukenFitLogo }) => {
  return (
    <>
      <div className="text-center mb-8">
        <LukenFitLogo />
        <p className="text-gray-500 text-sm mt-2">
          Recupera el acceso a tu cuenta
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
            'Enviar Email'
          )}
        </button>
      </form>

      <div className="mt-8 space-y-4 text-center">
        <button
          onClick={() => { setMode('login'); }}
          className="text-blue-600 hover:text-blue-700 text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          ← Volver al login
        </button>
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
