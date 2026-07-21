/**
 * useVoiceInput Hook
 * Wraps the Web Speech API (SpeechRecognition / webkitSpeechRecognition) for
 * dictating meal descriptions. Language follows the current i18n locale.
 *
 * Limitations: iOS Safari (and some browsers) don't expose SpeechRecognition;
 * `isSupported` is false there and callers must offer a text-input fallback.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { devLog } from '../utils/devLog';

export type VoiceInputStatus = 'idle' | 'listening' | 'error';
export type VoiceInputError =
    | 'not-supported'
    | 'permission-denied'
    | 'no-speech'
    | 'generic'
    | null;

interface UseVoiceInputReturn {
    /** True if SpeechRecognition exists in this browser. */
    isSupported: boolean;
    status: VoiceInputStatus;
    error: VoiceInputError;
    /** Live transcript (final + interim parts) while listening. */
    transcript: string;
    /** Start listening. Resolves immediately; result arrives via state/onFinal. */
    startListening: (onFinal?: (finalTranscript: string) => void) => void;
    /** Stop listening; triggers onFinal with whatever was captured. */
    stopListening: () => void;
    reset: () => void;
}

const getRecognitionCtor = (): any => {
    if (typeof window === 'undefined') return null;
    return (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        null
    );
};

export const useVoiceInput = (): UseVoiceInputReturn => {
    const { i18n } = useTranslation();
    const [status, setStatus] = useState<VoiceInputStatus>('idle');
    const [error, setError] = useState<VoiceInputError>(null);
    const [transcript, setTranscript] = useState('');

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef('');
    const onFinalRef = useRef<((text: string) => void) | undefined>(undefined);
    const isSupported = getRecognitionCtor() !== null;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort();
                } catch (err) {
                    console.error('[useVoiceInput] Error aborting recognition:', err);
                }
            }
        };
    }, []);

    const startListening = useCallback(
        (onFinal?: (finalTranscript: string) => void) => {
            const Ctor = getRecognitionCtor();
            if (!Ctor) {
                setError('not-supported');
                setStatus('error');
                return;
            }

            // Stop any previous instance defensively
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort();
                } catch (err) {
                    devLog('[useVoiceInput] Ignored abort error on stale instance:', err);
                }
            }

            onFinalRef.current = onFinal;
            finalTranscriptRef.current = '';
            setTranscript('');
            setError(null);

            const recognition = new Ctor();
            recognition.lang = i18n.language.startsWith('en') ? 'en-US' : 'es-AR';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setStatus('listening');

            recognition.onresult = (event: any) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscriptRef.current += result[0].transcript;
                    } else {
                        interim += result[0].transcript;
                    }
                }
                setTranscript((finalTranscriptRef.current + interim).trim());
            };

            recognition.onerror = (event: any) => {
                console.error('[useVoiceInput] Recognition error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setError('permission-denied');
                    setStatus('error');
                } else if (event.error === 'no-speech') {
                    setError('no-speech');
                    setStatus('error');
                } else if (event.error !== 'aborted') {
                    setError('generic');
                    setStatus('error');
                }
            };

            recognition.onend = () => {
                recognitionRef.current = null;
                setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
                const finalText = finalTranscriptRef.current.trim();
                if (finalText && onFinalRef.current) {
                    onFinalRef.current(finalText);
                }
            };

            recognitionRef.current = recognition;
            try {
                recognition.start();
            } catch (err) {
                console.error('[useVoiceInput] Failed to start recognition:', err);
                setError('generic');
                setStatus('error');
            }
        },
        [i18n.language],
    );

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.error('[useVoiceInput] Error stopping recognition:', err);
            }
        }
    }, []);

    const reset = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch (err) {
                devLog('[useVoiceInput] Ignored abort error on stale instance:', err);
            }
            recognitionRef.current = null;
        }
        finalTranscriptRef.current = '';
        setTranscript('');
        setError(null);
        setStatus('idle');
    }, []);

    return { isSupported, status, error, transcript, startListening, stopListening, reset };
};
