import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Bgm from './components/bgm.mp4';
import './App.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username.trim() === '' || password.trim() === '') {
            setError('Please enter both username and password.');
            return;
        }
        
        // Simulating a successful login and storing in session
        sessionStorage.setItem('loggedInUser', username.trim());
        
        // Optional: you could also set a cookie here if strictly needed, 
        // but sessionStorage serves the purpose of session data perfectly for React.
        document.cookie = `emotifyUser=${username.trim()}; path=/`;

        navigate('/home');
    };

    return (
        <div className="app-container dark-theme">
            {/* Video Background */}
            <div className="video-background">
                <div className="video-overlay" style={{ background: 'rgba(0,0,0,0.7)' }}></div>
                <video loop autoPlay muted playsInline id="myvideo">
                    <source src={Bgm} type="video/mp4" />
                </video>
            </div>

            <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 0 }}>
                <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', animation: 'slideUp 0.6s ease' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 className="logo" style={{ fontSize: '42px', marginBottom: '10px' }}>Emotify</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Sign in to continue</p>
                    </div>

                    {error && (
                        <div style={{ background: 'var(--error-bg)', color: '#ff4d4d', padding: '10px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--error-border)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <input 
                                type="text" 
                                placeholder="Username" 
                                className="custom-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input 
                                type="password" 
                                placeholder="Password" 
                                className="custom-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-glow" style={{ marginTop: '10px', width: '100%' }}>
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
