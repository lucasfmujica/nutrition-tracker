import { Check, ChevronDown, ChevronUp, Copy, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';

interface iOSShortcutQRProps {
    userId: string;
    onConfigured?: () => void;
}

/**
 * iOSShortcutQR - QR codes for iOS Shortcuts setup
 *
 * Generates QR codes that link to iOS Shortcuts for:
 * - Weight logging from Apple Health
 * - Steps logging from Apple Health
 *
 * The shortcuts will pre-fill the user ID for automatic sync.
 */
export const IOSShortcutQR: React.FC<iOSShortcutQRProps> = ({
    userId,
    onConfigured,
}) => {
    const [showInstructions, setShowInstructions] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    // iOS Shortcut URLs with user ID
    const weightShortcutUrl = `shortcuts://import-shortcut?url=https://www.icloud.com/shortcuts/da059df06b604715a9e51e9243bdd3da&input=text&text=${userId}`;
    const stepsShortcutUrl = `shortcuts://import-shortcut?url=https://www.icloud.com/shortcuts/2ba1fb49fae0403e84c46a391d496c5a&input=text&text=${userId}`;

    const shortUserId = userId?.substring(0, 8) || '';

    const copyUserId = async () => {
        try {
            await navigator.clipboard.writeText(userId);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } catch (err) {
            console.error('[Shortcuts] Failed to copy user ID:', err);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            iOS Shortcuts
                        </h3>
                        <p className="text-xs text-slate-500">
                            Registra peso y pasos desde tu iPhone
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* User ID Display */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500">Tu ID de usuario:</span>
                    <code className="text-xs font-mono text-slate-700 flex-1">
                        {shortUserId}...
                    </code>
                    <button
                        onClick={copyUserId}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Copiar ID completo">
                        {copiedId ? (
                            <Check className="w-4 h-4 text-green-600" />
                        ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                </div>

                {/* QR Codes */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Weight Shortcut */}
                    <div className="text-center space-y-2">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block">
                            <QRCodeSVG
                                value={weightShortcutUrl}
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-800">
                                ⚖️ Peso
                            </p>
                            <p className="text-xs text-slate-500">
                                Apple Health → App
                            </p>
                        </div>
                        <a
                            href={weightShortcutUrl}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 shadow-sm">
                            <Smartphone className="w-3 h-3" />
                            Instalar
                        </a>
                    </div>

                    {/* Steps Shortcut */}
                    <div className="text-center space-y-2">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block">
                            <QRCodeSVG
                                value={stepsShortcutUrl}
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-800">
                                👟 Pasos
                            </p>
                            <p className="text-xs text-slate-500">
                                Apple Health → App
                            </p>
                        </div>
                        <a
                            href={stepsShortcutUrl}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all active:scale-95 shadow-sm">
                            <Smartphone className="w-3 h-3" />
                            Instalar
                        </a>
                    </div>
                </div>

                {/* Quick Instructions */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center sm:text-left">
                    <p className="text-sm text-blue-800">
                        <strong>Cómo usar:</strong> Tocá &ldquo;Instalar&rdquo; si
                        estás en tu iPhone, o escaneá el QR desde otro dispositivo.
                    </p>
                </div>

                {/* Expandable Instructions */}
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                    <span className="text-sm text-slate-600">
                        Instrucciones detalladas
                    </span>
                    {showInstructions ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </button>

                {showInstructions && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
                        <div>
                            <p className="font-semibold text-slate-800 mb-1">
                                Paso 1: Escanear QR
                            </p>
                            <p>
                                Abrí la cámara de tu iPhone y escaneá el código QR.
                                Se abrirá la app Shortcuts.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-1">
                                Paso 2: Agregar Shortcut
                            </p>
                            <p>
                                Tocá &ldquo;Agregar Shortcut&rdquo;. El ID de usuario
                                ya está configurado automáticamente.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-1">
                                Paso 3: Dar permisos
                            </p>
                            <p>
                                La primera vez que ejecutes el shortcut, dará permiso
                                para acceder a Apple Health.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 mb-1">
                                Paso 4: Ejecutar
                            </p>
                            <p>
                                Podés ejecutarlo manualmente o crear una
                                automatización para que corra todos los días.
                            </p>
                        </div>

                        {/* Mark as configured button */}
                        {onConfigured && (
                            <button
                                onClick={onConfigured}
                                className="w-full mt-2 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                                Marcar como configurado
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
