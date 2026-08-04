// ============================================
// VOICE SERVICE - Web Speech API
// Free, no API key required
// Works in Chrome, Edge, Safari
// ============================================

class VoiceService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.voicesLoaded = false;
        this.synthesis = window.speechSynthesis;
        this.availableVoices = [];
        
        // Load voices when available
        if (this.synthesis) {
            this.loadVoices();
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    // ============================================
    // LOAD AVAILABLE VOICES
    // ============================================
    loadVoices() {
        if (!this.synthesis) return;
        this.availableVoices = this.synthesis.getVoices();
        this.voicesLoaded = true;
    }

    // ============================================
    // CHECK SUPPORT
    // ============================================
    isSupported() {
        return 'webkitSpeechRecognition' in window || 
               'SpeechRecognition' in window;
    }

    isSpeechSynthesisSupported() {
        return 'speechSynthesis' in window;
    }

    // ============================================
    // START LISTENING (Speech-to-Text)
    // ============================================
    startListening(onResult, onInterim, onError, onEnd) {
        if (!this.isSupported()) {
            if (onError) onError('Voice recognition not supported in this browser');
            return null;
        }

        // Check if already listening
        if (this.isListening) {
            this.stopListening();
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure recognition
        this.recognition.lang = 'en-US';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.grammars = this.getGrammar();

        // Handle results
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Send interim results for real-time display
            if (interimTranscript && onInterim) {
                onInterim(interimTranscript);
            }

            // Send final result when done
            if (finalTranscript) {
                if (onResult) onResult(finalTranscript);
            }
        };

        // Handle errors
        this.recognition.onerror = (event) => {
            console.error('🎤 Voice recognition error:', event.error);
            
            // User-friendly error messages
            let errorMessage = 'Voice recognition error. Please try again.';
            switch(event.error) {
                case 'not-allowed':
                    errorMessage = 'Please allow microphone access to use voice features.';
                    break;
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found. Please check your microphone.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = `Voice error: ${event.error}`;
            }
            
            if (onError) onError(errorMessage);
            this.isListening = false;
        };

        // Handle end of speech
        this.recognition.onend = () => {
            this.isListening = false;
            if (onEnd) onEnd();
        };

        // Handle start
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('🎤 Voice recognition started...');
        };

        // Start listening
        try {
            this.recognition.start();
            return this.recognition;
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            if (onError) onError('Failed to start voice recognition');
            return null;
        }
    }

    // ============================================
    // STOP LISTENING
    // ============================================
    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                this.isListening = false;
                console.log('🎤 Voice recognition stopped');
            } catch (error) {
                console.error('Error stopping voice recognition:', error);
            }
        }
    }

    // ============================================
    // SPEAK TEXT (Text-to-Speech)
    // ============================================
    speak(text, options = {}) {
        if (!this.isSpeechSynthesisSupported()) {
            console.warn('Speech synthesis not supported');
            return false;
        }

        // Cancel any ongoing speech
        this.stopSpeaking();

        // Clean text for better speech
        const cleanText = this.cleanTextForSpeech(text);
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Configure voice
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.lang || 'en-US';

        // Try to select a natural voice
        const voice = this.selectBestVoice(options.gender || 'female');
        if (voice) {
            utterance.voice = voice;
        }

        // Events
        utterance.onstart = () => {
            this.isSpeaking = true;
            if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
            this.isSpeaking = false;
            if (options.onError) options.onError(event.error);
        };

        // Speak!
        this.synthesis.speak(utterance);
        return true;
    }

    // ============================================
    // STOP SPEAKING
    // ============================================
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    // ============================================
    // SELECT BEST VOICE
    // ============================================
    selectBestVoice(gender = 'female') {
        if (!this.availableVoices.length) {
            this.loadVoices();
        }

        // Try to find a natural-sounding voice
        const preferredVoices = this.availableVoices.filter(v => 
            v.lang.startsWith('en-') && // English voices
            (v.name.includes('Natural') || 
             v.name.includes('Premium') || 
             v.name.includes('Google') ||
             v.name.includes('Samantha'))
        );

        // Filter by gender if available
        let voices = preferredVoices;
        if (gender === 'female') {
            voices = preferredVoices.filter(v => 
                v.name.includes('Female') || 
                v.name.includes('Samantha') ||
                v.name.includes('Zira') ||
                v.name.includes('Google UK')
            );
        } else if (gender === 'male') {
            voices = preferredVoices.filter(v => 
                v.name.includes('Male') || 
                v.name.includes('David') ||
                v.name.includes('Mark')
            );
        }

        return voices.length > 0 ? voices[0] : (preferredVoices[0] || this.availableVoices.find(v => v.lang.startsWith('en-')));
    }

    // ============================================
    // CLEAN TEXT FOR SPEECH
    // ============================================
    cleanTextForSpeech(text) {
        return text
            // Remove emojis (they don't speak well)
            .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
            .replace(/[\u2600-\u27BF]/g, '')
            // Remove markdown
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/`/g, '')
            // Handle bullet points
            .replace(/[•·●○]/g, 'bullet')
            // Handle numbers
            .replace(/(\d+)%/g, '$1 percent')
            .replace(/(\d+):(\d+)/g, '$1 $2')
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ============================================
    // GET GRAMMAR FOR BETTER RECOGNITION
    // ============================================
    getGrammar() {
        // Optional: Add custom grammar for better recognition
        const grammar = `
            #JSGF V1.0;
            grammar hotel;
            public <question> = 
                (what | when | where | how | do | is | are | can | will) 
                (is | are | can | will | do | does) 
                *;
        `;
        return grammar;
    }

    // ============================================
    // CHECK PERMISSION STATUS
    // ============================================
    async checkMicrophonePermission() {
        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            return result.state; // 'granted', 'denied', 'prompt'
        } catch (error) {
            console.error('Cannot check microphone permission:', error);
            return 'unknown';
        }
    }

    // ============================================
    // REQUEST MICROPHONE PERMISSION
    // ============================================
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================
const voiceService = new VoiceService();
export default voiceService;