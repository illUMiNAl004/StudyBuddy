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
  const [siCourses, setSiCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedSiCourse, setSelectedSiCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAvailableCourses();
    }
  }, [user]);

  const fetchAvailableCourses = async () => {
    try {
      const { data } = await supabase.functions.invoke('Aidan-SI-scrapper', {
        body: { course: 'NONE', action: 'get_courses' }
      });
      if (data?.courses) {
        setAvailableCourses(data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, major, class_year')
        .eq('id', user.id)
        .single();

      // Fetch user metadata for SI courses
      const { data: sessionData } = await supabase.auth.getSession();
      const userMeta = sessionData?.session?.user?.user_metadata || {};
      setSiCourses(userMeta.si_courses || []);

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
      // Save SI courses to Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { si_courses: siCourses }
      });
      if (authError) throw authError;

      // Save profile info to DB
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

            <div className="auth-field">
              <label>Subscribed SI Courses</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select 
                  value={selectedSiCourse} 
                  onChange={e => setSelectedSiCourse(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Add Course...</option>
                  {availableCourses.filter(c => !siCourses.includes(c)).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => {
                    if (selectedSiCourse && !siCourses.includes(selectedSiCourse)) {
                      setSiCourses([...siCourses, selectedSiCourse]);
                      setSelectedSiCourse('');
                    }
                  }}
                  disabled={!selectedSiCourse}
                  style={{ width: 'auto', padding: '0 16px' }}
                >
                  Add
                </button>
              </div>
              
              {siCourses.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {siCourses.map(c => (
                    <div key={c} style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      {c}
                      <button 
                        type="button"
                        onClick={() => setSiCourses(siCourses.filter(sc => sc !== c))} 
                        style={{ background: 'transparent', border: 'none', color: '#1565c0', cursor: 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1 }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
