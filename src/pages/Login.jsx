import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to sign in. Ensure you verified your email!');
        return;
      }

      // Success, route to home
      navigate('/');
    } catch (err) {
      setError('Server error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Log In</h2>
          <p className="subtitle">Welcome back to StudyBuddy</p>
          
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="you@university.edu" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            {error && <p className="login-msg error" style={{color: 'red', marginTop: '10px'}}>{error}</p>}
          </form>
          
          <div className="auth-links">
            Don't have an account? 
            <Link to="/register"><button type="button">Register here</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
