import { useState, useCallback, useEffect } from 'react';
import amharicVoiceService from '../services/amharicVoiceService';

// ============================================================================
// useAmharicVoice
// Mirrors the shape of useVoice so components can swap it in seamlessly.
// STT: MediaRecorder → OpenAI Whisper via backend
// TTS: backend → Google Translate TTS audio
// ============================================================================

const useAmharicVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false); // waiting for Whisper
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const isSupported = amharicVoiceService.isSupported();

    // ── Start recording ──────────────────────────────────────────────────────
    const startListening = useCallback(async () => {
        if (isListening || isTranscribing) return;
        setError(null);
        setTranscript('');

        await amharicVoiceService.startRecording(
            () => setIsListening(true),          // onStart
            (msg) => { setError(msg); setIsListening(false); }, // onError
            () => setIsListening(false),         // onEnd (before transcription)
        );
    }, [isListening, isTranscribing]);

    // ── Stop recording + transcribe ──────────────────────────────────────────
    const stopListening = useCallback(async () => {
        if (!isListening) return;
        setIsListening(false);
        setIsTranscribing(true);
        try {
            const { transcript: text } = await amharicVoiceService.stopRecording();
            setTranscript(text);
        } catch (err) {
            setError('የድምጽ ግቤቱን ማስኬድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
            console.error('Whisper transcription error:', err.message);
        } finally {
            setIsTranscribing(false);
        }
    }, [isListening]);

    // ── TTS speak ────────────────────────────────────────────────────────────
    const speak = useCallback(async (text, options = {}) => {
        if (!text?.trim()) return;
        setIsSpeaking(true);
        await amharicVoiceService.speak(text, 'am', {
            onStart: () => setIsSpeaking(true),
            onEnd: () => { setIsSpeaking(false); if (options.onEnd) options.onEnd(); },
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
            if (isListening) amharicVoiceService.mediaRecorder?.stop();
            amharicVoiceService.stopSpeaking();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        isListening,
        isTranscribing, // extra: show spinner while Whisper processes
        isSpeaking,
        transcript,
        interimTranscript: isListening ? '...' : '', // no real-time for Whisper
        volume: isListening ? 0.6 : 0,
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
