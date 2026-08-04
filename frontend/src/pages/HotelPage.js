import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import './HotelPage.css';

// ─── Data ─────────────────────────────────────────────────────────────────────
const ROOMS = [
    {
        id: 1,
        name: 'Standard Room',
        price: 150,
        img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
        badge: null,
        desc: 'Cozy city-view room with queen bed and modern amenities.',
        features: ['City View', 'Queen Bed', 'Free Wi-Fi', 'AC'],
    },
    {
        id: 2,
        name: 'Deluxe Ocean View',
        price: 250,
        img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
        badge: 'Popular',
        desc: 'Spacious room with breathtaking ocean panorama and king bed.',
        features: ['Ocean View', 'King Bed', 'Balcony', 'Mini-bar'],
    },
    {
        id: 3,
        name: 'Junior Suite',
        price: 380,
        img: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80',
        badge: 'Best Value',
        desc: 'Elegant suite with separate living area and ocean views.',
        features: ['Ocean View', 'Jacuzzi', 'Lounge Access', 'Butler'],
    },
    {
        id: 4,
        name: 'Presidential Suite',
        price: 800,
        img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
        badge: 'Luxury',
        desc: 'Panoramic views, private terrace and full butler service.',
        features: ['Private Terrace', 'Private Pool', 'Butler', 'Limousine'],
    },
];

const AMENITIES = [
    { icon: '🏊', title: 'Infinity Pool', desc: 'Rooftop pool with panoramic ocean views' },
    { icon: '💆', title: 'Full-Service Spa', desc: 'Massages, facials & wellness treatments' },
    { icon: '🍽️', title: 'Fine Dining', desc: 'Azure Restaurant — international cuisine' },
    { icon: '🏋️', title: 'Fitness Center', desc: 'State-of-the-art equipment, open 24/7' },
    { icon: '🎾', title: 'Tennis Courts', desc: 'Two floodlit courts with pro coaching' },
    { icon: '🚗', title: 'Valet Parking', desc: 'Complimentary for suite guests' },
    { icon: '✈️', title: 'Airport Shuttle', desc: 'Private transfers available on request' },
    { icon: '🐾', title: 'Pet-Friendly', desc: 'We welcome your furry companions too' },
];

const REVIEWS = [
    {
        name: 'Sarah M.',
        country: '🇺🇸 New York',
        rating: 5,
        text: 'Absolutely stunning. The AI concierge knew everything about the hotel and local attractions instantly. Will return!',
        avatar: 'SM',
    },
    {
        name: 'James L.',
        country: '🇬🇧 London',
        rating: 5,
        text: 'Stayed in the Junior Suite — perfect for our anniversary. The ocean view at sunrise was unforgettable.',
        avatar: 'JL',
    },
    {
        name: 'Yuki T.',
        country: '🇯🇵 Tokyo',
        rating: 5,
        text: 'The spa and pool are world-class. Very attentive staff and the chatbot helped me plan my entire stay.',
        avatar: 'YT',
    },
];

