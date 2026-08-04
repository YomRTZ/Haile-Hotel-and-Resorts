// ============================================
// VOICE COMMANDS - Natural Language Commands
// ============================================

class VoiceCommands {
    constructor() {
        this.commands = {
            // Navigation commands
            'go back': 'back',
            'back': 'back',
            'return': 'back',
            'go home': 'home',
            'home': 'home',
            
            // Help commands
            'help': 'help',
            'help me': 'help',
            'what can you do': 'help',
            'show commands': 'help',
            
            // Clear commands
            'clear chat': 'clear',
            'clear': 'clear',
            'delete': 'clear',
            'reset': 'clear',
            'start over': 'clear',
            
            // Room commands (will be sent as regular messages)
            'show rooms': 'rooms',
            'rooms': 'rooms',
            'room availability': 'rooms',
            
            // Booking commands
            'book': 'book',
            'booking': 'book',
            'make a reservation': 'book',
            'reserve': 'book',
            
            // Contact commands
            'contact': 'contact',
            'phone': 'contact',
            'call': 'contact',
            'email': 'contact',
            
            // Stop speaking
            'stop': 'stop',
            'stop speaking': 'stop',
            'quiet': 'stop',
            'silence': 'stop',
        };
    }

    // ============================================
    // PARSE VOICE INPUT
    // ============================================
    parseVoiceInput(text) {
        const lowerText = text.toLowerCase().trim();
        
        // Check for exact command matches
        for (const [phrase, action] of Object.entries(this.commands)) {
            if (lowerText.includes(phrase)) {
                return {
                    isCommand: true,
                    action: action,
                    originalText: text
                };
            }
        }

        // Check for room-specific keywords
        const roomKeywords = ['standard room', 'deluxe room', 'executive suite', 'presidential suite'];
        for (const keyword of roomKeywords) {
            if (lowerText.includes(keyword)) {
                return {
                    isCommand: false,
                    text: text,
                    type: 'room_query'
                };
            }
        }

        // Check for amenity keywords
        const amenityKeywords = ['pool', 'spa', 'gym', 'fitness', 'restaurant', 'bar', 'parking'];
        for (const keyword of amenityKeywords) {
            if (lowerText.includes(keyword)) {
                return {
                    isCommand: false,
                    text: text,
                    type: 'amenity_query'
                };
            }
        }

        // Regular message
        return {
            isCommand: false,
            text: text,
            type: 'general'
        };
    }

    // ============================================
    // EXECUTE COMMAND
    // ============================================
    executeCommand(action, onCommand) {
        if (onCommand) {
            onCommand(action);
        }
    }

    // ============================================
    // GET SUGGESTIONS FOR VOICE INPUT
    // ============================================
    getSuggestions(text) {
        const suggestions = [
            "What rooms are available?",
            "Tell me about the amenities",
            "What's the check-in time?",
            "Is breakfast included?",
            "Do you have parking?",
            "Can I bring my pet?",
            "What restaurants are there?",
            "Tell me about the spa",
            "What's nearby?",
            "How much is a room?",
            "Can I book a room?",
            "What services do you offer?"
        ];

        if (!text) return suggestions;
        
        // Filter suggestions based on input
        const lowerText = text.toLowerCase();
        return suggestions.filter(s => 
            s.toLowerCase().includes(lowerText) || 
            lowerText.includes(s.toLowerCase().split(' ')[0])
        );
    }
}

export default new VoiceCommands();