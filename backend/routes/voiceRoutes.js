const express = require('express');
const multer = require('multer');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

// Store audio in memory — temp file written only inside controller
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — Whisper limit
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg',
            'audio/wav', 'audio/x-wav', 'audio/flac', 'video/webm',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported audio type: ${file.mimetype}`));
        }
    },
});

// POST /api/voice/transcribe — OpenAI Whisper STT
router.post('/transcribe', upload.single('audio'), voiceController.transcribeAudio);

// POST /api/voice/tts — Google Translate TTS (no API key required)
router.post('/tts', voiceController.synthesizeSpeech);

module.exports = router;
