import { useRef, useCallback } from 'react';

// ============================================
// VOICE FEEDBACK - Audio & Visual Cues
// ============================================

export const useVoiceFeedback = () => {
    const audioContextRef = useRef(null);

    // ============================================
    // PLAY BEEP SOUND
    // ============================================
    const playBeep = useCallback((frequency = 800, duration = 100) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration / 1000);
        } catch (error) {
            // Audio context might not be available
            console.log('Audio feedback not available');
        }
    }, []);

    // ============================================
    // HAPTIC FEEDBACK (Vibration)
    // ============================================
    const vibrate = useCallback((pattern = 50) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    // ============================================
    // START LISTENING FEEDBACK
    // ============================================
    const onStartListening = useCallback(() => {
        playBeep(1200, 150);
        vibrate(50);
    }, [playBeep, vibrate]);

    // ============================================
    // STOP LISTENING FEEDBACK
    // ============================================
    const onStopListening = useCallback(() => {
        playBeep(800, 100);
        vibrate(30);
    }, [playBeep, vibrate]);

    // ============================================
    // ERROR FEEDBACK
    // ============================================
    const onError = useCallback(() => {
        playBeep(400, 200);
        vibrate([50, 100, 50]);
    }, [playBeep, vibrate]);

    // ============================================
    // SUCCESS FEEDBACK
    // ============================================
    const onSuccess = useCallback(() => {
        playBeep(1000, 100);
        playBeep(1200, 100);
    }, [playBeep]);

    return {
        onStartListening,
        onStopListening,
        onError,
        onSuccess,
        vibrate,
        playBeep,
    };
};