import React, { useState, useEffect } from 'react';
import voiceService from '../services/voiceService';
import './VoiceSettings.css';

const VoiceSettings = ({ onSettingsChange }) => {
    const [settings, setSettings] = useState({
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voiceGender: 'female',
        autoSpeak: true,
        showInterimResults: true,
        language: 'en-US',
    });
    // availableVoices is loaded from the service directly (it's an array, not a method)
    const [availableVoices, setAvailableVoices] = useState([]);

    useEffect(() => {
        // voiceService.availableVoices is a plain array populated after voices load
        const loadVoices = () => {
            const voices = voiceService.availableVoices || [];
            setAvailableVoices(voices);
        };

        // Voices may not be ready immediately — listen for the event
        loadVoices();
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Load saved settings
        try {
            const savedSettings = localStorage.getItem('voiceSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            localStorage.setItem('voiceSettings', JSON.stringify(newSettings));
        } catch {
            // Ignore storage errors
        }
        if (onSettingsChange) onSettingsChange(newSettings);
    };

    const testVoice = () => {
        voiceService.speak('Hello! This is a test of your voice settings.', {
            rate: settings.rate,
            pitch: settings.pitch,
            volume: settings.volume,
        });
    };

    return (
        <div className="voice-settings">
            <h3>🎤 Voice Settings</h3>

            <div className="setting-group">
                <label>
                    <span>Speech Rate</span>
                    <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={settings.rate}
                        onChange={(e) => updateSetting('rate', parseFloat(e.target.value))}
                    />
                    <span className="value">{settings.rate.toFixed(1)}x</span>
                </label>
            </div>

            <div className="setting-group">
                <label>
                    <span>Pitch</span>
                    <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={settings.pitch}
                        onChange={(e) => updateSetting('pitch', parseFloat(e.target.value))}
                    />
                    <span className="value">{settings.pitch.toFixed(1)}</span>
                </label>
            </div>

            <div className="setting-group">
                <label>
                    <span>Volume</span>
                    <input
                        type="range"
                        min="0"
                        max="1.0"
                        step="0.1"
                        value={settings.volume}
                        onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                    />
                    <span className="value">{Math.round(settings.volume * 100)}%</span>
                </label>
            </div>

            <div className="setting-group">
                <label>
                    <span>Voice Gender</span>
                    <select
                        value={settings.voiceGender}
                        onChange={(e) => updateSetting('voiceGender', e.target.value)}
                    >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="neutral">Neutral</option>
                    </select>
                </label>
            </div>

            {availableVoices.length > 0 && (
                <div className="setting-group">
                    <label>
                        <span>Voice</span>
                        <select
                            onChange={(e) => updateSetting('voiceName', e.target.value)}
                            value={settings.voiceName || ''}
                        >
                            <option value="">Auto-select</option>
                            {availableVoices
                                .filter(v => v.lang.startsWith('en'))
                                .map(v => (
                                    <option key={v.name} value={v.name}>{v.name}</option>
                                ))}
                        </select>
                    </label>
                </div>
            )}

            <div className="setting-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.autoSpeak}
                        onChange={(e) => updateSetting('autoSpeak', e.target.checked)}
                    />
                    Auto-speak responses
                </label>
            </div>

            <div className="setting-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.showInterimResults}
                        onChange={(e) => updateSetting('showInterimResults', e.target.checked)}
                    />
                    Show interim voice results
                </label>
            </div>

            <button className="test-voice-btn" onClick={testVoice}>
                🔊 Test Voice
            </button>
        </div>
    );
};

export default VoiceSettings;
