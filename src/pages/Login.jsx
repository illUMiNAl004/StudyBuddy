import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../Supabase_Config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.endsWith('@umass.edu')) {
      setErrorMsg('Please use a valid @umass.edu email address.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.user) {
      navigate('/');
    }
  };

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Log In</h2>
          <p className="subtitle">Welcome back to StudyBuddy</p>
          
          <form className="auth-form" onSubmit={handleLogin}>
            {errorMsg && (
              <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="auth-field">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="you@umass.edu" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-links">
            Don't have an account? 
            <Link to="/register"><button>Register here</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
