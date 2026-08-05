import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageToggle.css';

const LanguageToggle = () => {
    const { language, switchLanguage, LANGUAGES } = useLanguage();

    return (
        <div className="language-toggle" role="group" aria-label="Select language">
            {Object.values(LANGUAGES).map((lang) => (
                <button
                    key={lang.code}
                    className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                    onClick={() => switchLanguage(lang.code)}
                    aria-pressed={language === lang.code}
                    title={lang.label}
                >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-label">{lang.label}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageToggle;
