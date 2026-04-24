import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../../Supabase_Config/supabaseClient';

const GROUP_COLORS = ['#c0735a', '#7a9e7e', '#6b8cba', '#9b7ec8', '#c0a05a', '#7abab5'];

export default function Sidebar() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setGroups([]);
      setNotesCount(0);
      return;
    }

    async function fetchSidebarData() {
      const [{ data: profileData }, { data: memberData }, { count }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, major, class_year')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_in_group')
          .select('group_id, groups(id, group_title)')
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', user.id),
      ]);

      if (profileData) setProfile(profileData);

      if (memberData) {
        setGroups(
          memberData
            .filter(row => row.groups)
            .map(row => ({ id: row.groups.id, title: row.groups.group_title }))
        );
      }

      setNotesCount(count ?? 0);
    }

    fetchSidebarData();
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
        <div className="profile-stat"><span>Groups joined</span><span>{groups.length}</span></div>
        <div className="profile-stat"><span>Notes shared</span><span>{notesCount}</span></div>
      </div>

      <div className="sidebar-card">
        <h4>My Groups</h4>
        {groups.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '4px 0' }}>
            {user ? 'No groups yet' : 'Log in to see your groups'}
          </p>
        ) : (
          groups.map((g, i) => (
            <div key={g.id} className="group-item">
              <span className="group-dot" style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }} />
              {g.title}
            </div>
          ))
        )}
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
  );
}
