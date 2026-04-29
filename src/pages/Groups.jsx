import { useEffect, useState } from 'react'
import supabase from '../../Supabase_Config/supabaseClient'
import { useAuth } from '../context/AuthContext'

const tool_tabs = [
  { key: 'notes', label: 'N', fullName: 'Notes' },
  { key: 'calendar', label: 'C', fullName: 'Calendar' },
  { key: 'team', label: 'T', fullName: 'Team' },
]

const mock_group = {
  id: 'mock-group-1',
  name: 'Algo Aces',
  courseName: 'CICS 220',
  courseTag: 'Algorithms',
  creatorId: 'mock-user-1',
  members: ['Tanishq Saria', 'Aidan Patel', 'Alex Chen', 'Sai Reddy'],
  notes: ['Dynamic Programming Cheatsheet', 'Graph Traversal Patterns', 'Midterm 2 Review'],
  calendar: [
    { title: 'Weekly Group Session', time: 'Thu 7:00 PM' },
    { title: 'Problem Set Sprint', time: 'Sun 2:00 PM' },
  ],
  pendingJoinRequests: [{ id: 'mock-request-1', requesterName: 'Jordan Kim' }],
}

const mock_posts = {
  'mock-group-1': [
    {
      id: 'mock-post-1',
      author: 'Aidan Patel',
      body: 'Anyone want to split up Dijkstra, Bellman-Ford, and Floyd-Warshall notes for this week?',
      createdAt: '2h ago',
      comments: [
        { author: 'Alex Chen', text: 'I can take Bellman-Ford.' },
        { author: 'Sai Reddy', text: 'I can do Dijkstra and examples.' },
      ],
    },
    {
      id: 'mock-post-2',
      author: 'Tanishq Saria',
      body: 'Posted a dry-run template for recurrence relation problems before office hours.',
      createdAt: '6h ago',
      comments: [{ author: 'Aidan Patel', text: 'Template is super clean, thanks.' }],
    },
  ],
}

function getRelativeTime(ts) {
  if (!ts) return 'Just now'
  let diff = Date.now() - new Date(ts).getTime()
  let mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  let hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h ago'
  return Math.floor(hrs / 24) + 'd ago'
}

