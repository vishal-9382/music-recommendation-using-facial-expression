import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Bgm from './components/bgm.mp4';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

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
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

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

        let stream = null;
        try {
            // Request browser webcam access
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            // Capture frames for 3.5 seconds and send to backend
            const canvas = canvasRef.current;
            const moodCounts = {};
            const startTime = Date.now();
            const duration = 3500;

            while (Date.now() - startTime < duration) {
                if (videoRef.current && canvas && videoRef.current.videoWidth > 0) {
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(videoRef.current, 0, 0);
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);

                    try {
                        const res = await fetch(`${API_URL}/detect_frame`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: imageData })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.mood) {
                                moodCounts[data.mood] = (moodCounts[data.mood] || 0) + 1;
                            }
                        }
                    } catch (e) { /* ignore individual frame errors */ }
                }
                await new Promise(r => setTimeout(r, 300));
            }

            // Pick the most frequently detected mood
            if (Object.keys(moodCounts).length > 0) {
                const detectedMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
                setMood(detectedMood);
                setSelectedMoodOverride(detectedMood);
            } else {
                setError("No face detected. Please look directly at the camera and try again.");
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setError("Camera permission denied. Please allow camera access in your browser.");
            } else {
                setError("Failed to connect to the detection server. Make sure the backend is running.");
            }
        } finally {
            // Always stop the webcam stream
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (videoRef.current) videoRef.current.srcObject = null;
            setIsLoading(false);
        }
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
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            style={{ width: '100%', display: 'block' }}
                                        />
                                        <canvas ref={canvasRef} style={{ display: 'none' }} />
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