import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../Supabase_Config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [classYear, setClassYear] = useState('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.endsWith('@umass.edu')) {
      setErrorMsg('Registration is currently restricted to @umass.edu emails.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          major: major,
          class_year: classYear,
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.user) {
      if (data.session) {
        // If email confirmations are disabled, they are automatically logged in!
        navigate('/');
      } else {
        // If email confirmations are ON, they don't get a session yet.
        setErrorMsg('Success! Please check your email inbox to confirm your account.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="subtitle">Join StudyBuddy and sync your studies</p>
          
          <form className="auth-form" onSubmit={handleRegister}>
            {errorMsg && (
              <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="auth-field">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

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
            
            <div className="auth-field" style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Major</label>
                <input 
                  type="text" 
                  placeholder="Computer Science" 
                  required 
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Class Year</label>
                <input 
                  type="text" 
                  placeholder="2027" 
                  required 
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                />
              </div>
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
            
            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
          
          <div className="auth-links">
            Already have an account? 
            <Link to="/login"><button>Log in</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