function getEventTime(start, end) {
  if (!start) return 'No time set'
  let s = new Date(start)
  let day = s.toLocaleDateString(undefined, { weekday: 'short' })
  let start_str = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (!end) return day + ' ' + start_str
  let end_str = new Date(end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return day + ' ' + start_str + '-' + end_str
}

function GroupTools({ active_tool, on_tool_change, selected_group, all_groups, user_id, on_approve, approving_id, on_reject, rejecting_id, on_add_event, on_import_lrc, on_delete_event }) {
  let title = selected_group
    ? selected_group.name + ' • ' + selected_group.courseName
    : 'All your groups'

  let items = []

  if (active_tool === 'notes') {
    if (selected_group) {
      for (let n of selected_group.notes) {
        items.push({ type: 'note', label: n + ' • ' + selected_group.courseName })
      }
    } else {
      for (let grp of all_groups) {
        for (let n of grp.notes) {
          items.push({ type: 'note', label: n + ' • ' + grp.courseName })
        }
      }
    }
  } else if (active_tool === 'calendar') {
    let seen = new Set()
    if (selected_group) {
      for (let ev of selected_group.calendar) {
        let str = ev.title + ' • ' + ev.time
        if (!seen.has(str)) {
          seen.add(str)
          items.push({ type: 'calendar_event', label: str, title: ev.title })
        }
      }
    } else {
      for (let grp of all_groups) {
        for (let ev of grp.calendar) {
          let str = ev.title + ' • ' + ev.time + ' • ' + grp.name
          if (!seen.has(str)) {
            seen.add(str)
            items.push({ type: 'calendar_event', label: str, title: ev.title })
          }
        }
      }
    }
  } else if (active_tool === 'team') {
    if (selected_group) {
      for (let m of selected_group.members) {
        items.push({ type: 'member', name: m })
      }
      for (let req of (selected_group.pendingJoinRequests || [])) {
        items.push({ type: 'request', id: req.id, requesterName: req.requesterName })
      }
    } else {
      let seen = []
      for (let grp of all_groups) {
        for (let m of grp.members) {
          if (!seen.includes(m)) {
            seen.push(m)
            items.push({ type: 'member', name: m })
          }
        }
      }
    }
  }

  let empty_msgs = {
    notes: 'No linked notes yet',
    calendar: 'No upcoming events yet',
    team: 'No teammates yet',
  }

  // Any member can delete events now, but only if a group is selected
  let is_creator = selected_group && selected_group.creatorId === user_id

  return (
    <aside className="groups-tools-wrap">
      <div className="groups-tools">
        <div className="groups-tools-header">
          <h3>{title}</h3>
        </div>
        <div className="groups-tools-content">
          <div className="groups-tools-list">
            {active_tool === 'calendar' && selected_group && is_creator && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button 
                  onClick={on_add_event}
                  style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >+ Add Event</button>
                <button 
                  onClick={on_import_lrc}
                  style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >📥 Import LRC</button>
              </div>
            )}
            {items.length === 0 && (
              <div className="groups-tools-empty">{empty_msgs[active_tool]}</div>
            )}
            {items.length > 0 && active_tool !== 'team' && items.map((item, i) => (
              <div key={i} className="groups-tools-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.label}</span>
                {item.type === 'calendar_event' && selected_group && (
                  <button 
                    onClick={() => on_delete_event(item.title)}
                    style={{ background: 'transparent', border: 'none', color: '#d32f2f', cursor: 'pointer', padding: '4px', fontSize: '1rem', lineHeight: 1 }}
                    title="Delete meeting"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {items.length > 0 && active_tool === 'team' && items.map((item, i) => {
              if (item.type === 'request') {
                var is_creator = selected_group?.creatorId === user_id
                return (
                  <div key={i} className="groups-tools-item groups-tools-item-request">
                    <span style={{ flex: 1 }}>{item.requesterName} wants to join</span>
                    {is_creator && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem' }}
                          onClick={() => on_approve(selected_group.id, item.id, item.requesterName)}
                          disabled={approving_id === item.id || rejecting_id === item.id}
                        >
                          {approving_id === item.id ? '...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          style={{ background: '#f5f5f5', color: '#888', border: '1px solid #ddd', borderRadius: '8px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem' }}
                          onClick={() => on_reject(selected_group.id, item.id)}
                          disabled={approving_id === item.id || rejecting_id === item.id}
                        >
                          {rejecting_id === item.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              }
              return <div key={i} className="groups-tools-item">{item.name}</div>
            })}
          </div>
        </div>
      </div>

      <div className="groups-tools-buttons">
        {tool_tabs.map((tab) => (
          <button
            key={tab.key}
            className={'groups-tool-btn ' + (active_tool === tab.key ? 'active' : '')}
            onClick={() => on_tool_change(tab.key)}
            type="button"
            aria-label={tab.fullName}
          >
            {tab.label}
            <span className="groups-tool-btn-tooltip">{tab.fullName}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [selected_id, setSelectedId] = useState(null)
  const [active_tool, setActiveTool] = useState('notes')
  const [comment_text, setCommentText] = useState({})
  const [open_comments, setOpenComments] = useState({})
  const [posts, setPosts] = useState({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [approving_id, setApprovingId] = useState(null)
  const [rejecting_id, setRejectingId] = useState(null)
  const [groupToLeave, setGroupToLeave] = useState(null)

  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [eventLoc, setEventLoc] = useState('')
  const [eventStart, setEventStart] = useState('')
  const [eventEnd, setEventEnd] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importCourse, setImportCourse] = useState('')
  const [importing, setImporting] = useState(false)

  const [eventToDelete, setEventToDelete] = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(false)

  // Only show mock data when there's no logged-in user at all
  let use_mock = !user
  let mock_for_user = { ...mock_group, creatorId: user?.id || mock_group.creatorId }

  let groups_list = use_mock ? [mock_for_user] : groups
  let posts_map = use_mock ? { ...mock_posts, ...posts } : posts

  let selected = null
  for (let g of groups_list) {
    if (g.id === selected_id) {
      selected = g
      break
    }
  }

  async function load() {
    if (!user) return
    setLoading(true)
    setErr('')

      try {
        const { data: memberships, error: e1 } = await supabase
          .from('user_in_group')
          .select('group_id')
          .eq('user_id', user.id)

        if (e1) throw e1

        let group_ids = []
        for (let row of (memberships || [])) {
          if (!group_ids.includes(row.group_id)) group_ids.push(row.group_id)
        }

        if (group_ids.length === 0) {
          setGroups([])
          setPosts({})
          setLoading(false)
          return
        }

        const { data: grp_data, error: e2 } = await supabase
          .from('groups')
          .select('id, group_title, requires_invite, creator_id, created_at')
          .in('id', group_ids)
          .order('created_at', { ascending: false })

        if (e2) throw e2

        const { data: members_data, error: e3 } = await supabase
          .from('user_in_group')
          .select('group_id, user_id')
          .in('group_id', group_ids)

        if (e3) throw e3

        const { data: posts_data, error: e4 } = await supabase
          .from('posts')
          .select('id, group_id, user_id, description, created_at')
          .in('group_id', group_ids)
          .order('created_at', { ascending: false })

        if (e4) throw e4

        let post_ids = (posts_data || []).map(p => p.id)
        let comments_data = []
        if (post_ids.length > 0) {
          const { data: c_data, error: c_err } = await supabase
            .from('post_comments')
            .select('id, post_id, author_id, text, created_at')
            .in('post_id', post_ids)
            .order('created_at', { ascending: true })
          
          if (c_err && !c_err.message.includes('does not exist')) throw c_err
          if (c_data) comments_data = c_data
        }

        const { data: join_reqs, error: e5 } = await supabase
          .from('group_join_requests')
          .select('id, group_id, requester_id, status')
          .in('group_id', group_ids)
          .eq('status', 'pending')

        if (e5) throw e5

        const { data: cal_data, error: e6 } = await supabase
          .from('calendar_event')
          .select('id, group_id, start_time, end_time, location')
          .in('group_id', group_ids)
          .order('start_time', { ascending: true })

        if (e6 && !e6.message.includes('does not exist')) throw e6

        let all_uids = []
        for (let row of (members_data || [])) {
          if (!all_uids.includes(row.user_id)) all_uids.push(row.user_id)
        }
        for (let row of (posts_data || [])) {
          if (!all_uids.includes(row.user_id)) all_uids.push(row.user_id)
        }
        for (let row of comments_data) {
          if (!all_uids.includes(row.author_id)) all_uids.push(row.author_id)
        }
        for (let row of (join_reqs || [])) {
          if (!all_uids.includes(row.requester_id)) all_uids.push(row.requester_id)
        }

        let name_map = {}
        if (all_uids.length > 0) {
          const { data: profiles, error: e7 } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', all_uids)

          if (e7) throw e7

          for (let p of (profiles || [])) {
            name_map[p.id] = p.full_name || p.email || 'Member'
          }
        }

        let members_by_group = {}
        for (let row of (members_data || [])) {
          if (!members_by_group[row.group_id]) members_by_group[row.group_id] = []
          members_by_group[row.group_id].push(name_map[row.user_id] || 'Member')
        }

        let comments_by_post = {}
        for (let c of comments_data) {
          if (!comments_by_post[c.post_id]) comments_by_post[c.post_id] = []
          comments_by_post[c.post_id].push({
            author: name_map[c.author_id] || 'Member',
            text: c.text
          })
        }

        let posts_by_group = {}
        for (let post of (posts_data || [])) {
          if (!posts_by_group[post.group_id]) posts_by_group[post.group_id] = []
          let body = post.description?.trim() || 'No content'
          posts_by_group[post.group_id].push({
            id: post.id,
            author: name_map[post.user_id] || 'Member',
            body: body,
            createdAt: getRelativeTime(post.created_at),
            comments: comments_by_post[post.id] || [],
          })
        }

        let cal_by_group = {}
        for (let ev of (cal_data || [])) {
          if (!cal_by_group[ev.group_id]) cal_by_group[ev.group_id] = []
          cal_by_group[ev.group_id].push({
            title: ev.location || 'Group event',
            time: getEventTime(ev.start_time, ev.end_time),
          })
        }

        let reqs_by_group = {}
        for (let req of (join_reqs || [])) {
          if (!reqs_by_group[req.group_id]) reqs_by_group[req.group_id] = []
          reqs_by_group[req.group_id].push({
            id: req.id,
            requesterId: req.requester_id,
            requesterName: name_map[req.requester_id] || 'Student',
          })
        }

        let final_groups = []
        for (let grp of (grp_data || [])) {
          let grp_posts = posts_by_group[grp.id] || []
          let note_titles = []
          for (let p of grp_posts) {
            note_titles.push(p.body.split(' — ')[0])
          }
          final_groups.push({
            id: grp.id,
            name: grp.group_title,
            courseName: grp.requires_invite ? 'Invite-only group' : 'Open group',
            courseTag: grp.requires_invite ? 'Invite only' : 'Public',
            creatorId: grp.creator_id,
            members: members_by_group[grp.id] || [],
            notes: note_titles,
            calendar: cal_by_group[grp.id] || [],
            pendingJoinRequests: reqs_by_group[grp.id] || [],
          })
        }

        setGroups(final_groups)
        setPosts(posts_by_group)
      } catch (e) {
        setErr(e.message || 'Could not load groups right now.')
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    if (!user) return

    load()

    // Re-fetch when the user is added to a new group (e.g. just created one)
    const membership_sub = supabase
      .channel('user_in_group_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_in_group', filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe()

    // Re-fetch when someone sends a join request to any of the user's groups
    // so the creator sees it live in the Team tab without having to refresh
    const join_req_sub = supabase
      .channel('join_request_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_join_requests' },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(membership_sub)
      supabase.removeChannel(join_req_sub)
    }
  }, [user])

  useEffect(() => {
    if (!selected_id || groups.length === 0) return
    let still_there = false
    for (let g of groups) {
      if (g.id === selected_id) { still_there = true; break }
    }
    if (!still_there) setSelectedId(null)
  }, [groups, selected_id])

  function toggleComments(post_id) {
    setOpenComments(prev => ({ ...prev, [post_id]: !prev[post_id] }))
  }

  async function addComment(group_id, post_id) {
    let txt = (comment_text[post_id] || '').trim()
    if (!txt) return

    if (use_mock) {
      setPosts(prev => {
        let cur_posts = (posts_map[group_id] || [])
        let updated = []
        for (let p of cur_posts) {
          if (p.id === post_id) {
            updated.push({
              ...p,
              comments: [...p.comments, { author: user?.user_metadata?.full_name || user?.email || 'You', text: txt }],
            })
          } else {
            updated.push(p)
          }
        }
        return { ...prev, [group_id]: updated }
      })
      setCommentText(prev => ({ ...prev, [post_id]: '' }))
      return
    }

    try {
      setErr('')
      const { error } = await supabase.from('post_comments').insert({
        post_id: post_id,
        author_id: user.id,
        text: txt
      })
      if (error) throw error
      
      setCommentText(prev => ({ ...prev, [post_id]: '' }))
      load()
    } catch (e) {
      setErr(e.message || 'Could not post comment.')
    }
  }

  async function approveRequest(group_id, req_id, req_name) {
    if (use_mock) {
      setGroups(prev => {
        let src = prev.length > 0 ? prev : [mock_for_user]
        let out = []
        for (let g of src) {
          if (g.id === group_id) {
            out.push({
              ...g,
              members: [...g.members, req_name],
              pendingJoinRequests: g.pendingJoinRequests.filter(r => r.id !== req_id),
            })
          } else {
            out.push(g)
          }
        }
        return out
      })
      return
    }

    setApprovingId(req_id)
    try {
      const { error } = await supabase
        .from('group_join_requests')
        .update({ status: 'accepted' })
        .eq('id', req_id)

      if (error) throw error

      setGroups(prev => {
        let out = []
        for (let g of prev) {
          if (g.id === group_id) {
            out.push({
              ...g,
              members: [...g.members, req_name],
              pendingJoinRequests: g.pendingJoinRequests.filter(r => r.id !== req_id),
            })
          } else {
            out.push(g)
          }
        }
        return out
      })
    } catch (e) {
      setErr(e.message || 'Could not approve this request right now.')
    } finally {
      setApprovingId(null)
    }
  }

  async function rejectRequest(group_id, req_id) {
    if (use_mock) {
      setGroups(prev => {
        let src = prev.length > 0 ? prev : [mock_for_user]
        let out = []
        for (let g of src) {
          if (g.id === group_id) {
            out.push({ ...g, pendingJoinRequests: g.pendingJoinRequests.filter(r => r.id !== req_id) })
          } else {
            out.push(g)
          }
        }
        return out
      })
      return
    }

    setRejectingId(req_id)
    try {
      const { error } = await supabase
        .from('group_join_requests')
        .update({ status: 'rejected' })
        .eq('id', req_id)

      if (error) throw error

      setGroups(prev => {
        let out = []
        for (let g of prev) {
          if (g.id === group_id) {
            out.push({ ...g, pendingJoinRequests: g.pendingJoinRequests.filter(r => r.id !== req_id) })
          } else {
            out.push(g)
          }
        }
        return out
      })
    } catch (e) {
      setErr(e.message || 'Could not reject this request right now.')
    } finally {
      setRejectingId(null)
    }
  }

  async function leaveGroup(group_id) {
    if (use_mock) {
      setGroups(prev => prev.filter(g => g.id !== group_id))
      setSelectedId(null)
      return
    }

    try {
      setErr('')
      const { error } = await supabase
        .from('user_in_group')
        .delete()
        .eq('group_id', group_id)
        .eq('user_id', user.id)

      if (error) throw error

      setGroups(prev => prev.filter(g => g.id !== group_id))
      if (selected_id === group_id) setSelectedId(null)
    } catch (e) {
      setErr(e.message || 'Could not leave group. Are you the creator? (Creators cannot leave directly right now)')
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault()
    if (!eventLoc || !eventStart || !eventEnd) return
    setAddingEvent(true)
    setErr('')
    try {
      const { error } = await supabase.from('calendar_event').insert([{
        id: crypto.randomUUID(),
        group_id: selected.id,
        location: eventLoc,
        start_time: new Date(eventStart).toISOString(),
        end_time: new Date(eventEnd).toISOString()
      }])
      if (error) throw error
      
      setIsAddEventOpen(false)
      setEventLoc('')
      setEventStart('')
      setEventEnd('')
      load()
    } catch (err) {
      setErr(err.message || 'Failed to add event.')
    } finally {
      setAddingEvent(false)
    }
  }

  async function handleImportLrc(e) {
    e.preventDefault()
    if (!importCourse.trim()) return
    setImporting(true)
    setErr('')
    try {
      const { data, error } = await supabase.functions.invoke('Aidan-SI-scrapper', {
        body: { course: importCourse.trim(), group_id: selected.id }
      })
      if (error) throw new Error(error.message || 'Failed to invoke function')
      if (data.error) throw new Error(data.error)
      
      alert(`Successfully imported ${data.inserted} SI sessions!`)
      setIsImportOpen(false)
      setImportCourse('')
      load()
    } catch (err) {
      setErr(err.message || 'Failed to import LRC schedule.')
    } finally {
      setImporting(false)
    }
  }

  async function confirmDeleteEvent() {
    if (!eventToDelete) return
    if (use_mock) {
      setEventToDelete(null)
      return
    }
    
    setDeletingEvent(true)
    try {
      setErr('')
      const { error } = await supabase
        .from('calendar_event')
        .delete()
        .eq('group_id', selected.id)
        .eq('location', eventToDelete)

      if (error) throw error
      load()
    } catch (err) {
      setErr(err.message || 'Failed to delete event. You might not have permission.')
    } finally {
      setDeletingEvent(false)
      setEventToDelete(null)
    }
  }

  return (
    <div className="page groups-page">
      <div className="groups-layout">
        <main className="groups-main">
          {err && (
            <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' }}>
              {err}
            </div>
          )}

          {!selected ? (
            <>
              <div className="groups-heading">
                <h1>Your Groups</h1>
                <p>{loading ? 'Loading your groups...' : 'Pick a group to enter the shared feed and collaboration space.'}</p>
              </div>
              <div className="groups-grid">
                {groups_list.map((g) => (
                  <button className="group-squircle" key={g.id} type="button" onClick={() => setSelectedId(g.id)}>
                    <strong>{g.name}</strong>
                    <span>{g.courseName}</span>
                    <em>{g.courseTag}</em>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="groups-heading groups-heading-detail" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <button className="groups-back" type="button" onClick={() => setSelectedId(null)}>
                      ← Back to groups
                    </button>
                    <h1>{selected.name}</h1>
                    <p>{selected.courseName} • Group feed</p>
                  </div>
                  {selected.creatorId !== user?.id && (
                    <button 
                      type="button" 
                      onClick={() => setGroupToLeave(selected.id)}
                      style={{ background: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s', marginTop: '8px' }}
                    >
                      Leave Group
                    </button>
                  )}
                </div>
              </div>

              <div className="groups-feed">
                {(posts_map[selected.id] || []).map((post) => {
                  let show_comments = open_comments[post.id]
                  return (
                    <article className="group-post-card" key={post.id}>
                      <div className="group-post-header">
                        <strong>{post.author}</strong>
                        <span>{post.createdAt}</span>
                      </div>
                      <p>{post.body}</p>
                      <div className="group-post-actions">
                        <button type="button" onClick={() => toggleComments(post.id)}>
                          {show_comments ? 'Hide comments' : 'Comments (' + post.comments.length + ')'}
                        </button>
                      </div>

                      {show_comments && (
                        <div className="group-comments">
                          {post.comments.length === 0 && (
                            <div className="group-comments-empty">No comments yet.</div>
                          )}
                          {post.comments.map((c, i) => (
                            <div className="group-comment" key={post.id + '-' + i}>
                              <strong>{typeof c === 'string' ? 'Member' : c.author}:</strong>{' '}
                              {typeof c === 'string' ? c : c.text}
                            </div>
                          ))}
                          <div className="group-comment-compose">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={comment_text[post.id] || ''}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            />
                            <button type="button" onClick={() => addComment(selected.id, post.id)}>Post</button>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </main>

        <GroupTools
          active_tool={active_tool}
          on_tool_change={setActiveTool}
          selected_group={selected}
          all_groups={groups_list}
          user_id={user?.id}
          on_approve={approveRequest}
          approving_id={approving_id}
          on_reject={rejectRequest}
          rejecting_id={rejecting_id}
          on_add_event={() => setIsAddEventOpen(true)}
          on_import_lrc={() => setIsImportOpen(true)}
          on_delete_event={setEventToDelete}
        />
      </div>
      
      {groupToLeave && (
        <div className="auth-prompt-backdrop" onClick={() => setGroupToLeave(null)}>
          <div className="auth-prompt-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="auth-prompt-close" onClick={() => setGroupToLeave(null)} aria-label="Close">
              ×
            </button>
            <div className="auth-prompt-badge">Leave Group</div>
            <h3 style={{ marginTop: '0.5rem' }}>Are you sure?</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>Are you sure you want to leave this group? You will lose access to its feed, notes, and calendar.</p>
            <div className="auth-prompt-actions">
              <button 
                type="button"
                className="auth-prompt-primary" 
                style={{ background: '#d32f2f', color: '#fff', border: 'none', cursor: 'pointer' }} 
                onClick={() => { leaveGroup(groupToLeave); setGroupToLeave(null); }}
              >
                Yes, leave group
              </button>
              <button 
                type="button"
                className="auth-prompt-secondary" 
                style={{ cursor: 'pointer', border: '1px solid var(--border)' }} 
                onClick={() => setGroupToLeave(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {eventToDelete && (
        <div className="auth-prompt-backdrop" onClick={() => !deletingEvent && setEventToDelete(null)}>
          <div className="auth-prompt-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="auth-prompt-close" onClick={() => !deletingEvent && setEventToDelete(null)} aria-label="Close">
              ×
            </button>
            <div className="auth-prompt-badge" style={{ background: '#ffebee', color: '#d32f2f' }}>Delete Event</div>
            <h3 style={{ marginTop: '0.5rem' }}>Are you sure?</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>
              Are you sure you want to delete all occurrences of <strong>"{eventToDelete}"</strong>? This action cannot be undone.
            </p>
            <div className="auth-prompt-actions">
              <button 
                type="button"
                className="auth-prompt-primary" 
                disabled={deletingEvent}
                style={{ background: '#d32f2f', color: '#fff', border: 'none', cursor: deletingEvent ? 'not-allowed' : 'pointer', opacity: deletingEvent ? 0.7 : 1 }} 
                onClick={confirmDeleteEvent}
              >
                {deletingEvent ? 'Deleting...' : 'Yes, delete meeting'}
              </button>
              <button 
                type="button"
                className="auth-prompt-secondary" 
                disabled={deletingEvent}
                style={{ cursor: deletingEvent ? 'not-allowed' : 'pointer', border: '1px solid var(--border)', opacity: deletingEvent ? 0.7 : 1 }} 
                onClick={() => setEventToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddEventOpen && selected && (
        <div className="auth-prompt-backdrop" onClick={() => !addingEvent && setIsAddEventOpen(false)}>
          <div className="auth-prompt-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button type="button" className="auth-prompt-close" onClick={() => !addingEvent && setIsAddEventOpen(false)} aria-label="Close">×</button>
            <h3 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Add Calendar Event</h3>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Title / Location</label>
                <input type="text" required value={eventLoc} onChange={e => setEventLoc(e.target.value)} placeholder="e.g. Library Room 2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Start Time</label>
                <input type="datetime-local" required value={eventStart} onChange={e => setEventStart(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>End Time</label>
                <input type="datetime-local" required value={eventEnd} onChange={e => setEventEnd(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" disabled={addingEvent} style={{ width: '100%', background: 'var(--accent)', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, marginTop: '8px', cursor: 'pointer' }}>
                {addingEvent ? 'Adding...' : 'Add Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isImportOpen && selected && (
        <div className="auth-prompt-backdrop" onClick={() => !importing && setIsImportOpen(false)}>
          <div className="auth-prompt-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button type="button" className="auth-prompt-close" onClick={() => !importing && setIsImportOpen(false)} aria-label="Close">×</button>
            <h3 style={{ marginTop: '0.5rem', marginBottom: '8px' }}>Import LRC Schedule</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>Automatically fetch and insert official UMass SI sessions for your course.</p>
            <form onSubmit={handleImportLrc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Course Code</label>
                <input type="text" required value={importCourse} onChange={e => setImportCourse(e.target.value)} placeholder="e.g. COMPSCI 121" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" disabled={importing} style={{ width: '100%', background: '#1976d2', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 600, marginTop: '8px', cursor: 'pointer' }}>
                {importing ? 'Importing...' : 'Fetch Sessions'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
