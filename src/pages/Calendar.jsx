import { useState, useEffect } from 'react';
import supabase from '../../Supabase_Config/supabaseClient';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [subscribedCourses, setSubscribedCourses] = useState([]);
  const [addingCourse, setAddingCourse] = useState(false);

  // Get current month details
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  
  // Calculate start and end of the current month
  const firstDay = new Date(currentYear, today.getMonth(), 1);
  const lastDay = new Date(currentYear, today.getMonth() + 1, 0, 23, 59, 59);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const userMeta = sessionData?.session?.user?.user_metadata || {};
      const userSiCourses = userMeta.si_courses || [];
      setSubscribedCourses(userSiCourses);

      // 1. Fetch DB group events
      const dbPromise = supabase
        .from('calendar_event')
        .select('id, start_time, end_time, location, group_id, groups(group_title)')
        .gte('start_time', firstDay.toISOString())
        .lte('start_time', lastDay.toISOString())
        .order('start_time', { ascending: true });

      // 2. Fetch Available Courses for Dropdown
      const coursesPromise = supabase.functions.invoke('Aidan-SI-scrapper', {
        body: { course: 'NONE', action: 'get_courses' }
      }).then(res => res.data?.courses || []).catch(() => []);

      // 3. Live scrape SI Sessions for Subscribed Courses
      const edgePromise = (userSiCourses.length > 0) ? supabase.functions.invoke('Aidan-SI-scrapper', {
        body: { course: userSiCourses, action: 'fetch' }
      }).then(res => res.data?.sessions || []).catch(() => []) : Promise.resolve([]);

      const [dbRes, coursesList, scrapedEvents] = await Promise.all([dbPromise, coursesPromise, edgePromise]);

      if (dbRes.error) {
        if (dbRes.error.message.includes('schema cache')) {
            throw new Error("Your database schema cache is stale. Please go to Supabase -> SQL Editor and run: NOTIFY pgrst, 'reload schema';");
        }
        throw dbRes.error;
      }
      
      setAvailableCourses(coursesList);

      // Merge and sort events
      const dbEvents = dbRes.data || [];
      
      const merged = [...dbEvents, ...scrapedEvents].sort((a, b) => 
        new Date(a.start_time) - new Date(b.start_time)
      );

      setEvents(merged);
    } catch (err) {
      setError(err.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCourse() {
    if (!selectedCourse || subscribedCourses.includes(selectedCourse)) return;
    setAddingCourse(true);
    
    try {
      const newCourses = [...subscribedCourses, selectedCourse];
      const { data, error } = await supabase.auth.updateUser({
        data: { si_courses: newCourses }
      });
      
      if (error) throw error;
      
      setSubscribedCourses(newCourses);
      setSelectedCourse('');
      setAddingCourse(false); // Reset button immediately
      
      // Re-fetch in background
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to subscribe to course.');
      setAddingCourse(false);
    }
  }

  async function handleRemoveCourse(courseToRemove) {
    try {
      const newCourses = subscribedCourses.filter(c => c !== courseToRemove);
      const { error } = await supabase.auth.updateUser({
        data: { si_courses: newCourses }
      });
      if (error) throw error;
      
      setSubscribedCourses(newCourses);
      
      // Re-fetch in background
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to remove course.');
    }
  }

  // Group events by Date String
  const groupedEvents = events.reduce((acc, event) => {
    const dateStr = new Date(event.start_time).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {});

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700 }}>{currentMonthName} {currentYear}</h1>
          <p style={{ color: 'var(--muted)', margin: '8px 0 0 0', fontSize: '1.1rem' }}>
            Your upcoming study sessions and group events.
          </p>
        </div>
        
        {/* SI Session Subscriptions Box */}
        <div style={{ background: 'var(--surface)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', minWidth: '300px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Add SI Sessions</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="">Select Course...</option>
              {availableCourses.filter(c => !subscribedCourses.includes(c)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button 
              onClick={handleAddCourse}
              disabled={addingCourse || !selectedCourse}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: (!selectedCourse || addingCourse) ? 'not-allowed' : 'pointer', opacity: (!selectedCourse || addingCourse) ? 0.6 : 1 }}
            >
              {addingCourse ? 'Adding...' : 'Add'}
            </button>
          </div>
          
          {subscribedCourses.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {subscribedCourses.map(c => (
                <div key={c} style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  {c}
                  <button onClick={() => handleRemoveCourse(c)} style={{ background: 'transparent', border: 'none', color: '#1565c0', cursor: 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1 }}>&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#ffebee', color: '#d32f2f', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading schedule...</div>
      ) : events.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '60px 40px', textAlign: 'center', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Your calendar is clear!</h3>
          <p style={{ color: 'var(--muted)' }}>No upcoming events or SI sessions for this month.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                {dateLabel}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {dayEvents.map(event => {
                  const s = new Date(event.start_time);
                  const e = new Date(event.end_time);
                  const startTime = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                  const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                  return (
                    <div key={event.id} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'default' }}
                         onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                         onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        {startTime} - {endTime}
                      </div>
                      
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text)' }}>
                        {event.location || 'Group Session'}
                      </h4>
                      
                      <div style={{ display: 'inline-block', background: event.is_si_session ? '#e3f2fd' : 'var(--bg)', border: event.is_si_session ? '1px solid #90caf9' : '1px solid var(--border)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', color: event.is_si_session ? '#1565c0' : 'var(--muted)', fontWeight: 600 }}>
                        {event.is_si_session ? `UMass LRC SI Session` : `Group: ${event.groups?.group_title || 'Unknown Group'}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
