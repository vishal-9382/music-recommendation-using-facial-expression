import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Bgm from './components/bgm.mp4';
import './App.css';

function Garlic() {
    const [isLoading, setIsLoading] = useState(false);
    const [mood, setMood] = useState(null);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('emotifyTheme') !== 'light');
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedMoodOverride, setSelectedMoodOverride] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const username = sessionStorage.getItem('loggedInUser') || "Anonymous";
    const navigate = useNavigate();

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('emotifyTheme', newTheme ? 'dark' : 'light');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        navigate('/login');
    };

    const handleDetect = async () => {
        setIsLoading(true);
        setMood(null);
        setError(null);
        setIsPlaying(false);

        try {
            const response = await fetch("http://127.0.0.1:5000/detect");
            if (!response.ok) {
                throw new Error("Server error");
            }
            const data = await response.json();
            
            if (data.mood === "Camera Error") {
                setError("Camera not reachable. Please check your webcam.");
            } else if (data.mood) {
                setMood(data.mood);
                setSelectedMoodOverride(data.mood);
            } else {
                setError("Could not detect mood.");
            }
        } catch (err) {
            setError("Failed to connect to camera server. Make sure py main.py is running!");
        }
        setIsLoading(false);
    };

    const handlePlay = () => {
        const finalMood = selectedMoodOverride || mood;
        
        // Save to localStorage for Dashboard
        const history = JSON.parse(localStorage.getItem('emotifyHistory') || '[]');
        history.push({ username: username, mood: finalMood, date: new Date().toISOString() });
        localStorage.setItem('emotifyHistory', JSON.stringify(history));
        
        setIsPlaying(true);
    };

    const allMoods = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise', 'Energetic', 'Calm'];

    return (
        <div className={`app-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            {/* Navbar */}
            <nav className="glass-navbar">
                <div className="nav-brand">
                    <span className="logo">Emotify</span>
                    <span className="brand-subtitle">Music Recommendation System</span>
                </div>
                <div className="nav-links">
                    <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Theme">
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <a href="/home" className="nav-link active">Home</a>
                    <a href="/dashboard" className="nav-link">Dashboard</a>
                    <a href="/about" className="nav-link">About Us</a>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            {/* Video Background */}
            <div className="video-background">
                <div className="video-overlay"></div>
                <video loop autoPlay muted playsInline id="myvideo">
                    <source src={Bgm} type="video/mp4" />
                </video>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {!isPlaying ? (
                    <>
                        <div className="hero-section">
                            <h1 className="hero-title">Introducing Emotify</h1>
                            <p className="hero-subtitle">
                                We've trained a model called Emotify which reads facial expressions<br />
                                and plays songs to lighten your mood.
                            </p>
                        </div>
                        
                        <div className="interaction-section">
                            {!isLoading && !mood && !error && (
                                <button 
                                    onClick={handleDetect} 
                                    className="btn-glow" 
                                >
                                    Try Emotify
                                </button>
                            )}

                            {isLoading && (
                                <div className="glass-panel slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="camera-feed-container" style={{ position: 'relative', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                                        <img 
                                            src="http://127.0.0.1:5000/video_feed" 
                                            alt="Camera Feed" 
                                            style={{ width: '100%', display: 'block' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <div className="scanner-line"></div>
                                        <div className="corner-decor top-left"></div>
                                        <div className="corner-decor top-right"></div>
                                        <div className="corner-decor bottom-left"></div>
                                        <div className="corner-decor bottom-right"></div>
                                        <div className="scanning-status">
                                            <span className="live-dot"></span> ANALYZING FACIAL GEOMETRY
                                        </div>
                                    </div>
                                    <div className="spinner-border text-light mb-3 custom-spinner" role="status" style={{ width: "3rem", height: "3rem" }}></div>
                                    <h3 className="loading-text">Detecting your mood...</h3>
                                    <p className="loading-subtext">Please look directly at the camera</p>
                                </div>
                            )}

                            {mood && !error && (
                                <div className="glass-panel pop-in">
                                    <h2 className="mood-title">You look <span className="mood-highlight">{mood}</span>!</h2>
                                    <p className="mood-subtitle">Here's a curated playlist just for you.</p>
                                    
                                    <div className="override-section" style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <label style={{ fontSize: '15px', color: 'var(--text-sub)' }}>Not feeling {mood}? Change it: </label>
                                        
                                        <div className="custom-dropdown-container">
                                            <div 
                                                className="custom-dropdown-header" 
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            >
                                                <span>{selectedMoodOverride || mood}</span>
                                                <span style={{ fontSize: '12px', marginLeft: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
                                            </div>
                                            
                                            {isDropdownOpen && (
                                                <ul className="custom-dropdown-list">
                                                    {allMoods.map(m => (
                                                        <li 
                                                            key={m} 
                                                            className="custom-dropdown-item"
                                                            onClick={() => {
                                                                setSelectedMoodOverride(m);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            {m}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="button-group">
                                        <button className="btn-accept" onClick={handlePlay}>Accept & Play</button>
                                        <button className="btn-cancel" onClick={() => setMood(null)}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="glass-panel error-panel shake">
                                    <h3 className="error-title">Oops!</h3>
                                    <p className="error-text">{error}</p>
                                    <button className="btn-warning-custom" onClick={() => setError(null)}>Try Again</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="player-section pop-in" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <h2 style={{ marginBottom: '15px' }}>Your <span className="mood-highlight">{selectedMoodOverride || mood}</span> Mix is Ready!</h2>
                            <p style={{ color: 'var(--text-sub)', marginBottom: '35px', fontSize: '18px' }}>
                                Click the button below to launch your customized playlist.
                            </p>
                            
                            <button className="btn-glow" onClick={() => {
                                const q = encodeURIComponent((selectedMoodOverride || mood) + ' music playlist');
                                window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank');
                            }} style={{ width: '100%', padding: '20px', fontSize: '22px', marginBottom: '20px' }}>
                                ▶ Listen on YouTube
                            </button>
                            
                            <div style={{ marginTop: '20px' }}>
                                <button className="btn-cancel" onClick={() => { setIsPlaying(false); setMood(null); }}>Back to Home</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Garlic;