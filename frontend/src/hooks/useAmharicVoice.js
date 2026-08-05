import { useState, useCallback, useEffect } from 'react';
import amharicVoiceService from '../services/amharicVoiceService';

// ============================================================================
// useAmharicVoice
//
// STT : Web Speech API  lang='am-ET'  (free, Chrome/Edge)
// TTS : backend Google Translate TTS  (free, no API key)
//
// Mirrors the shape of useVoice so VoiceControls can swap it in seamlessly.
// ============================================================================

const useAmharicVoice = () => {
    const [isListening,    setIsListening]    = useState(false);
    const [isSpeaking,     setIsSpeaking]     = useState(false);
    const [transcript,     setTranscript]     = useState('');
    const [interimTranscript, setInterim]     = useState('');
    const [volume,         setVolume]         = useState(0);
    const [error,          setError]          = useState(null);
    const [isSupported,    setIsSupported]    = useState(false);

    // Check support in the browser (not at module load / SSR)
    useEffect(() => {
        setIsSupported(amharicVoiceService.isSupported());
    }, []);

    // ── Start listening ──────────────────────────────────────────────────────
    const startListening = useCallback(async () => {
        if (isListening) return;
        setError(null);
        setTranscript('');
        setInterim('');

        amharicVoiceService.startListening({
            onStart: () => {
                setIsListening(true);
                setVolume(0.5);
            },
            onInterim: (text) => {
                setInterim(text);
                setVolume(0.4 + Math.random() * 0.5);
            },
            onResult: (text) => {
                setTranscript(text);
                setInterim('');
                setIsListening(false);
                setVolume(0);
            },
            onError: (msg) => {
                setError(msg);
                setIsListening(false);
                setVolume(0);
            },
            onEnd: () => {
                setIsListening(false);
                setVolume(0);
            },
        });
    }, [isListening]);

    // ── Stop listening ───────────────────────────────────────────────────────
    const stopListening = useCallback(() => {
        amharicVoiceService.stopListening();
        setIsListening(false);
        setVolume(0);
    }, []);

    // ── TTS speak ────────────────────────────────────────────────────────────
    const speak = useCallback(async (text, options = {}) => {
        if (!text?.trim()) return;
        setIsSpeaking(true);
        await amharicVoiceService.speak(text, 'am', {
            onStart: () => setIsSpeaking(true),
            onEnd:   () => { setIsSpeaking(false); if (options.onEnd) options.onEnd(); },
            onError: (msg) => { setIsSpeaking(false); console.error('TTS:', msg); },
        });
    }, []);

    // ── Stop TTS ─────────────────────────────────────────────────────────────
    const stopSpeaking = useCallback(() => {
        amharicVoiceService.stopSpeaking();
        setIsSpeaking(false);
    }, []);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            amharicVoiceService.stopListening();
            amharicVoiceService.stopSpeaking();
        };
    }, []);

    return {
        isListening,
        isTranscribing: false,   // Web Speech API is real-time — no separate transcription step
        isSpeaking,
        transcript,
        interimTranscript,
        volume,
        error,
        isSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        clearError: () => setError(null),
    };
};

export default useAmharicVoice;
