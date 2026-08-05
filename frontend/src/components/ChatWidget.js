import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getChatHistory, clearChatHistory } from '../services/api';
import useVoice from '../hooks/useVoice';
import useAmharicVoice from '../hooks/useAmharicVoice';
import VoiceControls from './VoiceControls';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import './ChatWidget.css';

// Stable session ID per browser
const getSessionId = () => {
    let sid = localStorage.getItem('chatSessionId');
    if (!sid) {
        sid = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('chatSessionId', sid);
    }
    return sid;
};

const QUICK_QUESTIONS_EN = [
    '🛏️ Room types & prices',
    '🕐 Check-in / check-out',
    '🏊 Pool & spa info',
    '🍽️ Dining options',
    '🐾 Pet policy',
    '🚗 Parking',
];

const QUICK_QUESTIONS_AM = [
    '🛏️ ክፍሎችና ዋጋዎች',
    '🕐 ቼክ-ኢን / ቼክ-አውት',
    '🏊 ገንዳ እና ስፓ',
    '🍽️ ምግብ ቤቶች',
    '🐾 የቤት እንስሳ ፖሊሲ',
    '🚗 ፓርኪንግ',
];

function TypingDots() {
    return (
        <div className="cw-msg cw-msg--bot">
            <div className="cw-avatar">🏨</div>
            <div className="cw-bubble cw-bubble--typing">
                <span /><span /><span />
            </div>
        </div>
    );
}

