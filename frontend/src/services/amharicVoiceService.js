// ============================================================================
// AMHARIC VOICE SERVICE
//
// STT : Web Speech API  — lang 'am-ET'  (FREE, no API key, Chrome/Edge)
//       Falls back to a helpful error if the browser doesn't support it.
//
// TTS : backend → Google Translate TTS (FREE, no API key)
// ============================================================================

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AmharicVoiceService {
    constructor() {
        this.recognition   = null;
        this.isRecording   = false;
        this.audioPlayer   = null;
        this.isPlaying     = false;
        this._initAudioPlayer();
    }

    // ── Audio player for TTS playback ────────────────────────────────────────
    _initAudioPlayer() {
        if (typeof window === 'undefined') return;
        this.audioPlayer          = new Audio();
        this.audioPlayer.onended  = () => { this.isPlaying = false; };
        this.audioPlayer.onerror  = () => { this.isPlaying = false; };
    }

    // ── Support check ────────────────────────────────────────────────────────
    isSupported() {
        if (typeof window === 'undefined') return false;
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    // ── START LISTENING (Web Speech API, Amharic) ─────────────────────────────
    // Callbacks: onStart(), onResult(text), onInterim(text), onError(msg), onEnd()
    startListening({ onStart, onResult, onInterim, onError, onEnd } = {}) {
        if (!this.isSupported()) {
            if (onError) onError(
                'Voice recognition is not supported in this browser. Use Chrome or Edge.'
            );
            return;
        }

        if (this.isRecording) {
            this.stopListening();
            return;
        }

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SR();

        // Amharic locale — Chrome recognises 'am-ET' via Google's STT
        this.recognition.lang            = 'am-ET';
        this.recognition.continuous      = false;
        this.recognition.interimResults  = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isRecording = true;
            if (onStart) onStart();
        };

        this.recognition.onresult = (event) => {
            let finalText   = '';
            let interimText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += t;
                } else {
                    interimText += t;
                }
            }

            if (interimText && onInterim) onInterim(interimText);
            if (finalText   && onResult)  onResult(finalText);
        };

        this.recognition.onerror = (event) => {
            this.isRecording = false;
            let msg = 'ድምጽ ግቤት ስህተት። እንደገና ይሞክሩ።';
            switch (event.error) {
                case 'not-allowed':
                case 'permission-denied':
                    msg = 'ማይክሮፎን ተዘግቷል። ፈቃድ ይስጡ።';
                    break;
                case 'no-speech':
                    msg = 'ድምጽ አልተሰማም። እንደገና ይሞክሩ።';
                    break;
                case 'audio-capture':
                    msg = 'ማይክሮፎን አልተገኘም። ማይክሮፎን ያስተካክሉ።';
                    break;
                case 'language-not-supported':
                    msg = 'አማርኛ ድምጽ ግቤት በዚህ አሳሽ አይሰራም። Chrome ይጠቀሙ።';
                    break;
                case 'network':
                    msg = 'የኔትወርክ ስህተት። ኢንተርኔት ያረጋግጡ።';
                    break;
                default:
                    msg = `ስህተት: ${event.error}`;
            }
            if (onError) onError(msg);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            if (onEnd) onEnd();
        };

        try {
            this.recognition.start();
        } catch (err) {
            this.isRecording = false;
            if (onError) onError(`ድምጽ ማዳመጥ አልተጀመረም: ${err.message}`);
        }
    }

    // ── STOP LISTENING ───────────────────────────────────────────────────────
    stopListening() {
        if (this.recognition && this.isRecording) {
            try { this.recognition.stop(); } catch (_) {}
        }
        this.isRecording = false;
    }

    // ── TTS — backend Google Translate TTS (free) ─────────────────────────────
    async speak(text, language = 'am', options = {}) {
        if (!text?.trim()) return;
        this.stopSpeaking();

        try {
            const token   = localStorage.getItem('authToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE}/voice/tts`, {
                method:  'POST',
                headers,
                body:    JSON.stringify({ text: text.trim(), language }),
            });

            if (!response.ok) {
                if (options.onError) options.onError(`TTS failed (${response.status})`);
                return;
            }

            const blob = await response.blob();
            const url  = URL.createObjectURL(blob);

            this.audioPlayer.src     = url;
            this.audioPlayer.onended = () => {
                this.isPlaying = false;
                URL.revokeObjectURL(url);
                if (options.onEnd) options.onEnd();
            };
            this.isPlaying = true;
            if (options.onStart) options.onStart();
            await this.audioPlayer.play();
        } catch (err) {
            this.isPlaying = false;
            if (options.onError) options.onError(err.message);
        }
    }

    // ── STOP TTS ──────────────────────────────────────────────────────────────
    stopSpeaking() {
        if (this.audioPlayer && !this.audioPlayer.paused) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.isPlaying = false;
    }
}

const amharicVoiceService = new AmharicVoiceService();
export default amharicVoiceService;
