import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Supported languages ────────────────────────────────────────────────────
export const LANGUAGES = {
    en: {
        code: 'en',
        label: 'English',
        flag: '🇬🇧',
        whisperCode: 'en',
        ttsLocale: 'en',
        welcomeMessage: '👋 Welcome to Haile Resort Hawassa! How can I assist you today?',
        placeholder: 'Type your question or use voice...',
        hint: '💡 Try: "What rooms do you have?" or click 🎤 to speak',
        clearMessage: '👋 Chat cleared! How can I help you?',
        speakToggleOn: 'Auto-speak on (click to disable)',
        speakToggleOff: 'Auto-speak off (click to enable)',
        micStart: 'Start voice input',
        micStop: 'Stop listening',
        sending: 'Send',
        errorMessage: 'Sorry, I had trouble processing your request. Please try again.',
    },
    am: {
        code: 'am',
        label: 'አማርኛ',
        flag: '🇪🇹',
        whisperCode: 'am',
        ttsLocale: 'am',
        welcomeMessage: '👋 እንኳን ወደ ሃይሌ ሪዞርት አዋሳ በደህና መጡ! እንዴት ልረዳዎ እችላለሁ?',
        placeholder: 'ጥያቄዎን ይጻፉ ወይም 🎤 ን ተጠቀሙ...',
        hint: '💡 ሞክሩ: "ምን ዓይነት ክፍሎች አሉ?" ወይም 🎤 ን ጠቅ ያድርጉ',
        clearMessage: '👋 ውይይቱ ተጸድቷል! እንዴት ልረዳዎ እችላለሁ?',
        speakToggleOn: 'ድምጽ አንብብ (ለማጥፋት ጠቅ ያድርጉ)',
        speakToggleOff: 'ድምጽ ጸጥ ብሏል (ለማብራት ጠቅ ያድርጉ)',
        micStart: 'ድምጽ ግቤት ጀምር',
        micStop: 'ማዳመጥ አቁም',
        sending: 'ላክ',
        errorMessage: 'ይቅርታ፣ ጥያቄዎን ማስኬድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    },
};

// ─── Context ────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        try {
            const saved = localStorage.getItem('haile_language');
            return saved && LANGUAGES[saved] ? saved : 'en';
        } catch {
            return 'en';
        }
    });

    const switchLanguage = useCallback((code) => {
        if (!LANGUAGES[code]) return;
        setLanguage(code);
        try {
            localStorage.setItem('haile_language', code);
        } catch {}
    }, []);

    const t = LANGUAGES[language];

    return (
        <LanguageContext.Provider value={{ language, switchLanguage, t, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
    return ctx;
};

export default LanguageContext;
