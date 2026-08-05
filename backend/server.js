const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv     = require('dotenv');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');
const chatRoutes  = require('./routes/chatRoutes');
const authRoutes  = require('./routes/authRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

dotenv.config();

const app  = express();
const isProd = process.env.NODE_ENV === 'production';

// ─── Trust proxy (Render / Railway / Heroku add X-Forwarded-For) ──────────────
app.set('trust proxy', 1);

// ─── Connect to MongoDB Atlas ─────────────────────────────────────────────────
connectDB();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginEmbedderPolicy: false,   // allow audio/image embeds
    contentSecurityPolicy: isProd ? undefined : false,
}));

// ─── Compress responses ───────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan(isProd ? 'combined' : 'dev'));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'https://haileresort.netlify.app',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL
              .split(',')
              .map(o => o.trim())
              .filter(Boolean)
        : []),
].filter((v, i, a) => a.indexOf(v) === i);   // deduplicate

console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);          // curl / health checks
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`⚠️  CORS blocked: ${origin}`);
        callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ─── Sanitise MongoDB operator injection (e.g. $where, $gt in body) ──────────
app.use(mongoSanitize());

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: isProd ? 100 : 500,    // stricter in production
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again in 15 minutes.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,                    // tighter on auth endpoints
    message: { error: 'Too many login attempts — please try again in 15 minutes.' },
});

app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    // CORS errors surface here — send 403 instead of 500
    if (err.message?.startsWith('CORS:')) {
        return res.status(403).json({ error: err.message });
    }
    console.error('Unhandled error:', err.message || err);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;   // needed for testing
