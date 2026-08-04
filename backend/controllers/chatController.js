const Groq = require('groq-sdk/index.js');
const { v4: uuidv4 } = require('uuid');
const ChatSession = require('../models/ChatSession');
const HotelData = require('../models/HotelData');
const staticHotelData = require('../config/hotelData');

// Initialize Groq lazily so dotenv has loaded first
let _groq = null;
const getGroqClient = () => {
    if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return _groq;
};

// ─── Helper: build AI context from hotel data ───────────────────────────────

function buildContext(hotel) {
    // Support both DB model shape and static config shape
    const location = typeof hotel.location === 'object'
        ? hotel.location.address || `${hotel.location.city}, ${hotel.location.country}`
        : hotel.location || '';

    const phone = hotel.contact?.phone || hotel.phone || '';
    const email = hotel.contact?.email || hotel.email || '';

    const rooms = Array.isArray(hotel.rooms)
        ? hotel.rooms.map(r => `- ${r.type}: $${r.price}/night, capacity ${r.capacity}. ${r.description}`).join('\n')
        : '';

    const dining = Array.isArray(hotel.amenities?.dining)
        ? hotel.amenities.dining.map(d => `- ${d.name} (${d.cuisine}): ${d.hours}`).join('\n')
        : Array.isArray(hotel.dining)
            ? hotel.dining.map(d => `- ${d.name} (${d.type || d.cuisine}): ${d.timing || d.hours}. ${d.description || ''}`).join('\n')
            : '';

    const recreation = Array.isArray(hotel.amenities?.recreation)
        ? hotel.amenities.recreation.join(', ')
        : Array.isArray(hotel.amenities)
            ? hotel.amenities.join(', ')
            : '';

    const checkIn = hotel.checkIn || hotel.policies?.checkIn || 'Contact hotel';
    const checkOut = hotel.checkOut || hotel.policies?.checkOut || 'Contact hotel';

    const cancellation = hotel.policies?.cancellation || '';
    const pets = hotel.policies?.pets || '';
    const parking = hotel.policies?.parking || '';

    return `
You are a friendly and knowledgeable virtual concierge for ${hotel.name}.
Your job is to help guests with questions about the hotel, rooms, amenities, dining, local attractions, and policies.

HOTEL INFORMATION:
- Name: ${hotel.name}
- Location: ${location}
- Phone: ${phone}
- Email: ${email}
- Check-in: ${checkIn}
- Check-out: ${checkOut}

ROOMS:
${rooms}

DINING:
${dining}

AMENITIES & RECREATION:
${recreation}

POLICIES:
- Cancellation: ${cancellation}
- Pets: ${pets}
- Parking: ${parking}

Be friendly, concise, and helpful. Only use the information provided above. Do not fabricate prices or policies.
`.trim();
}

// ─── Helper: call Groq API ──────────────────────────────────────────────────

async function getGroqResponse(message, context, history) {
    // Build messages array with system context + conversation history
    const messages = [
        { role: 'system', content: context },
    ];

    // Append last 10 history messages
    history.slice(-10).forEach((msg) => {
        messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        });
    });

    // Add current user message
    messages.push({ role: 'user', content: message });

    const completion = await getGroqClient().chat.completions.create({
        model: 'llama-3.1-8b-instant',   // free, fast, generous quota
        messages,
        temperature: 0.7,
        max_tokens: 400,
    });

    return completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/chat/send
 * Send a message and receive an AI response.
 */
exports.sendMessage = async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required.' });
        }
        if (message.length > 1000) {
            return res.status(400).json({ success: false, error: 'Message too long (max 1000 characters).' });
        }

        const userId = sessionId || uuidv4();

        // Get or create chat session
        let session = await ChatSession.findOne({ sessionId: userId });
        if (!session) {
            session = new ChatSession({
                sessionId: userId,
                messages: [],
                userInfo: {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
        }

        // Fetch hotel data (DB first, fallback to static config)
        let hotelData = await HotelData.findOne({ isActive: true });
        if (!hotelData) {
            hotelData = staticHotelData;
        }

        const context = buildContext(hotelData);

        // Get AI response
        const aiResponse = await getGroqResponse(message.trim(), context, session.messages);

        // Persist both messages
        session.messages.push({ role: 'user', content: message.trim() });
        session.messages.push({ role: 'assistant', content: aiResponse });
        await session.save();

        res.json({
            success: true,
            response: aiResponse,
            sessionId: userId
        });

    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process message. Please try again.'
        });
    }
};

/**
 * GET /api/chat/history/:sessionId
 * Get conversation history for a session.
 */
exports.getHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.json({ messages: [] });
        }
        res.json({ messages: session.messages });
    } catch (error) {
        console.error('getHistory error:', error);
        res.status(500).json({ error: 'Failed to get history.' });
    }
};

/**
 * POST /api/chat/clear
 * Clear messages for a session.
 */
exports.clearHistory = async (req, res) => {
    try {
        const { sessionId } = req.body;
        await ChatSession.findOneAndUpdate(
            { sessionId },
            { messages: [], updatedAt: new Date() }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('clearHistory error:', error);
        res.status(500).json({ error: 'Failed to clear history.' });
    }
};

// ─── Admin Controllers ───────────────────────────────────────────────────────

/**
 * GET /api/chat/hotel-data
 * Return current hotel data.
 */
exports.getHotelData = async (req, res) => {
    try {
        let hotelData = await HotelData.findOne({ isActive: true });
        if (!hotelData) {
            hotelData = staticHotelData;
        }
        res.json({ data: hotelData });
    } catch (error) {
        console.error('getHotelData error:', error);
        res.status(500).json({ error: 'Failed to get hotel data.' });
    }
};

/**
 * PUT /api/chat/hotel-data
 * Update persisted hotel data.
 */
exports.updateHotelData = async (req, res) => {
    try {
        const newData = req.body;
        let hotelData = await HotelData.findOne({ isActive: true });

        if (hotelData) {
            hotelData = await HotelData.findByIdAndUpdate(
                hotelData._id,
                { ...newData, updatedAt: new Date() },
                { new: true }
            );
        } else {
            hotelData = new HotelData({ ...staticHotelData, ...newData, isActive: true });
            await hotelData.save();
        }

        res.json({ success: true, data: hotelData });
    } catch (error) {
        console.error('updateHotelData error:', error);
        res.status(500).json({ error: 'Failed to update hotel data.' });
    }
};

/**
 * GET /api/chat/sessions  (Admin)
 * List all sessions with summary info.
 */
exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await ChatSession.find({})
            .select('sessionId userInfo metadata createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(100);
        const total = await ChatSession.countDocuments();

        // Normalise guestName so the frontend always gets a display name
        const normalised = sessions.map((s) => ({
            ...s.toObject(),
            guestName: s.userInfo?.name || `Guest (${s.sessionId.slice(-6)})`,
        }));

        res.json({ sessions: normalised, total });
    } catch (error) {
        console.error('getAllSessions error:', error);
        res.status(500).json({ error: 'Failed to retrieve sessions.' });
    }
};

/**
 * GET /api/chat/sessions/:sessionId  (Admin)
 * Return a single session with all messages.
 */
exports.getSessionDetail = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        const obj = session.toObject();
        obj.guestName = session.userInfo?.name || `Guest (${session.sessionId.slice(-6)})`;
        res.json(obj);
    } catch (error) {
        console.error('getSessionDetail error:', error);
        res.status(500).json({ error: 'Failed to retrieve session.' });
    }
};
