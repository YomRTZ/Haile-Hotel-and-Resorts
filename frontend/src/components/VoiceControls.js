import React, { useState, useEffect } from 'react';
import useVoice from '../hooks/useVoice';
import { useVoiceFeedback } from '../hooks/useVoiceFeedback';
import VoiceWaveform from './VoiceWaveform';
import VoiceCommands from '../services/voiceCommands';
import './VoiceControls.css';

const VoiceControls = ({
    onTranscript,
    onCommand,
    autoSend = true,
    showWaveform = true,
    showSuggestions = true,
    compact = false,   // compact mode — just mic button, no idle text
}) => {
    const {
        isListening,
        isSpeaking,
        transcript,
        interimTranscript,
        error,
        isSupported,
        volume,
        startListening,
        stopListening,
        stopSpeaking,
        clearError,
    } = useVoice();

    const {
        onStartListening,
        onStopListening,
        onError: hapticError,
        onSuccess,
    } = useVoiceFeedback();

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestionsList, setShowSuggestionsList] = useState(false);

    // Handle final transcript — check for commands or send as message
    useEffect(() => {
        if (!transcript) return;

        const parsed = VoiceCommands.parseVoiceInput(transcript);

        if (parsed.isCommand) {
            VoiceCommands.executeCommand(parsed.action, onCommand);
            setShowSuggestionsList(false);
        } else if (onTranscript) {
            // Always forward the transcript — parent decides whether to auto-send
            onTranscript(transcript);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript]);

    // Show suggestions while user is speaking (interim)
    useEffect(() => {
        if (interimTranscript && showSuggestions) {
            const list = VoiceCommands.getSuggestions(interimTranscript);
            setSuggestions(list.slice(0, 5));
            setShowSuggestionsList(true);
        } else {
            setShowSuggestionsList(false);
        }
    }, [interimTranscript, showSuggestions]);

    const toggleListening = async () => {
        if (isListening) {
            stopListening();
            onStopListening();
        } else {
            await startListening();
            onStartListening();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (onTranscript) {
            onTranscript(suggestion);
        }
        setShowSuggestionsList(false);
    };

    if (!isSupported) {
        return (
            <div className="voice-controls voice-not-supported">
                <span className="voice-icon">🔇</span>
                <span className="voice-label">Voice not supported</span>
                <span className="voice-hint">Use Chrome or Edge</span>
            </div>
        );
    }

    return (
        <div className="voice-controls-wrapper">
            <div className="voice-controls">
                {/* Main mic button */}
                <button
                    className={`voice-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
                    onClick={toggleListening}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                    disabled={isSpeaking}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    {isListening ? '⏹️' : '🎤'}
                </button>

                {/* Speaking indicator */}
                {isSpeaking && (
                    <span className="speaking-indicator">
                        🔊 Speaking...
                        <button
                            className="stop-speaking-btn"
                            onClick={stopSpeaking}
                            aria-label="Stop speaking"
                        >
                            ×
                        </button>
                    </span>
                )}

                {/* Interim transcript display with suggestions */}
                {isListening && interimTranscript && (
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

                {/* Error display */}
                {error && (
                    <div className="voice-error" role="alert">
                        <span className="error-icon">⚠️</span>
                        <span className="error-message">{error}</span>
                        <button
                            className="error-close"
                            onClick={() => {
                                clearError();
                                hapticError();
                            }}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Idle status — hidden in compact mode */}
                {!compact && !isListening && !isSpeaking && !error && (
                    <div className="voice-status">
                        <span className="status-dot"></span>
                        <span className="status-text">Click mic to speak</span>
                    </div>
                )}

                {/* Volume indicator while listening */}
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

            {/* Waveform canvas */}
            {showWaveform && isListening && (
                <div className="waveform-container">
                    <VoiceWaveform isListening={isListening} volume={volume} />
                </div>
            )}
        </div>
    );
};

export default VoiceControls;
