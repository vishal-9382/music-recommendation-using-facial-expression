import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard() {
    const [history, setHistory] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('emotifyTheme') !== 'light');
    const username = sessionStorage.getItem('loggedInUser') || "Anonymous";
    const navigate = useNavigate();
    
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('emotifyHistory') || '[]');
        // Sort by date descending
        saved.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(saved);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        navigate('/login');
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('emotifyTheme', newTheme ? 'dark' : 'light');
    };

    // Filter history by user
    const filteredHistory = history.filter(item => item.username === username);

    // Calculate stats
    const stats = {};
    filteredHistory.forEach(item => {
        stats[item.mood] = (stats[item.mood] || 0) + 1;
    });

    return (
        <div className={`app-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`} style={{ background: 'var(--bg-color)' }}>
            <nav className="glass-navbar">
                <div className="nav-brand">
                    <span className="logo">Emotify</span>
                    <span className="brand-subtitle">Your Dashboard</span>
                </div>
                <div className="nav-links">
                    <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <a href="/home" className="nav-link">Home</a>
                    <a href="/dashboard" className="nav-link active">Dashboard</a>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>
            
            <div className="main-content" style={{ flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', animation: 'slideUp 0.6s ease' }}>
                    <h2 className="mood-title" style={{ marginBottom: '30px' }}>Your Mood Analytics, {username}</h2>

                    {filteredHistory.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>You haven't used Emotify yet. Go detect your mood!</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Top Moods</h3>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([m, count]) => (
                                        <li key={m} style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', fontSize: '18px' }}>
                                            <span>{m}</span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--mood-highlight)' }}>{count} times</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Recent History</h3>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {filteredHistory.slice(0, 5).map((item, i) => (
                                        <li key={i} style={{ margin: '15px 0', fontSize: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                            <span style={{ color: 'var(--mood-highlight)' }}>
                                                {item.mood}
                                            </span>
                                            <span style={{ color: 'var(--text-sub)', fontSize: '14px' }}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
