import { useState, useEffect, useCallback, useRef } from 'react';
import voiceService from '../services/voiceService';

// ============================================
// useVoice - Custom Hook for Voice Features
// ============================================

export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [volume, setVolume] = useState(0);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState('unknown');
    const recognitionRef = useRef(null);

    // Check support on mount
    useEffect(() => {
        const supported = voiceService.isSupported();
        setIsSupported(supported);

        if (supported) {
            voiceService.checkMicrophonePermission().then(setPermissionStatus);
        }
    }, []);

    // ============================================
    // START LISTENING
    // ============================================
    const startListening = useCallback(async () => {
        if (!isSupported) {
            setError('Voice recognition is not supported in this browser');
            return;
        }

        if (permissionStatus === 'denied') {
            setError('Please allow microphone access in your browser settings');
            return;
        }

        if (permissionStatus === 'unknown' || permissionStatus === 'prompt') {
            const granted = await voiceService.requestMicrophonePermission();
            if (!granted) {
                setError('Microphone access is required for voice input');
                return;
            }
            setPermissionStatus('granted');
        }

        setError(null);
        setTranscript('');
        setInterimTranscript('');
        setIsListening(true);

        const recognition = voiceService.startListening(
            // Final result
            (finalText) => {
                setTranscript(finalText);
                setInterimTranscript('');
                setIsListening(false);
                setVolume(0);
            },
            // Interim result
            (interimText) => {
                setInterimTranscript(interimText);
                // Simulate a volume pulse while words are being detected
                setVolume(0.4 + Math.random() * 0.5);
            },
            // Error
            (errorMsg) => {
                setError(errorMsg);
                setIsListening(false);
                setVolume(0);
            },
            // End
            () => {
                setIsListening(false);
                setVolume(0);
            }
        );

        recognitionRef.current = recognition;
    }, [isSupported, permissionStatus]);

    // ============================================
    // STOP LISTENING
    // ============================================
    const stopListening = useCallback(() => {
        voiceService.stopListening();
        setIsListening(false);
        setVolume(0);
        recognitionRef.current = null;
    }, []);

    // ============================================
    // SPEAK TEXT
    // ============================================
    const speak = useCallback((text, options = {}) => {
        if (!voiceService.isSpeechSynthesisSupported()) {
            setError('Speech synthesis is not supported');
            return;
        }

        setIsSpeaking(true);

        const success = voiceService.speak(text, {
            ...options,
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });

        if (!success) {
            setIsSpeaking(false);
            setError('Failed to speak text');
        }
    }, []);

    // ============================================
    // STOP SPEAKING
    // ============================================
    const stopSpeaking = useCallback(() => {
        voiceService.stopSpeaking();
        setIsSpeaking(false);
    }, []);

    // ============================================
    // CLEANUP ON UNMOUNT
    // ============================================
    useEffect(() => {
        return () => {
            if (isListening) voiceService.stopListening();
            if (isSpeaking) voiceService.stopSpeaking();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        // State
        isListening,
        isSpeaking,
        transcript,
        interimTranscript,
        volume,
        error,
        isSupported,
        permissionStatus,

        // Methods
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        clearError: () => setError(null),
    };
};

export default useVoice;
