const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate a signed JWT
const signToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/admin-login
 * Authenticate with username + password from env vars.
 */
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (username !== validUsername || password !== validPassword) {
            return res.status(401).json({ error: 'Invalid admin credentials.' });
        }

        const token = jwt.sign(
            { role: 'admin', username },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token });
    } catch (err) {
        console.error('adminLogin error:', err);
        res.status(500).json({ error: 'Admin login failed.' });
    }
};

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'An account with that email already exists.' });
        }

        const user = await User.create({ name, email, password });

        const token = signToken(user._id);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error('register error:', err);
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join('. ');
            return res.status(400).json({ error: msg });
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Explicitly select password (it's select:false in schema)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = signToken(user._id);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

/**
 * GET /api/auth/me  (protected)
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
};
