import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../../Supabase_Config/supabaseClient';

export default function Sidebar() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      async function fetchProfile() {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, major, class_year')
          .eq('id', user.id)
          .single();
        
        if (data) setProfile(data);
      }
      fetchProfile();
    }
  }, [user]);

  const initials = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="profile-card">
        <div className="avatar">{initials}</div>
        <h3>{profile?.full_name || 'Student'}</h3>
        <p>
          {profile?.major || 'Undecided'} · {profile?.class_year || 'Undergrad'}
        </p>
        <div className="profile-stat"><span>Study sessions</span><span>0</span></div>
        <div className="profile-stat"><span>Groups joined</span><span>0</span></div>
        <div className="profile-stat"><span>Notes shared</span><span>0</span></div>
      </div>

      <div className="sidebar-card">
        <h4>My Groups</h4>
        <div className="group-item">
          <span className="group-dot" />
          Group Name
        </div>
        <div className="group-item">
          <span className="group-dot" style={{ background: '#7a9e7e' }} />
          Group Name
        </div>
        <div className="group-item">
          <span className="group-dot" style={{ background: '#6b8cba' }} />
          Group Name
        </div>
      </div>

      <div className="sidebar-card">
        <h4>Upcoming LRC</h4>
        <div className="group-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Session Name</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Day · Time · Location</span>
        </div>
        <div className="group-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', borderBottom: 'none' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Session Name</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Day · Time · Location</span>
        </div>
      </div>
    </aside>
  )
}
