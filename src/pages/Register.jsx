import { useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '', email: '', major: '', class_year: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to sign up.');
        return;
      }

      setSuccess('Signup successful! Check your email to verify your account.');
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
          <h2>Create Account</h2>
          <p className="subtitle">Join StudyBuddy and sync your studies</p>
          
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" required />
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@umass.edu" required />
            </div>
            
            <div className="auth-field" style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Major</label>
                <input type="text" name="major" value={form.major} onChange={handleChange} placeholder="Computer Science" required />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Class Year</label>
                <input type="text" name="class_year" value={form.class_year} onChange={handleChange} placeholder="2027" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input type="password" name="password" minLength={8} value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            {error && <p className="login-msg error" style={{color: 'red', marginTop: '10px'}}>{error}</p>}
            {success && <p className="login-msg success" style={{color: 'green', marginTop: '10px'}}>{success}</p>}
          </form>
          
          <div className="auth-links">
            Already have an account? 
            <Link to="/login"><button type="button">Log in</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
