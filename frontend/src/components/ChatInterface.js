import React, { useState, useEffect, useRef } from 'react';
import VoiceControls from './VoiceControls';
import LanguageToggle from './LanguageToggle';
import useVoice from '../hooks/useVoice';
import useAmharicVoice from '../hooks/useAmharicVoice';
import { useLanguage } from '../context/LanguageContext';
import { sendMessage, getChatHistory, clearChatHistory } from '../services/api';
import './ChatInterface.css';

// Stable session ID generation using localStorage
const getOrCreateSessionId = () => {
    let sid = localStorage.getItem('chatSessionId');
    if (!sid) {
        sid = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('chatSessionId', sid);
    }
    return sid;
};

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(getOrCreateSessionId);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const messagesEndRef = useRef(null);

    // Language context
    const { language, t } = useLanguage();
    const isAmharic = language === 'am';

    // English voice hook (Web Speech API)
    const enVoice = useVoice();
    // Amharic voice hook (MediaRecorder + Groq Whisper + Google TTS)
    const amVoice = useAmharicVoice();

    // Pick the active voice hook based on language
    const voice = isAmharic ? amVoice : enVoice;

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Load history / set welcome message when language changes
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await getChatHistory(sessionId);
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages);
                } else {
                    setMessages([{ role: 'assistant', content: t.welcomeMessage }]);
                }
            } catch (error) {
                console.error('Failed to load history:', error);
                setMessages([{ role: 'assistant', content: t.welcomeMessage }]);
            }
        };
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, language]);

    // ============================================
    // SEND MESSAGE
    // ============================================
    const handleSendMessage = async (messageText) => {
        const text = (messageText || input).trim();
        if (!text || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setIsLoading(true);

        try {
            const data = await sendMessage(text, sessionId, language);
            const botResponse = data.response;

            setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);

            // Auto-speak response if enabled
            if (autoSpeak) {
                if (isAmharic) {
                    // Use backend TTS for Amharic
                    amVoice.speak(botResponse);
                } else {
                    // Use browser TTS for English
                    enVoice.speak(botResponse);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t.errorMessage,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================
    // HANDLE VOICE INPUT
    // ============================================
    const handleVoiceTranscript = (transcript) => {
        if (!transcript?.trim()) return;
        setInput(transcript);
        setTimeout(() => handleSendMessage(transcript), 500);
    };

    // ============================================
    // CLEAR CHAT
    // ============================================
    const handleClearChat = async () => {
        try {
            await clearChatHistory(sessionId);
            if (voice.isSpeaking) voice.stopSpeaking();
            setMessages([{ role: 'assistant', content: t.clearMessage }]);
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="header-content">
                    <h1>🏨 {isAmharic ? 'ሃይሌ ሪዞርት አዋሳ' : 'Haile Resort Hawassa'}</h1>
                    <p>{isAmharic ? 'ምናባዊ ኮንሲርጅዎ' : 'Your AI Concierge'}</p>
                </div>
                <div className="controls">
                    {/* Language toggle */}
                    <LanguageToggle />

                    {/* Voice controls — switches automatically based on language */}
                    <VoiceControls
                        onTranscript={handleVoiceTranscript}
                        language={language}
                    />

                    {/* Auto-speak toggle */}
                    <button
                        className="speak-toggle-btn"
                        onClick={() => setAutoSpeak(prev => !prev)}
                        title={autoSpeak ? t.speakToggleOn : t.speakToggleOff}
                        aria-label={autoSpeak ? t.speakToggleOn : t.speakToggleOff}
                    >
                        {autoSpeak ? '🔊' : '🔇'}
                    </button>

                    {/* Clear chat */}
                    <button
                        className="clear-btn"
                        onClick={handleClearChat}
                        title={isAmharic ? 'ውይይቱን አጽዳ' : 'Clear chat history'}
                        aria-label={isAmharic ? 'ውይይቱን አጽዳ' : 'Clear chat'}
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" role="list" aria-live="polite">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
                        role="listitem"
                        dir={isAmharic ? 'ltr' : 'ltr'} // Ethiopic script is LTR
                    >
                        <div className="message-content">
                            {msg.content.split('\n').map((line, i) => (
                                line ? <p key={i}>{line}</p> : null
                            ))}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message bot-message" aria-label={isAmharic ? 'ምላሽ በመጠበቅ ላይ...' : 'Loading response'}>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Amharic recording indicator */}
            {isAmharic && amVoice.isListening && (
                <div className="transcribing-status" role="status" aria-live="polite">
                    <span className="spinner">🎙️</span>
                    <span>ድምጽ እየተቀረጸ ነው...</span>
                </div>
            )}

            {/* Input */}
            <div className="chat-input-area">
                <div className="input-wrapper">
                    <label htmlFor="userInput" className="sr-only">
                        {isAmharic ? 'መልዕክትዎን ይጻፉ' : 'Type your message'}
                    </label>
                    <input
                        type="text"
                        id="userInput"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={t.placeholder}
                        disabled={isLoading}
                        maxLength={1000}
                        autoComplete="off"
                        lang={isAmharic ? 'am' : 'en'}
                    />
                    <button
                        className="send-btn"
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !input.trim()}
                        aria-label={isAmharic ? 'ላክ' : 'Send message'}
                    >
                        {isLoading ? '⏳' : t.sending}
                    </button>
                </div>
                <div className="input-hint">
                    <span>{t.hint}</span>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
