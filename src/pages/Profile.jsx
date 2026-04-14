import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../Supabase_Config/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [classYear, setClassYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, major, class_year')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFullName(data.full_name || '');
        setMajor(data.major || '');
        setClassYear(data.class_year || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          major,
          class_year: classYear,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="page" style={{ textAlign: 'center', marginTop: '40px' }}>Loading Profile...</div>;
  }

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Your Profile</h2>
          <p className="subtitle">Manage your StudyBuddy information</p>

          <form className="auth-form" onSubmit={handleSave}>
            {message.text && (
              <div style={{ 
                color: message.type === 'error' ? '#d32f2f' : '#2e7d32', 
                background: message.type === 'error' ? '#ffebee' : '#e8f5e9', 
                padding: '10px', 
                borderRadius: '8px', 
                fontSize: '0.85rem' 
              }}>
                {message.text}
              </div>
            )}

            <div className="auth-field">
              <label>Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="auth-field" style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Major</label>
                <select 
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a major...</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Business">Business</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Class Year</label>
                <input 
                  type="text" 
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
             <button 
                onClick={handleSignOut} 
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#d32f2f',
                  border: '1px solid #d32f2f',
                  borderRadius: '12px',
                  padding: '12px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.target.style.background = '#ffebee'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Log Out
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
