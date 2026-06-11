/**
 * FoodVoiceInput Component
 * Voice-based meal logging: dictate what you ate, AI parses it into food items
 * with estimated macros. Falls back to a free-text input on browsers without
 * SpeechRecognition support (e.g. iOS Safari).
 *
 * Renders only the capture UI; on success it hands the parsed result to the
 * parent (FoodCameraInput) which reuses its existing review/confirm flow.
 */
import { Keyboard, Loader2, Mic, RefreshCw, Send, Square } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import {
    ParsedMealResult,
    parseMealFromText,
} from '../../services/ai/voiceMealService';

interface FoodVoiceInputProps {
    onParsed: (result: ParsedMealResult) => void;
    disabled?: boolean;
}

export const FoodVoiceInput: React.FC<FoodVoiceInputProps> = ({
    onParsed,
    disabled = false,
}) => {
    const { t, i18n } = useTranslation();
    const {
        isSupported,
        status,
        error: voiceError,
        transcript,
        startListening,
        stopListening,
        reset,
    } = useVoiceInput();

    const [isProcessing, setIsProcessing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [showTextFallback, setShowTextFallback] = useState(!isSupported);
    const [textInput, setTextInput] = useState('');
    const [lastText, setLastText] = useState('');

    /** Send a transcript / typed text to the AI parser. */
    const processText = async (text: string) => {
        if (!text.trim()) return;
        setLastText(text);
        setParseError(null);
        setIsProcessing(true);
        try {
            const result = await parseMealFromText(text, i18n.language);
            setIsProcessing(false);
            setTextInput('');
            reset();
            onParsed(result);
        } catch (err: any) {
            console.error('[FoodVoiceInput] Error parsing meal text:', err);
            setIsProcessing(false);
            setParseError(
                err?.message === 'NO_FOOD_DETECTED'
                    ? t('food.voice.errorNoFood')
                    : t('food.voice.errorParse'),
            );
        }
    };

    const handleMicClick = () => {
        setParseError(null);
        if (status === 'listening') {
            stopListening();
        } else {
            startListening((finalText) => processText(finalText));
        }
    };

    const voiceErrorMessage =
        voiceError === 'permission-denied'
            ? t('food.voice.errorPermission')
            : voiceError === 'no-speech'
              ? t('food.voice.errorNoSpeech')
              : voiceError
                ? t('food.voice.errorGeneric')
                : null;

    // Processing state (AI parsing)
    if (isProcessing) {
        return (
            <div className="w-full py-4 bg-surface border-2 border-border text-text-secondary rounded-xl font-bold flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('food.voice.processing')}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Mic button (hidden if unsupported) */}
            {isSupported && !showTextFallback && (
                <button
                    onClick={handleMicClick}
                    disabled={disabled}
                    className={`w-full py-4 rounded-xl font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                        status === 'listening'
                            ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30'
                            : 'bg-surface border-2 border-border text-text-secondary hover:bg-background'
                    }`}>
                    {status === 'listening' ? (
                        <>
                            <span className="relative flex items-center justify-center">
                                <span className="absolute inline-flex h-6 w-6 rounded-full bg-white/40 animate-ping" />
                                <Square className="w-5 h-5 relative" fill="currentColor" />
                            </span>
                            {t('food.voice.listening')}
                        </>
                    ) : (
                        <>
                            <Mic className="w-5 h-5" />
                            {t('food.voice.button')}
                        </>
                    )}
                </button>
            )}

            {/* Live transcript while listening */}
            {status === 'listening' && transcript && (
                <p className="text-sm text-text-secondary italic text-center px-2">
                    “{transcript}”
                </p>
            )}

            {/* Toggle to text fallback */}
            {isSupported && (
                <button
                    onClick={() => setShowTextFallback(!showTextFallback)}
                    className="w-full text-xs text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-center gap-1">
                    {showTextFallback ? (
                        <>
                            <Mic className="w-3.5 h-3.5" />
                            {t('food.voice.useMic')}
                        </>
                    ) : (
                        <>
                            <Keyboard className="w-3.5 h-3.5" />
                            {t('food.voice.useKeyboard')}
                        </>
                    )}
                </button>
            )}

            {/* Text fallback (iOS Safari / no SpeechRecognition) */}
            {showTextFallback && (
                <div className="space-y-2">
                    {!isSupported && (
                        <p className="text-xs text-text-tertiary">
                            {t('food.voice.notSupported')}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') processText(textInput);
                            }}
                            placeholder={t('food.voice.textPlaceholder')}
                            className="flex-1 px-4 py-3 bg-background text-text-primary border border-border rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => processText(textInput)}
                            disabled={disabled || !textInput.trim()}
                            aria-label={t('food.voice.parseButton')}
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Errors + retry */}
            {(voiceErrorMessage || parseError) && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl space-y-2">
                    <p className="text-sm text-red-700 dark:text-red-400">
                        {parseError || voiceErrorMessage}
                    </p>
                    {parseError && lastText && (
                        <button
                            onClick={() => processText(lastText)}
                            className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5 hover:underline">
                            <RefreshCw className="w-4 h-4" />
                            {t('food.voice.retry')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
