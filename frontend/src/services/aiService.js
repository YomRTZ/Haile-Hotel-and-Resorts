/**
 * aiService.js — Frontend shim
 *
 * All AI logic runs on the backend (backend/services/aiService.js).
 * The frontend communicates via the REST API defined in api.js.
 *
 * This file only re-exports the API helpers so components that previously
 * imported from aiService still work without changes.
 */
export { sendMessage, sendChatMessage } from './api';