export default function ChatWidget({ isOpen, onToggle }) {
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const isAmharic = language === 'am';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(getSessionId);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const enVoice = useVoice();
    const amVoice = useAmharicVoice();

    // Pick the right speak/stop based on current language
    const { speak, isSpeaking, stopSpeaking } = isAmharic ? amVoice : enVoice;

    const welcomeMessage = isAmharic
        ? `👋 እንኳን ወደ ሃይሌ ሪዞርት አዋሳ በደህና መጡ${user ? '፣ ' + user.name.split(' ')[0] : ''}! እንዴት ልረዳዎ እችላለሁ?`
        : `👋 Welcome${user ? ', ' + user.name.split(' ')[0] : ''}! I'm your Haile Resort Hawassa concierge. How can I help you today?`;

    const QUICK_QUESTIONS = isAmharic ? QUICK_QUESTIONS_AM : QUICK_QUESTIONS_EN;

    // Reset messages and reload when language changes
    useEffect(() => {
        setMessages([{
            role: 'assistant',
            content: isAmharic
                ? `👋 እንኳን ወደ ሃይሌ ሪዞርት አዋሳ በደህና መጡ${user ? '፣ ' + user.name.split(' ')[0] : ''}! እንዴት ልረዳዎ እችላለሁ?`
                : `👋 Welcome${user ? ', ' + user.name.split(' ')[0] : ''}! I'm your Haile Resort Hawassa concierge. How can I help you today?`,
            timestamp: new Date().toISOString(),
        }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    // Load history on first open
    useEffect(() => {
        if (!isOpen) return;
        setUnread(0);
        if (messages.length > 0) return;

        (async () => {
            try {
                const data = await getChatHistory(sessionId);
                if (data.messages?.length > 0) {
                    setMessages(data.messages);
                } else {
                    setMessages([{ role: 'assistant', content: welcomeMessage, timestamp: new Date().toISOString() }]);
                }
            } catch {
                setMessages([{ role: 'assistant', content: welcomeMessage, timestamp: new Date().toISOString() }]);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [isOpen]);

    const handleSend = async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        setInput('');
        setMessages(prev => [...prev, {
            role: 'user',
            content: msg,
            timestamp: new Date().toISOString(),
        }]);
        setLoading(true);

        try {
            const data = await sendMessage(msg, sessionId, language);
            const reply = data.response;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString(),
            }]);

            if (autoSpeak) speak(reply);
            if (!isOpen) setUnread(c => c + 1);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: isAmharic
                    ? '⚠️ ይቅርታ፣ ጥያቄዎን ማስኬድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
                    : '⚠️ Sorry, I couldn\'t process that. Please try again.',
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        try {
            await clearChatHistory(sessionId);
        } catch { /* best-effort */ }
        if (isSpeaking) stopSpeaking();
        setMessages([{
            role: 'assistant',
            content: isAmharic
                ? '🔄 ውይይቱ ተጸድቷል! እንዴት ልረዳዎ እችላለሁ?'
                : '🔄 Chat cleared! How can I help you?',
            timestamp: new Date().toISOString(),
        }]);
    };

    const handleVoiceTranscript = (transcript) => {
        setInput(transcript);
        setTimeout(() => handleSend(transcript), 400);
    };

    const formatTime = (ts) => ts
        ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    // Quick questions — send the label text directly (Amharic or English)
    // Strip only the leading emoji+space before sending
    const sendQuickQuestion = (q) => handleSend(q.replace(/^[\p{Emoji}\u200d]+\s*/u, ''));

    return (
        <>
            {/* Floating toggle button */}
            <button
                className={`cw-fab ${isOpen ? 'cw-fab--open' : ''}`}
                onClick={onToggle}
                aria-label={isOpen ? 'Close chat' : 'Open AI concierge'}
            >
                {isOpen ? '✕' : '💬'}
                {!isOpen && unread > 0 && (
                    <span className="cw-fab__badge">{unread}</span>
                )}
                {!isOpen && (
                    <span className="cw-fab__ripple" />
                )}
            </button>

            {/* Chat panel */}
            <div className={`cw-panel ${isOpen ? 'cw-panel--open' : ''}`} role="dialog" aria-label="AI Concierge">
                {/* Header */}
                <div className="cw-header">
                    {/* Top row: actions pinned to the right */}
                    <div className="cw-header__top">
                        <div className="cw-header__actions">
                            <LanguageToggle />
                            <button
                                className={`cw-icon-btn ${autoSpeak ? 'active' : ''}`}
                                onClick={() => { setAutoSpeak(p => !p); if (isSpeaking) stopSpeaking(); }}
                                title={autoSpeak ? t.speakToggleOn : t.speakToggleOff}
                            >
                                {autoSpeak ? '🔊' : '🔇'}
                            </button>
                            <button className="cw-icon-btn" onClick={handleClear} title={isAmharic ? 'ውይይቱን አጽዳ' : 'Clear chat'}>
                                🗑️
                            </button>
                            <button className="cw-icon-btn cw-close" onClick={onToggle} aria-label="Close">
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Bottom row: avatar + title + status */}
                    <div className="cw-header__bottom">
                        <div className="cw-header__avatar">🏨</div>
                        <div>
                            <strong>{isAmharic ? 'ሃይሌ ሪዞርት ኮንሲርጅ' : 'Haile Resort Concierge'}</strong>
                            <span>
                                <span className="cw-status-dot" />
                                {isAmharic ? 'በመስመር ላይ · AI-powered' : 'Online · AI-powered'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="cw-messages" role="list" aria-live="polite">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`cw-msg ${msg.role === 'user' ? 'cw-msg--user' : 'cw-msg--bot'}`}
                            role="listitem"
                        >
                            {msg.role === 'assistant' && (
                                <div className="cw-avatar">🏨</div>
                            )}
                            <div className="cw-msg__body">
                                <div className="cw-bubble">
                                    {msg.content.split('\n').map((line, j) =>
                                        line ? <p key={j}>{line}</p> : null
                                    )}
                                </div>
                                <span className="cw-time">{formatTime(msg.timestamp)}</span>
                            </div>
                            {msg.role === 'user' && (
                                <div className="cw-avatar cw-avatar--user">
                                    {user ? user.name[0].toUpperCase() : '👤'}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && <TypingDots />}

                    {/* Quick questions — only show at the start */}
                    {messages.length === 1 && !loading && (
                        <div className="cw-quick-wrap">
                            <p className="cw-quick-label">
                                {isAmharic ? 'ፈጣን ጥያቄዎች:' : 'Quick questions:'}
                            </p>
                            <div className="cw-quick-btns">
                                {QUICK_QUESTIONS.map((q) => (
                                    <button
                                        key={q}
                                        className="cw-quick-btn"
                                        onClick={() => sendQuickQuestion(q)}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="cw-input-area">
                    <VoiceControls
                        onTranscript={handleVoiceTranscript}
                        showWaveform={false}
                        showSuggestions={false}
                        autoSend={false}
                        compact={true}
                        language={language}
                    />

                    <div className="cw-input-row">
                        <label htmlFor="cw-input" className="sr-only">
                            {isAmharic ? 'መልዕክትዎን ይጻፉ' : 'Type your message'}
                        </label>
                        <input
                            id="cw-input"
                            ref={inputRef}
                            type="text"
                            className="cw-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder={isAmharic ? 'ጥያቄዎን ይጻፉ...' : 'Ask me anything…'}
                            disabled={loading}
                            maxLength={1000}
                            autoComplete="off"
                            lang={isAmharic ? 'am' : 'en'}
                        />
                        <button
                            className="cw-send-btn"
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            aria-label={isAmharic ? 'ላክ' : 'Send'}
                        >
                            {loading ? <span className="cw-spinner" /> : '➤'}
                        </button>
                    </div>

                    <p className="cw-footer-note">
                        {isAmharic
                            ? 'በሃይሌ ሪዞርት AI የሚሰራ'
                            : <>Powered by Haile Resort AI · <a href="#contact">Contact us</a></>
                        }
                    </p>
                </div>
            </div>

            {/* Backdrop on mobile */}
            {isOpen && <div className="cw-backdrop" onClick={onToggle} />}
        </>
    );
}
