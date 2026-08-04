import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage, clearChatSession } from '../services/api';

// ─── State ──────────────────────────────────────────────────────────────────

const initialState = {
  messages: [],
  sessionId: null,
  isLoading: false,
  error: null,
  isTyping: false,
};

// ─── Reducer ────────────────────────────────────────────────────────────────

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], sessionId: null };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  /**
   * Send a user message and append both the user msg and AI reply.
   */
  const sendMessage = useCallback(
    async (text, guestName = 'Guest') => {
      if (!text.trim()) return;

      const sid = state.sessionId || `session_${uuidv4()}`;
      if (!state.sessionId) {
        dispatch({ type: 'SET_SESSION', payload: sid });
      }

      // Optimistically add user message
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { role: 'user', content: text.trim(), timestamp: new Date().toISOString() },
      });

      dispatch({ type: 'SET_TYPING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      try {
        const data = await sendChatMessage({ message: text.trim(), sessionId: sid, guestName });

        dispatch({
          type: 'ADD_MESSAGE',
          payload: { role: 'assistant', content: data.reply, timestamp: data.timestamp },
        });

        if (data.sessionId && data.sessionId !== state.sessionId) {
          dispatch({ type: 'SET_SESSION', payload: data.sessionId });
        }
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err.message || 'Failed to send message. Please try again.',
        });
      } finally {
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    },
    [state.sessionId]
  );

  /**
   * Clear the current chat session.
   */
  const clearChat = useCallback(async () => {
    if (state.sessionId) {
      try {
        await clearChatSession(state.sessionId);
      } catch {
        // Best-effort — clear locally regardless
      }
    }
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, [state.sessionId]);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  return (
    <ChatContext.Provider value={{ ...state, sendMessage, clearChat, clearError }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}
