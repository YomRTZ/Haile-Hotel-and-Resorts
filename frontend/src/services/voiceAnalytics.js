// ============================================
// VOICE ANALYTICS - Track Voice Usage
// ============================================

class VoiceAnalytics {
    constructor() {
        this.stats = {
            totalSessions: 0,
            totalVoiceInputs: 0,
            totalVoiceOutputs: 0,
            averageSpeakingTime: 0,
            mostCommonQuestions: [],
            successRate: 0,
            errors: {
                noSpeech: 0,
                audioCapture: 0,
                network: 0,
                notAllowed: 0,
                other: 0
            }
        };
        this.sessionStart = Date.now();
        this.currentSpeakingTime = 0;
        this.questions = {};
        this.totalAttempts = 0;
        this.successfulAttempts = 0;
    }

    // ============================================
    // TRACK VOICE INPUT
    // ============================================
    trackVoiceInput(transcript, success = true) {
        this.totalAttempts++;
        if (success) {
            this.successfulAttempts++;
            this.stats.totalVoiceInputs++;
            
            // Track questions
            const words = transcript.split(' ');
            const questionWords = ['what', 'when', 'where', 'how', 'why', 'who', 'which', 'do', 'is', 'are', 'can', 'will'];
            if (words.some(w => questionWords.includes(w.toLowerCase()))) {
                const key = words.slice(0, 5).join(' ');
                this.questions[key] = (this.questions[key] || 0) + 1;
            }
        }
        this.updateStats();
    }

    // ============================================
    // TRACK VOICE OUTPUT
    // ============================================
    trackVoiceOutput(text, success = true) {
        if (success) {
            this.stats.totalVoiceOutputs++;
        }
        this.updateStats();
    }

    // ============================================
    // TRACK ERROR
    // ============================================
    trackError(errorType) {
        if (this.stats.errors[errorType] !== undefined) {
            this.stats.errors[errorType]++;
        } else {
            this.stats.errors.other++;
        }
        this.updateStats();
    }

    // ============================================
    // TRACK SPEAKING TIME
    // ============================================
    trackSpeakingTime(duration) {
        this.currentSpeakingTime += duration;
        const totalSessions = this.stats.totalSessions || 1;
        this.stats.averageSpeakingTime = this.currentSpeakingTime / totalSessions;
        this.updateStats();
    }

    // ============================================
    // UPDATE STATS
    // ============================================
    updateStats() {
        this.stats.successRate = this.totalAttempts > 0 
            ? (this.successfulAttempts / this.totalAttempts) * 100 
            : 0;
        
        // Get most common questions
        const sortedQuestions = Object.entries(this.questions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([q, count]) => ({ question: q, count }));
        
        this.stats.mostCommonQuestions = sortedQuestions;
        this.stats.totalSessions = Math.floor((Date.now() - this.sessionStart) / 60000) + 1;

        // Save to localStorage
        this.saveStats();
    }

    // ============================================
    // SAVE STATS
    // ============================================
    saveStats() {
        try {
            localStorage.setItem('voiceAnalytics', JSON.stringify({
                ...this.stats,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.log('Could not save analytics');
        }
    }

    // ============================================
    // LOAD STATS
    // ============================================
    loadStats() {
        try {
            const data = localStorage.getItem('voiceAnalytics');
            if (data) {
                const parsed = JSON.parse(data);
                this.stats = { ...this.stats, ...parsed };
                this.sessionStart = parsed.timestamp || Date.now();
            }
        } catch (error) {
            console.log('Could not load analytics');
        }
    }

    // ============================================
    // GET REPORT
    // ============================================
    getReport() {
        return {
            ...this.stats,
            currentSessionMinutes: Math.floor((Date.now() - this.sessionStart) / 60000),
            successRate: this.stats.successRate.toFixed(1) + '%',
            totalErrors: Object.values(this.stats.errors).reduce((a, b) => a + b, 0),
            mostCommonQuestions: this.stats.mostCommonQuestions.slice(0, 5)
        };
    }

    // ============================================
    // RESET
    // ============================================
    reset() {
        this.stats = {
            totalSessions: 0,
            totalVoiceInputs: 0,
            totalVoiceOutputs: 0,
            averageSpeakingTime: 0,
            mostCommonQuestions: [],
            successRate: 0,
            errors: {
                noSpeech: 0,
                audioCapture: 0,
                network: 0,
                notAllowed: 0,
                other: 0
            }
        };
        this.sessionStart = Date.now();
        this.currentSpeakingTime = 0;
        this.questions = {};
        this.totalAttempts = 0;
        this.successfulAttempts = 0;
        localStorage.removeItem('voiceAnalytics');
    }
}

export default new VoiceAnalytics();