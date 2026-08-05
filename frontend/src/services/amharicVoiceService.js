// ============================================================================
// AMHARIC VOICE SERVICE
// STT : MediaRecorder → backend → OpenAI Whisper (whisper-1)
// TTS : backend → Google Translate TTS → <audio> element
// ============================================================================

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AmharicVoiceService {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioPlayer = null;
        this.isPlaying = false;
        this._initAudioPlayer();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AUDIO PLAYER — single <audio> element for TTS playback
    // ──────────────────────────────────────────────────────────────────────────
    _initAudioPlayer() {
        if (typeof window === 'undefined') return;
        this.audioPlayer = new Audio();
        this.audioPlayer.onended = () => { this.isPlaying = false; };
        this.audioPlayer.onerror = () => { this.isPlaying = false; };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // IS SUPPORTED
    // ──────────────────────────────────────────────────────────────────────────
    isSupported() {
        return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // START RECORDING (STT)
    // Callbacks:
    //   onStart()
    //   onError(message)
    //   onEnd()   — called when recording stops (before transcription result)
    // ──────────────────────────────────────────────────────────────────────────
    async startRecording(onStart, onError, onEnd) {
        if (this.isRecording) {
            await this.stopRecording();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];

            // Prefer webm/opus; fall back to whatever is supported
            const mimeType = this._getSupportedMimeType();
            const options = mimeType ? { mimeType } : {};
            this.mediaRecorder = new MediaRecorder(stream, options);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstart = () => {
                this.isRecording = true;
                if (onStart) onStart();
            };

            this.mediaRecorder.onstop = () => {
                this.isRecording = false;
                // Stop all mic tracks so the browser indicator goes away
                stream.getTracks().forEach(t => t.stop());
                if (onEnd) onEnd();
            };

            this.mediaRecorder.onerror = (event) => {
                this.isRecording = false;
                stream.getTracks().forEach(t => t.stop());
                if (onError) onError('Recording error: ' + (event.error?.message || 'unknown'));
            };

            this.mediaRecorder.start(250); // collect data every 250 ms
        } catch (err) {
            const msg = err.name === 'NotAllowedError'
                ? 'Please allow microphone access to use voice features.'
                : `Microphone error: ${err.message}`;
            if (onError) onError(msg);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STOP RECORDING AND TRANSCRIBE
    // Returns Promise<{ transcript: string }>
    // ──────────────────────────────────────────────────────────────────────────
    stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || !this.isRecording) {
                resolve({ transcript: '' });
                return;
            }

            const onStop = async () => {
                try {
                    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
                    const blob = new Blob(this.audioChunks, { type: mimeType });
                    this.audioChunks = [];

                    if (blob.size < 1000) {
                        resolve({ transcript: '' });
                        return;
                    }

                    const transcript = await this._transcribeBlob(blob, mimeType);
                    resolve({ transcript });
                } catch (err) {
                    reject(err);
                }
            };

            this.mediaRecorder.addEventListener('stop', onStop, { once: true });
            this.mediaRecorder.stop();
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SEND BLOB TO BACKEND → OpenAI Whisper STT
    // ──────────────────────────────────────────────────────────────────────────
    async _transcribeBlob(blob, mimeType) {
        const formData = new FormData();
        const ext = this._mimeToExt(mimeType);
        formData.append('audio', blob, `recording${ext}`);
        formData.append('language', 'am');

        const token = localStorage.getItem('authToken');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE}/voice/transcribe`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Transcription failed (${response.status})`);
        }

        const data = await response.json();
        return data.transcript || '';
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TTS — fetch audio from backend and play it
    // ──────────────────────────────────────────────────────────────────────────
    async speak(text, language = 'am', options = {}) {
        if (!text?.trim()) return;

        // Stop any ongoing playback
        this.stopSpeaking();

        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE}/voice/tts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ text: text.trim(), language }),
            });

            if (!response.ok) {
                console.error('TTS request failed:', response.status);
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            this.audioPlayer.src = url;
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
            console.error('Amharic TTS error:', err.message);
            if (options.onError) options.onError(err.message);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STOP PLAYBACK
    // ──────────────────────────────────────────────────────────────────────────
    stopSpeaking() {
        if (this.audioPlayer && !this.audioPlayer.paused) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.isPlaying = false;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────────────
    _getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/mp4',
        ];
        return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    }

    _mimeToExt(mimeType) {
        if (mimeType.includes('webm')) return '.webm';
        if (mimeType.includes('ogg'))  return '.ogg';
        if (mimeType.includes('mp4'))  return '.mp4';
        if (mimeType.includes('wav'))  return '.wav';
        return '.webm';
    }
}

const amharicVoiceService = new AmharicVoiceService();
export default amharicVoiceService;
