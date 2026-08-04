import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignIn() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left panel — decorative */}
            <div className="auth-visual">
                <div className="auth-visual__overlay" />
                <div className="auth-visual__content">
                    <div className="auth-logo">🏨</div>
                    <h2>Haile Resort Hawassa</h2>
                    <p>Where luxury meets the lakeside</p>
                    <div className="auth-stats">
                        <div><strong>200+</strong><span>Luxury Rooms</span></div>
                        <div><strong>4.9★</strong><span>Guest Rating</span></div>
                        <div><strong>24/7</strong><span>Concierge</span></div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="auth-form-panel">
                <div className="auth-form-wrap">
                    <div className="auth-form-header">
                        <Link to="/" className="auth-back-link">← Back to home</Link>
                        <h1>Welcome back</h1>
                        <p>Sign in to your account to continue</p>
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                                    placeholder="Your password"
                                    required
                                    autoComplete="current-password"
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
                        </div>

                        <button
                            type="submit"
                            className="btn-auth"
                            disabled={loading || !form.email || !form.password}
                        >
                            {loading ? <span className="btn-spinner" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Don't have an account?{' '}
                        <Link to="/signup">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
