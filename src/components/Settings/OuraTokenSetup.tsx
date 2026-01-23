import {
    AlertCircle,
    Check,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
} from 'lucide-react';
import React, { useState } from 'react';

interface OuraTokenSetupProps {
    hasOuraRing: boolean;
    currentToken?: string;
    onSaveToken: (token: string) => Promise<void>;
    onToggleOura: (enabled: boolean) => Promise<void>;
}

/**
 * OuraTokenSetup - Configure Oura Ring personal access token
 *
 * Allows users to:
 * 1. Enable/disable Oura Ring integration
 * 2. Enter their personal access token from Oura Cloud
 * 3. View token status (masked)
 */
export const OuraTokenSetup: React.FC<OuraTokenSetupProps> = ({
    hasOuraRing,
    currentToken,
    onSaveToken,
    onToggleOura,
}) => {
    const [showToken, setShowToken] = useState(false);
    const [token, setToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
        'idle',
    );

    const hasToken = !!currentToken;
    const maskedToken = currentToken
        ? `${currentToken.substring(0, 8)}...${currentToken.substring(currentToken.length - 4)}`
        : null;

    const handleSaveToken = async () => {
        if (!token.trim()) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            await onSaveToken(token.trim());
            setSaveStatus('success');
            setToken('');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('[OuraSetup] Error saving token:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async () => {
        try {
            await onToggleOura(!hasOuraRing);
        } catch (err) {
            console.error('[OuraSetup] Error toggling Oura:', err);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💍</span>
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Oura Ring
                            </h3>
                            <p className="text-xs text-slate-500">
                                Sincroniza sueño, HRV y recuperación
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={handleToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            hasOuraRing ? 'bg-accent' : 'bg-slate-200'
                        }`}>
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                hasOuraRing ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Content - Only show if Oura is enabled */}
            {hasOuraRing && (
                <div className="p-4 space-y-4">
                    {/* Current Token Status / Warning */}
                    {hasToken ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                                Token configurado
                            </span>
                            <span className="text-xs text-green-600 font-mono ml-auto">
                                {maskedToken}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-amber-800 font-bold">
                                    Token no configurado
                                </p>
                                <p className="text-xs text-amber-700/80">
                                    Necesitás un token personal para ver tus propios
                                    datos.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-sm text-slate-600 space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="font-bold text-slate-800 mb-1">
                                ¿Cómo obtener tu token?
                            </p>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                                <li>
                                    Entrá a{' '}
                                    <a
                                        href="https://cloud.ouraring.com/personal-access-tokens"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                                        Oura Cloud
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </li>
                                <li>
                                    Hacé clic en{' '}
                                    <b>"Create New Personal Access Token"</b>
                                </li>
                                <li>Dale un nombre (ej: "LukenFit")</li>
                                <li>Copiá el token generado y pegalo abajo</li>
                            </ol>
                        </div>
                    </div>

                    {/* Token Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            {hasToken ? 'Actualizar Token' : 'Personal Access Token'}
                        </label>
                        <div className="relative">
                            <input
                                type={showToken ? 'text' : 'password'}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Pegá tu token aquí..."
                                className="w-full px-4 py-3 pr-20 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600">
                                {showToken ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveToken}
                        disabled={!token.trim() || isSaving}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            !token.trim() || isSaving
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                        }`}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : saveStatus === 'success' ? (
                            <>
                                <Check className="w-4 h-4" />
                                Token guardado
                            </>
                        ) : saveStatus === 'error' ? (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                Error al guardar
                            </>
                        ) : (
                            'Guardar Token'
                        )}
                    </button>

                    {/* Privacy Note */}
                    <p className="text-xs text-slate-400 text-center">
                        Tu token se guarda de forma segura y solo se usa para
                        sincronizar tus datos.
                    </p>
                </div>
            )}
        </div>
    );
};
