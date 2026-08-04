import React, { useState, useEffect, useRef } from 'react';
import VoiceControls from './VoiceControls';
import useVoice from '../hooks/useVoice';
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

    // Voice hook for speaking responses aloud
    const { speak, isSpeaking, stopSpeaking } = useVoice();

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await getChatHistory(sessionId);
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages);
                } else {
                    setMessages([{
                        role: 'assistant',
                        content: '👋 Welcome to Haile Resort Hawassa! How can I assist you today?'
                    }]);
                }
            } catch (error) {
                console.error('Failed to load history:', error);
                setMessages([{
                    role: 'assistant',
                    content: '👋 Welcome to Haile Resort Hawassa! How can I assist you today?'
                }]);
            }
        };
        loadHistory();
    }, [sessionId]);

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
            const data = await sendMessage(text, sessionId);
            const botResponse = data.response;

            setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);

            // Auto-speak response if enabled
            if (autoSpeak) {
                speak(botResponse);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I had trouble processing your request. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================
    // HANDLE VOICE INPUT
    // ============================================
    const handleVoiceTranscript = (transcript) => {
        setInput(transcript);
        // Auto-send after a short delay so the user can see what was transcribed
        setTimeout(() => handleSendMessage(transcript), 500);
    };

    // ============================================
    // CLEAR CHAT
    // ============================================
    const handleClearChat = async () => {
        try {
            await clearChatHistory(sessionId);
            if (isSpeaking) stopSpeaking();
            setMessages([{
                role: 'assistant',
                content: '👋 Chat cleared! How can I help you?'
            }]);
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
                    <h1>🏨 Haile Resort Hawassa</h1>
                    <p>Your AI Concierge</p>
                </div>
                <div className="controls">
                    <VoiceControls onTranscript={handleVoiceTranscript} />
                    <button
                        className="speak-toggle-btn"
                        onClick={() => setAutoSpeak(prev => !prev)}
                        title={autoSpeak ? 'Auto-speak on (click to disable)' : 'Auto-speak off (click to enable)'}
                        aria-label={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
                    >
                        {autoSpeak ? '🔊' : '🔇'}
                    </button>
                    <button
                        className="clear-btn"
                        onClick={handleClearChat}
                        title="Clear chat history"
                        aria-label="Clear chat"
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
                    >
                        <div className="message-content">
                            {msg.content.split('\n').map((line, i) => (
                                line ? <p key={i}>{line}</p> : null
                            ))}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message bot-message" aria-label="Loading response">
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

            {/* Input */}
            <div className="chat-input-area">
                <div className="input-wrapper">
                    <label htmlFor="userInput" className="sr-only">Type your message</label>
                    <input
                        type="text"
                        id="userInput"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your question or use voice..."
                        disabled={isLoading}
                        maxLength={1000}
                        autoComplete="off"
                    />
                    <button
                        className="send-btn"
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !input.trim()}
                        aria-label="Send message"
                    >
                        {isLoading ? '⏳' : 'Send'}
                    </button>
                </div>
                <div className="input-hint">
                    <span>💡 Try: "What rooms do you have?" or click 🎤 to speak</span>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
