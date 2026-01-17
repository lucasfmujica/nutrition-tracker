import { useState } from 'react';
import { AuthLogin } from './AuthLogin';
import { AuthRegister } from './AuthRegister';
import { AuthResetPassword } from './AuthResetPassword';

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
        {mode === 'login' && (
            <AuthLogin
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                onSubmit={handleSubmit} loading={loading} setMode={setMode}
                error={error || externalError} message={message}
                handleGoogleSignIn={handleGoogleSignIn}
                handleContinueOffline={handleContinueOffline}
                LukenFitLogo={LukenFitLogo}
            />
        )}
        {mode === 'signup' && (
            <AuthRegister
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                onSubmit={handleSubmit} loading={loading} setMode={setMode}
                error={error || externalError} message={message}
                handleGoogleSignIn={handleGoogleSignIn}
                handleContinueOffline={handleContinueOffline}
                LukenFitLogo={LukenFitLogo}
            />
        )}
         {mode === 'reset' && (
            <AuthResetPassword
                email={email} setEmail={setEmail}
                onSubmit={handleSubmit} loading={loading} setMode={setMode}
                error={error || externalError} message={message}
                handleContinueOffline={handleContinueOffline}
                LukenFitLogo={LukenFitLogo}
            />
        )}
      </div>
    </div>
  );
}
