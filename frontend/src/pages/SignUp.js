import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignUp() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const validate = () => {
        if (!form.name.trim()) return 'Name is required.';
        if (!form.email.trim()) return 'Email is required.';
        if (form.password.length < 6) return 'Password must be at least 6 characters.';
        if (form.password !== form.confirm) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        setError('');
        try {
            await register(form.name, form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Password strength
    const strength = form.password.length === 0 ? 0
        : form.password.length < 6 ? 1
        : form.password.length < 10 ? 2
        : 3;
    const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
    const strengthClass = ['', 'weak', 'good', 'strong'];

    return (
        <div className="auth-page">
            {/* Left decorative panel */}
            <div className="auth-visual auth-visual--signup">
                <div className="auth-visual__overlay" />
                <div className="auth-visual__content">
                    <div className="auth-logo">🏨</div>
                    <h2>Join Our Family</h2>
                    <p>Create an account and enjoy exclusive member perks</p>
                    <div className="auth-perks">
                        <div className="perk-item">✅ Early check-in priority</div>
                        <div className="perk-item">✅ Member-only rates</div>
                        <div className="perk-item">✅ Loyalty points on stays</div>
                        <div className="perk-item">✅ 24/7 AI concierge access</div>
                    </div>
                </div>
            </div>

            {/* Form panel */}
            <div className="auth-form-panel">
                <div className="auth-form-wrap">
                    <div className="auth-form-header">
                        <Link to="/" className="auth-back-link">← Back to home</Link>
                        <h1>Create account</h1>
                        <p>Join us for an unforgettable experience</p>
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="name">Full name</label>
                            <div className="input-icon-wrap">
                                <span className="input-icon">👤</span>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Jane Smith"
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <div className="input-icon-wrap">
                                <span className="input-icon">✉️</span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-icon-wrap">
                                <span className="input-icon">🔒</span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Min. 6 characters"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-pass"
                                    onClick={() => setShowPass((p) => !p)}
                                    aria-label={showPass ? 'Hide password' : 'Show password'}
                                >
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {form.password && (
                                <div className="password-strength">
                                    <div className={`strength-bar strength-bar--${strengthClass[strength]}`}>
                                        <div style={{ width: `${(strength / 3) * 100}%` }} />
                                    </div>
                                    <span className={`strength-label strength-label--${strengthClass[strength]}`}>
                                        {strengthLabel[strength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm">Confirm password</label>
                            <div className="input-icon-wrap">
                                <span className="input-icon">🔒</span>
                                <input
                                    id="confirm"
                                    name="confirm"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.confirm}
                                    onChange={handleChange}
                                    placeholder="Repeat password"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-auth"
                            disabled={loading || !form.name || !form.email || !form.password || !form.confirm}
                        >
                            {loading ? <span className="btn-spinner" /> : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account?{' '}
                        <Link to="/signin">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
