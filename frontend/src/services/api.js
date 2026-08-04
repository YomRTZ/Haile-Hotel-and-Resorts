import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

// Attach JWT on every request if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Normalise error messages
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const message =
            err.response?.data?.error ||
            (err.code === 'ECONNABORTED' ? 'Request timed out.' : err.message);
        return Promise.reject(new Error(message));
    }
);

// ─── Chat (used by ChatWidget directly) ──────────────────────────────────────
export const sendMessage      = async (message, sessionId) => (await api.post('/chat/send', { message, sessionId })).data;
export const getChatHistory   = async (sessionId) => (await api.get(`/chat/history/${sessionId}`)).data;
export const clearChatHistory = async (sessionId) => (await api.post('/chat/clear', { sessionId })).data;

// ─── Chat (used by ChatContext) ───────────────────────────────────────────────
// Alias that accepts an object and maps response -> reply for ChatContext compatibility
export const sendChatMessage  = async ({ message, sessionId, guestName }) => {
    const data = (await api.post('/chat/send', { message, sessionId, guestName })).data;
    // Normalise: backend returns `response`, ChatContext expects `reply`
    return { ...data, reply: data.response };
};
export const clearChatSession = async (sessionId) => (await api.post('/chat/clear', { sessionId })).data;

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminLogin       = async (username, password) =>
    (await api.post('/auth/admin-login', { username, password })).data;
export const getHotelData     = async () => (await api.get('/chat/hotel-data')).data.data;
export const updateHotelData  = async (data) => (await api.put('/chat/hotel-data', data)).data;
export const getAllSessions    = async () => (await api.get('/chat/sessions')).data;
export const getSessionDetail = async (sessionId) => (await api.get(`/chat/sessions/${sessionId}`)).data;

export default api;