const NAV_LINKS = ['Rooms', 'Amenities', 'Gallery', 'Reviews', 'Contact'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Navbar({ onChatOpen }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close menu on route change or outside click
    useEffect(() => {
        if (!menuOpen) return;
        const close = () => setMenuOpen(false);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [menuOpen]);

    const scrollTo = (id) => {
        document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
        setMenuOpen(false);
    };

    return (
        <nav className={`hp-nav ${scrolled ? 'hp-nav--scrolled' : ''}`} role="navigation">
            <div className="hp-nav__inner">
                {/* Brand */}
                <a href="#hero" className="hp-nav__brand">
                    <span>🏨</span> Haile Resort
                </a>

                {/* Desktop nav links */}
                <ul className="hp-nav__links">
                    {NAV_LINKS.map((l) => (
                        <li key={l}>
                            <button onClick={() => scrollTo(l)}>{l}</button>
                        </li>
                    ))}
                </ul>

                {/* Desktop actions */}
                <div className="hp-nav__actions">
                    <button className="hp-nav__chat-btn" onClick={onChatOpen} aria-label="Open AI concierge">
                        💬 Concierge
                    </button>
                    <Link to="/admin" className="hp-nav__admin-btn" title="Admin Dashboard">
                        ⚙️ Admin
                    </Link>
                    {user ? (
                        <div className="hp-nav__user">
                            <span className="hp-nav__avatar">{user.name[0].toUpperCase()}</span>
                            <span className="hp-nav__name">{user.name.split(' ')[0]}</span>
                            <button className="hp-nav__logout" onClick={() => { logout(); navigate('/'); }}>
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/signin" className="hp-nav__signin">Sign in</Link>
                            <Link to="/signup" className="hp-nav__signup">Book now</Link>
                        </>
                    )}
                </div>

                {/* Hamburger */}
                <button
                    className="hp-nav__hamburger"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="hp-nav__mobile-menu" onClick={(e) => e.stopPropagation()}>
                    {/* Nav links */}
                    <ul className="hp-nav__mobile-links">
                        {NAV_LINKS.map((l) => (
                            <li key={l}>
                                <button onClick={() => scrollTo(l)}>{l}</button>
                            </li>
                        ))}
                    </ul>

                    <div className="hp-nav__mobile-divider" />

                    {/* Action buttons */}
                    <div className="hp-nav__mobile-actions">
                        <button
                            className="hp-nav__mobile-concierge"
                            onClick={() => { onChatOpen(); setMenuOpen(false); }}
                        >
                            💬 Concierge
                        </button>
                        <Link
                            to="/admin"
                            className="hp-nav__mobile-admin"
                            onClick={() => setMenuOpen(false)}
                        >
                            ⚙️ Admin
                        </Link>
                    </div>

                    <div className="hp-nav__mobile-divider" />

                    {/* Auth */}
                    {user ? (
                        <div className="hp-nav__mobile-user">
                            <div className="hp-nav__mobile-user-info">
                                <span className="hp-nav__avatar">{user.name[0].toUpperCase()}</span>
                                <span>{user.name}</span>
                            </div>
                            <button
                                className="hp-nav__mobile-signout"
                                onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <div className="hp-nav__mobile-auth">
                            <Link
                                to="/signin"
                                className="hp-nav__mobile-signin"
                                onClick={() => setMenuOpen(false)}
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="hp-nav__mobile-signup"
                                onClick={() => setMenuOpen(false)}
                            >
                                Book now
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}

function Hero({ onChatOpen }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <section id="hero" className="hp-hero">
            <div className="hp-hero__bg" />
            <div className="hp-hero__overlay" />
            <div className="hp-hero__content">
                <div className="hp-hero__badge">✨ Hawassa's Premier Luxury Resort</div>
                <h1>
                    Where Luxury<br />
                    <span className="hp-hero__accent">Meets the Ocean</span>
                </h1>
                <p>
                    Experience unparalleled elegance at Haile Resort Hawassa —
                    nestled on the shores of Lake Hawassa with world-class dining, spa and 24/7 AI concierge.
                </p>
                <div className="hp-hero__actions">
                    <button
                        className="hp-btn hp-btn--primary"
                        onClick={() => user ? document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }) : navigate('/signup')}
                    >
                        {user ? 'Explore Rooms' : 'Book Your Stay'}
                    </button>
                    <button className="hp-btn hp-btn--ghost" onClick={onChatOpen}>
                        💬 Chat with Concierge
                    </button>
                </div>
                <div className="hp-hero__stats">
                    <div><strong>200+</strong><span>Luxury Rooms</span></div>
                    <div className="divider" />
                    <div><strong>4.9★</strong><span>Guest Rating</span></div>
                    <div className="divider" />
                    <div><strong>20+</strong><span>Years of Excellence</span></div>
                    <div className="divider" />
                    <div><strong>24/7</strong><span>AI Concierge</span></div>
                </div>
            </div>
            <a href="#rooms" className="hp-hero__scroll" aria-label="Scroll down">
                <span className="scroll-arrow">↓</span>
            </a>
        </section>
    );
}

function Rooms() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <section id="rooms" className="hp-section hp-rooms">
            <div className="hp-section__inner">
                <div className="hp-section__header">
                    <span className="hp-section__tag">Accommodations</span>
                    <h2>Find Your Perfect Room</h2>
                    <p>Every room is a sanctuary — thoughtfully designed for comfort and indulgence</p>
                </div>
                <div className="hp-rooms__grid">
                    {ROOMS.map((room) => (
                        <article key={room.id} className="hp-room-card">
                            <div className="hp-room-card__img-wrap">
                                <img src={room.img} alt={room.name} loading="lazy" />
                                {room.badge && <span className="hp-room-card__badge">{room.badge}</span>}
                            </div>
                            <div className="hp-room-card__body">
                                <h3>{room.name}</h3>
                                <p>{room.desc}</p>
                                <div className="hp-room-card__features">
                                    {room.features.map((f) => (
                                        <span key={f} className="hp-feature-tag">{f}</span>
                                    ))}
                                </div>
                                <div className="hp-room-card__footer">
                                    <div className="hp-room-card__price">
                                        <span className="from">from</span>
                                        <strong>${room.price}</strong>
                                        <span className="night">/night</span>
                                    </div>
                                    <button
                                        className="hp-btn hp-btn--sm"
                                        onClick={() => user ? alert(`Booking flow for ${room.name} coming soon!`) : navigate('/signup')}
                                    >
                                        {user ? 'Reserve' : 'Sign up to book'}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Amenities() {
    return (
        <section id="amenities" className="hp-section hp-amenities">
            <div className="hp-section__inner">
                <div className="hp-section__header">
                    <span className="hp-section__tag">World-Class Facilities</span>
                    <h2>Everything You Need</h2>
                    <p>Our amenities are designed to exceed every expectation</p>
                </div>
                <div className="hp-amenities__grid">
                    {AMENITIES.map((a) => (
                        <div key={a.title} className="hp-amenity-card">
                            <div className="hp-amenity-card__icon">{a.icon}</div>
                            <h3>{a.title}</h3>
                            <p>{a.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Gallery() {
    const imgs = [
        { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', alt: 'Pool' },
        { url: 'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=600&q=80', alt: 'Lobby' },
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', alt: 'Restaurant' },
        { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80', alt: 'Spa' },
        { url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80', alt: 'Room' },
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', alt: 'Beach' },
    ];

    return (
        <section id="gallery" className="hp-section hp-gallery">
            <div className="hp-section__inner">
                <div className="hp-section__header">
                    <span className="hp-section__tag">Gallery</span>
                    <h2>A Glimpse of Paradise</h2>
                    <p>Every corner of Haile Resort Hawassa is a photo waiting to happen</p>
                </div>
                <div className="hp-gallery__grid">
                    {imgs.map((img, i) => (
                        <div key={i} className={`hp-gallery__item hp-gallery__item--${i}`}>
                            <img src={img.url} alt={img.alt} loading="lazy" />
                            <div className="hp-gallery__item-overlay">
                                <span>{img.alt}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Reviews() {
    return (
        <section id="reviews" className="hp-section hp-reviews">
            <div className="hp-section__inner">
                <div className="hp-section__header">
                    <span className="hp-section__tag">Guest Reviews</span>
                    <h2>What Our Guests Say</h2>
                    <p>Real stories from real guests who experienced the Haile Resort difference</p>
                </div>
                <div className="hp-reviews__grid">
                    {REVIEWS.map((r) => (
                        <div key={r.name} className="hp-review-card">
                            <div className="hp-review-card__stars">
                                {'★'.repeat(r.rating)}
                            </div>
                            <p className="hp-review-card__text">"{r.text}"</p>
                            <div className="hp-review-card__author">
                                <div className="hp-review-card__avatar">{r.avatar}</div>
                                <div>
                                    <strong>{r.name}</strong>
                                    <span>{r.country}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Contact({ onChatOpen }) {
    return (
        <section id="contact" className="hp-section hp-contact">
            <div className="hp-section__inner">
                <div className="hp-contact__grid">
                    <div className="hp-contact__info">
                        <span className="hp-section__tag">Get in Touch</span>
                        <h2>We'd Love to Hear From You</h2>
                        <p>Our team is available 24/7 to assist with reservations, special requests, or any questions.</p>

                        <div className="hp-contact__details">
                            <div className="hp-contact__detail-item">
                                <span>📍</span>
                                <div>
                                    <strong>Address</strong>
                                    <p>A8, Hawassa</p>
                                </div>
                            </div>
                            <div className="hp-contact__detail-item">
                                <span>📞</span>
                                <div>
                                    <strong>Phone</strong>
                                    <p>096 331 3131</p>
                                </div>
                            </div>
                            <div className="hp-contact__detail-item">
                                <span>✉️</span>
                                <div>
                                    <strong>Email</strong>
                                    <p>info@haileresorthawassa.com</p>
                                </div>
                            </div>
                            <div className="hp-contact__detail-item">
                                <span>🕐</span>
                                <div>
                                    <strong>Check-in / Check-out</strong>
                                    <p>3:00 PM / 11:00 AM</p>
                                </div>
                            </div>
                        </div>

                        <button className="hp-btn hp-btn--primary" onClick={onChatOpen}>
                            💬 Chat with Concierge
                        </button>
                    </div>

                    <div className="hp-contact__map">
                        <iframe
                            title="Hotel Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.5!2d38.4762!3d7.0622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMDMnNDMuOSJOIDM4wrAyOCczNC4zIkU!5e0!3m2!1sen!2set!4v1"
                            width="100%"
                            height="100%"
                            style={{ border: 0, borderRadius: '16px' }}
                            allowFullScreen=""
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="hp-footer">
            <div className="hp-footer__inner">
                <div className="hp-footer__brand">
                    <span>🏨</span>
                    <div>
                        <strong>Haile Resort Hawassa</strong>
                        <p>Where Luxury Meets the Lake</p>
                    </div>
                </div>
                <div className="hp-footer__links">
                    <a href="#rooms">Rooms</a>
                    <a href="#amenities">Amenities</a>
                    <a href="#gallery">Gallery</a>
                    <a href="#contact">Contact</a>
                </div>
                <p className="hp-footer__copy">
                    © {new Date().getFullYear()} Haile Resort Hawassa. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HotelPage() {
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <div className="hotel-page">
            <Navbar onChatOpen={() => setChatOpen(true)} />
            <Hero onChatOpen={() => setChatOpen(true)} />
            <Rooms />
            <Amenities />
            <Gallery />
            <Reviews />
            <Contact onChatOpen={() => setChatOpen(true)} />
            <Footer />

            {/* Floating chatbot widget */}
            <ChatWidget isOpen={chatOpen} onToggle={() => setChatOpen((p) => !p)} />
        </div>
    );
}
