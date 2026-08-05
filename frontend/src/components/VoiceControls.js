import React, { useState, useEffect } from 'react';
import useVoice from '../hooks/useVoice';
import useAmharicVoice from '../hooks/useAmharicVoice';
import { useVoiceFeedback } from '../hooks/useVoiceFeedback';
import VoiceWaveform from './VoiceWaveform';
import VoiceCommands from '../services/voiceCommands';
import './VoiceControls.css';

// ============================================================================
// VoiceControls
// Props:
//   onTranscript(text) — called with final transcript
//   onCommand(action)  — called for voice commands (English only)
//   language           — 'en' | 'am'
//   autoSend           — whether parent will auto-send on transcript
//   showWaveform       — show audio waveform while listening
//   showSuggestions    — show autocomplete suggestions (English only)
//   compact            — hide idle label
// ============================================================================

const VoiceControls = ({
    onTranscript,
    onCommand,
    language = 'en',
    autoSend = true,
    showWaveform = true,
    showSuggestions = true,
    compact = false,
}) => {
    const isAmharic = language === 'am';

    // English voice (Web Speech API)
    const enVoice = useVoice();
    // Amharic voice (MediaRecorder + TTS)
    const amVoice = useAmharicVoice();

    const {
        onStartListening,
        onStopListening,
        onError: hapticError,
    } = useVoiceFeedback();

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestionsList, setShowSuggestionsList] = useState(false);

    // ── Pick active voice state based on language ──────────────────────────
    const voice = isAmharic ? amVoice : enVoice;
    const {
        isListening,
        isSpeaking,
        transcript,
        interimTranscript,
        error,
        isSupported,
        volume,
        stopSpeaking,
        clearError,
    } = voice;

    const isTranscribing = false; // Web Speech API is real-time — no transcription delay

    // ── Handle final transcript (English: check for commands first) ────────
    useEffect(() => {
        if (!transcript) return;

        if (!isAmharic) {
            const parsed = VoiceCommands.parseVoiceInput(transcript);
            if (parsed.isCommand) {
                VoiceCommands.executeCommand(parsed.action, onCommand);
                setShowSuggestionsList(false);
                return;
            }
        }

        if (onTranscript) onTranscript(transcript);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);

    // ── English interim suggestions ────────────────────────────────────────
    useEffect(() => {
        if (!isAmharic && interimTranscript && showSuggestions) {
            const list = VoiceCommands.getSuggestions(interimTranscript);
            setSuggestions(list.slice(0, 5));
            setShowSuggestionsList(true);
        } else {
            setShowSuggestionsList(false);
        }
    }, [interimTranscript, showSuggestions, isAmharic]);

    // ── Toggle listening ───────────────────────────────────────────────────
    const toggleListening = async () => {
        if (isAmharic) {
            if (isListening) {
                amVoice.stopListening();
                onStopListening();
            } else {
                onStartListening();
                await amVoice.startListening();
            }
        } else {
            if (isListening) {
                enVoice.stopListening();
                onStopListening();
            } else {
                await enVoice.startListening();
                onStartListening();
            }
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (onTranscript) onTranscript(suggestion);
        setShowSuggestionsList(false);
    };

    // ── Not supported ──────────────────────────────────────────────────────
    if (!isSupported) {
        return (
            <div className="voice-controls voice-not-supported">
                <span className="voice-icon">🔇</span>
                <span className="voice-label">
                    {isAmharic ? 'ድምጽ አይሰራም' : 'Voice not supported'}
                </span>
                <span className="voice-hint">
                    {isAmharic ? 'Chrome ወይም Edge ተጠቀሙ' : 'Use Chrome or Edge'}
                </span>
            </div>
        );
    }

    return (
        <div className="voice-controls-wrapper">
            <div className="voice-controls">
                {/* Main mic button */}
                <button
                    className={`voice-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                    onClick={toggleListening}
                    title={
                        isTranscribing
                            ? (isAmharic ? 'እየተተረጎመ ነው...' : 'Transcribing...')
                            : isListening
                                ? (isAmharic ? 'ማዳመጥ አቁም' : 'Stop listening')
                                : (isAmharic ? 'ድምጽ ግቤት ጀምር' : 'Start voice input')
                    }
                    disabled={isSpeaking || isTranscribing}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    {isTranscribing ? '⏳' : isListening ? '⏹️' : '🎤'}
                </button>

                {/* Amharic language badge on mic button */}
                {isAmharic && (
                    <span className="am-badge" title="Amharic voice input">
                        አማ
                    </span>
                )}

                {/* Speaking indicator */}
                {isSpeaking && (
                    <span className="speaking-indicator">
                        🔊 {isAmharic ? 'እየናገረ ነው...' : 'Speaking...'}
                        <button
                            className="stop-speaking-btn"
                            onClick={stopSpeaking}
                            aria-label="Stop speaking"
                        >
                            ×
                        </button>
                    </span>
                )}

                {/* Transcribing indicator (Amharic) */}
                {isTranscribing && (
                    <span className="transcribing-indicator">
                        ⏳ {isAmharic ? 'ድምጽ እየተተረጎመ ነው...' : 'Transcribing...'}
                    </span>
                )}

                {/* Interim transcript (English) */}
                {!isAmharic && isListening && interimTranscript && (
                    <div className="interim-text">
                        <span className="interim-label">🎙️</span>
                        <span className="interim-content">{interimTranscript}</span>
                        <span className="cursor-blink">|</span>
                        {showSuggestionsList && suggestions.length > 0 && (
                            <div className="suggestions-dropdown">
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className="suggestion-item"
                                        onClick={() => handleSuggestionClick(s)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick(s)}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Amharic recording hint */}
                {isAmharic && isListening && (
                    <div className="interim-text">
                        <span className="interim-label">🎙️</span>
                        <span className="interim-content">ይናገሩ...</span>
                        <span className="cursor-blink">|</span>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="voice-error" role="alert">
                        <span className="error-icon">⚠️</span>
                        <span className="error-message">{error}</span>
                        <button
                            className="error-close"
                            onClick={() => { clearError(); hapticError(); }}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Idle status */}
                {!compact && !isListening && !isSpeaking && !error && !isTranscribing && (
                    <div className="voice-status">
                        <span className="status-dot"></span>
                        <span className="status-text">
                            {isAmharic ? 'ለመናገር 🎤 ን ጠቅ ያድርጉ' : 'Click mic to speak'}
                        </span>
                    </div>
                )}

                {/* Volume bar while listening */}
                {isListening && (
                    <div className="volume-indicator">
                        <span className="volume-label">🎙️</span>
                        <div className="volume-bar">
                            <div
                                className="volume-fill"
                                style={{ width: `${(volume || 0) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Waveform */}
            {showWaveform && isListening && (
                <div className="waveform-container">
                    <VoiceWaveform isListening={isListening} volume={volume} />
                </div>
            )}
        </div>
    );
};

export default VoiceControls;
