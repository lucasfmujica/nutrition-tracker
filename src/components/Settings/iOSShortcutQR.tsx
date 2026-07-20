import { Check, ChevronDown, ChevronUp, Copy, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [showInstructions, setShowInstructions] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    // iOS Shortcut iCloud URLs (opens in Safari → redirects to Shortcuts app)
    const weightShortcutUrl = `https://www.icloud.com/shortcuts/da059df06b604715a9e51e9243bdd3da`;
    const stepsShortcutUrl = `https://www.icloud.com/shortcuts/2ba1fb49fae0403e84c46a391d496c5a`;

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
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-text-primary">
                            {t('settings.iosShortcut.title')}
                        </h3>
                        <p className="text-xs text-text-tertiary">
                            {t('settings.iosShortcut.subtitle') ||
                                'Registra peso y pasos desde tu iPhone'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* User ID Display */}
                <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-xl">
                    <span className="text-xs text-text-tertiary">
                        {t('settings.iosShortcut.userId') || 'Tu ID de usuario:'}
                    </span>
                    <code className="text-xs font-mono text-text-secondary flex-1">
                        {shortUserId}...
                    </code>
                    <button
                        onClick={copyUserId}
                        className="p-1.5 hover:bg-surface-lighter rounded-lg transition-colors"
                        title="Copiar ID completo">
                        {copiedId ? (
                            <Check className="w-4 h-4 text-success" />
                        ) : (
                            <Copy className="w-4 h-4 text-text-tertiary" />
                        )}
                    </button>
                </div>

                {/* QR Codes */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Weight Shortcut */}
                    <div className="text-center space-y-2">
                        <div className="bg-surface p-3 rounded-xl border border-border inline-block">
                            <QRCodeSVG
                                value={weightShortcutUrl}
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                ⚖️ {t('settings.iosShortcut.weight') || 'Peso'}
                            </p>
                            <p className="text-xs text-text-tertiary">
                                Apple Health → App
                            </p>
                        </div>
                        <a
                            href={weightShortcutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-soft text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-soft transition-all active:scale-95 shadow-sm">
                            <Smartphone className="w-3 h-3" />
                            {t('settings.iosShortcut.install') || 'Instalar'}
                        </a>
                    </div>

                    {/* Steps Shortcut */}
                    <div className="text-center space-y-2">
                        <div className="bg-surface p-3 rounded-xl border border-border inline-block">
                            <QRCodeSVG
                                value={stepsShortcutUrl}
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                👟 {t('settings.iosShortcut.steps') || 'Pasos'}
                            </p>
                            <p className="text-xs text-text-tertiary">
                                Apple Health → App
                            </p>
                        </div>
                        <a
                            href={stepsShortcutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-oura-soft text-oura rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-oura-soft transition-all active:scale-95 shadow-sm">
                            <Smartphone className="w-3 h-3" />
                            {t('settings.iosShortcut.install') || 'Instalar'}
                        </a>
                    </div>
                </div>

                {/* Quick Instructions */}
                <div className="bg-primary-soft border border-primary/20 rounded-xl p-3 text-center sm:text-left space-y-1">
                    <p className="text-sm text-text-secondary">
                        <strong>{t('common.howToUse') || 'Cómo usar'}:</strong>{' '}
                        {t('settings.iosShortcut.instructionsShort') ||
                            'Tocá "Instalar" si estás en tu iPhone, o escaneá el QR desde otro dispositivo.'}
                    </p>
                    <p className="text-xs text-primary">
                        {t('settings.iosShortcut.copyIdHint') ||
                            'Copiá tu ID antes de instalar. El shortcut te lo pedirá al configurarse.'}
                    </p>
                </div>

                {/* Expandable Instructions */}
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full flex items-center justify-between p-3 bg-background hover:bg-surface-lighter rounded-xl transition-colors">
                    <span className="text-sm text-text-secondary">
                        {t('settings.iosShortcut.detailedInstructions') ||
                            'Instrucciones detalladas'}
                    </span>
                    {showInstructions ? (
                        <ChevronUp className="w-4 h-4 text-text-tertiary" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    )}
                </button>

                {showInstructions && (
                    <div className="space-y-3 p-4 bg-background rounded-xl text-sm text-text-secondary">
                        <div>
                            <p className="font-semibold text-text-primary mb-1">
                                Paso 1: Escanear QR
                            </p>
                            <p>
                                Abrí la cámara de tu iPhone y escaneá el código QR.
                                Se abrirá la app Shortcuts.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary mb-1">
                                Paso 2: Agregar Shortcut
                            </p>
                            <p>
                                Tocá &ldquo;Agregar Shortcut&rdquo;. El ID de usuario
                                ya está configurado automáticamente.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary mb-1">
                                Paso 3: Dar permisos
                            </p>
                            <p>
                                La primera vez que ejecutes el shortcut, dará permiso
                                para acceder a Apple Health.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-text-primary mb-1">
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
                                {t('common.save') || 'Marcar como configurado'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
