const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const OpenAI = require('openai');

// Lazy OpenAI client — shared with aiService via the same key
let _openai = null;
const getOpenAI = () => {
    if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _openai;
};

// ─── STT: Transcribe audio via OpenAI Whisper ─────────────────────────────────

/**
 * POST /api/voice/transcribe
 * Body: multipart/form-data
 *   - audio: audio file (webm/ogg/mp4/wav)
 *   - language: 'am' | 'en'  (default: 'am')
 */
exports.transcribeAudio = async (req, res) => {
    let tmpPath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio file provided.' });
        }

        const language = (req.body.language || 'am').toLowerCase();
        // Whisper language codes: 'am' = Amharic, 'en' = English
        const whisperLang = language === 'en' ? 'en' : 'am';

        // Write buffer to a temp file so OpenAI SDK can stream it
        const ext = getExtensionFromMimetype(req.file.mimetype);
        tmpPath = path.join(os.tmpdir(), `haile_audio_${Date.now()}${ext}`);
        fs.writeFileSync(tmpPath, req.file.buffer);

        const transcription = await getOpenAI().audio.transcriptions.create({
            file: fs.createReadStream(tmpPath),
            model: 'whisper-1',          // OpenAI Whisper — same underlying model as Groq
            language: whisperLang,
            response_format: 'json',
        });

        return res.json({
            success: true,
            transcript: transcription.text || '',
            language: whisperLang,
        });

    } catch (error) {
        console.error('transcribeAudio error:', error?.message || error);
        return res.status(500).json({
            success: false,
            error: 'Failed to transcribe audio. Please try again.',
        });
    } finally {
        if (tmpPath && fs.existsSync(tmpPath)) {
            try { fs.unlinkSync(tmpPath); } catch (_) {}
        }
    }
};

// ─── TTS: Synthesize speech via Google Translate TTS ─────────────────────────
// Free, no API key required.

/**
 * POST /api/voice/tts
 * Body: { text: string, language: 'am' | 'en' }
 * Returns: audio/mpeg stream
 */
exports.synthesizeSpeech = async (req, res) => {
    try {
        const { text, language = 'am' } = req.body;

        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Text is required.' });
        }
        if (text.length > 500) {
            return res.status(400).json({ success: false, error: 'Text too long (max 500 characters).' });
        }

        const locale = language === 'en' ? 'en' : 'am';
        const clean = stripForTTS(text.trim());
        const chunks = splitTextIntoChunks(clean, 200);
        const audioBuffers = [];

        for (const chunk of chunks) {
            const buf = await fetchGoogleTTS(chunk, locale);
            audioBuffers.push(buf);
        }

        const combined = Buffer.concat(audioBuffers);
        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Length', combined.length);
        res.send(combined);

    } catch (error) {
        console.error('synthesizeSpeech error:', error?.message || error);
        res.status(500).json({ success: false, error: 'Failed to synthesize speech. Please try again.' });
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip emojis and markdown from text before sending to TTS
 * so the bot doesn't say "bullet" or read out emoji descriptions.
 */
function stripForTTS(text) {
    return text
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // emoji (supplementary plane)
        .replace(/[\u2600-\u27BF]/g, '')            // misc symbols
        .replace(/[•·●○▪▫–—]/g, ',')               // bullets → pause
        .replace(/\*\*/g, '').replace(/\*/g, '')    // markdown bold/italic
        .replace(/`/g, '')                          // code ticks
        .replace(/#{1,6}\s/g, '')                   // markdown headings
        .replace(/\s{2,}/g, ' ')                    // collapse spaces
        .trim();
}

function getExtensionFromMimetype(mimetype = '') {
    const map = {
        'audio/webm': '.webm',
        'audio/ogg': '.ogg',
        'audio/mp4': '.mp4',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/x-wav': '.wav',
        'audio/flac': '.flac',
        'video/webm': '.webm',
    };
    return map[mimetype] || '.webm';
}

function splitTextIntoChunks(text, maxLen) {
    const chunks = [];
    const sentences = text.match(/[^.!?።]+[.!?።]*/g) || [text];
    let current = '';
    for (const sentence of sentences) {
        if ((current + sentence).length > maxLen) {
            if (current) chunks.push(current.trim());
            current = sentence;
        } else {
            current += sentence;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text.slice(0, maxLen)];
}

async function fetchGoogleTTS(text, lang) {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;

    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; HaileResort/1.0)',
                'Referer': 'https://translate.google.com/',
            },
        };
        https.get(url, options, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Google TTS returned ${response.statusCode}`));
            }
            const buffers = [];
            response.on('data', (chunk) => buffers.push(chunk));
            response.on('end', () => resolve(Buffer.concat(buffers)));
            response.on('error', reject);
        }).on('error', reject);
    });
}
