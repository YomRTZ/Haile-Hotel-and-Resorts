const { v4: uuidv4 } = require('uuid');
const { getAIResponse, detectLanguage, getDirectAmharicResponse } = require('../services/aiService');
const ChatSession = require('../models/ChatSession');
const HotelData = require('../models/HotelData');
const hotelDataFallback = require('../config/hotelData');
const { isDBConnected } = require('../config/db');

// ─── Safe DB wrapper — returns null instead of throwing when DB is offline ───
async function safeDB(fn) {
    if (!isDBConnected()) return null;
    try { return await fn(); } catch { return null; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getOrCreateSession(sessionId, guestName) {
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
        session = new ChatSession({
            sessionId,
            messages: [],
            userInfo: { name: guestName || 'Guest' },
        });
    }
    return session;
}

// ─── POST /api/chat/send ──────────────────────────────────────────────────────

exports.sendMessage = async (req, res) => {
    try {
        const { message, sessionId, guestName, language } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required.' });
        }

        // Use provided sessionId or generate a new one
        const sid = sessionId || uuidv4();

        // Load or create session (safe — skipped if DB offline)
        const session = await safeDB(() => getOrCreateSession(sid, guestName));

        // Build recent history for the AI (last 20 messages)
        const history = session
            ? session.messages.slice(-20).map((m) => ({ role: m.role, content: m.content }))
            : [];

        // Resolve language — trust frontend flag first, fall back to text detection
        let resolvedLang;
        if (language === 'am' || language === 'amharic') {
            resolvedLang = 'amharic';
        } else if (language === 'en' || language === 'english') {
            resolvedLang = 'english';
        } else {
            resolvedLang = detectLanguage(message);
        }

        // Get AI response
        const response = await getAIResponse(message, history, resolvedLang);

        // Persist messages (safe — skipped if DB offline)
        if (session) {
            session.messages.push({ role: 'user', content: message });
            session.messages.push({ role: 'assistant', content: response });
            await safeDB(() => session.save());
        }

        return res.json({
            success: true,
            response,
            sessionId: sid,
            language: resolvedLang,
        });
    } catch (error) {
        console.error('sendMessage error:', error);

        // Last-resort fallback
        const fallback = getDirectAmharicResponse(req.body?.message);
        if (fallback) {
            return res.json({ success: true, response: fallback, language: 'amharic' });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to process your message. Please try again.',
        });
    }
};

// ─── GET /api/chat/history/:sessionId ────────────────────────────────────────

exports.getHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await safeDB(() => ChatSession.findOne({ sessionId }));

        if (!session) {
            return res.json({ success: true, messages: [], sessionId });
        }
        return res.json({ success: true, sessionId, messages: session.messages });
    } catch (error) {
        console.error('getHistory error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch history.' });
    }
};

// ─── POST /api/chat/clear ─────────────────────────────────────────────────────

exports.clearHistory = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId is required.' });
        await safeDB(() => ChatSession.findOneAndUpdate({ sessionId }, { $set: { messages: [] } }));
        return res.json({ success: true, message: 'Chat history cleared.' });
    } catch (error) {
        console.error('clearHistory error:', error);
        return res.status(500).json({ success: false, error: 'Failed to clear history.' });
    }
};

exports.getHotelData = async (req, res) => {
    try {
        let data = await safeDB(() => HotelData.findOne({ isActive: true }).lean());
        if (!data) data = hotelDataFallback;
        return res.json({ success: true, data });
    } catch (error) {
        console.error('getHotelData error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch hotel data.' });
    }
};

exports.updateHotelData = async (req, res) => {
    try {
        if (!isDBConnected()) return res.status(503).json({ success: false, error: 'Database unavailable.' });
        const updates = req.body;
        let data = await HotelData.findOne({ isActive: true });
        if (!data) {
            data = new HotelData({ ...hotelDataFallback, ...updates, isActive: true });
        } else {
            Object.assign(data, updates);
        }
        await data.save();
        return res.json({ success: true, data });
    } catch (error) {
        console.error('updateHotelData error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update hotel data.' });
    }
};

exports.getAllSessions = async (req, res) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, sessions: [] });
        const sessions = await ChatSession.find()
            .select('sessionId userInfo metadata createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(200)
            .lean();
        return res.json({ success: true, sessions });
    } catch (error) {
        console.error('getAllSessions error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch sessions.' });
    }
};

exports.getSessionDetail = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!isDBConnected()) return res.status(503).json({ success: false, error: 'Database unavailable.' });
        const session = await ChatSession.findOne({ sessionId }).lean();
        if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });
        return res.json({ success: true, session });
    } catch (error) {
        console.error('getSessionDetail error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch session.' });
    }
};

exports.clearAllSessions = async (req, res) => {
    try {
        if (!isDBConnected()) return res.status(503).json({ success: false, error: 'Database unavailable.' });
        const result = await ChatSession.deleteMany({});
        return res.json({ success: true, message: `Deleted ${result.deletedCount} session(s).` });
    } catch (error) {
        console.error('clearAllSessions error:', error);
        return res.status(500).json({ success: false, error: 'Failed to clear sessions.' });
    }
};
