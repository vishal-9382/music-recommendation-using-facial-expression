import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './App.css';

function About() {
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('emotifyTheme') !== 'light');
    const username = sessionStorage.getItem('loggedInUser') || "Anonymous";
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        navigate('/login');
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('emotifyTheme', newTheme ? 'dark' : 'light');
    };

    return (
        <div className={`app-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`} style={{ background: 'var(--bg-color)' }}>
            <nav className="glass-navbar">
                <div className="nav-brand">
                    <span className="logo">Emotify</span>
                    <span className="brand-subtitle">About Us</span>
                </div>
                <div className="nav-links">
                    <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <a href="/home" className="nav-link">Home</a>
                    <a href="/dashboard" className="nav-link">Dashboard</a>
                    <a href="/about" className="nav-link active">About Us</a>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <div className="glass-panel" style={{ maxWidth: '800px', animation: 'slideUp 0.6s ease' }}>
                    <h1 className="hero-title" style={{ fontSize: '48px', marginBottom: '20px' }}>Our Mission</h1>
                    <p style={{ color: 'var(--text-primary)', fontSize: '22px', lineHeight: '1.8', fontWeight: '300' }}>
                        This Project focuses on music for all emotions, whether you are happy, sad, or suffering a heartbreak.
                        <br/><br/>
                        Our app doesn't need to be told anything—it reads your emotion like a friend and plays a song to soothe your heart.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default About;