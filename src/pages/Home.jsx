import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewPostCard from "../components/NewPostCard";
import PostCard from "../components/PostCard";
import supabase from "../../Supabase_Config/supabaseClient";

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mapRow(row) {
  return {
    id: row.id,
    initial: row.course?.[0]?.toUpperCase() || '?',
    name: 'Student',
    course: row.course,
    time: timeAgo(row.created_at),
    avatarBg: '#e8f0eb',
    avatarColor: '#5a8a62',
    tagStyle: {},
    body: row.description,
    helpful: 0,
    actionLabel: 'Action →',
    actionStyle: 'join',
  };
}

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }
      setPosts(data.map(mapRow));
    }
    fetchPosts();
  }, []);

  async function handlePost(body, course) {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        user_id: '452e8572-d91c-4303-9aac-45f545fbca3d',
        course: course,
        description: body,
        group_name: '',
        is_private: false,
      }])
      .select();

    if (error) {
      console.error('Error creating post:', error);
      return;
    }

    if (data && data.length > 0) {
      setPosts(prev => [mapRow(data[0]), ...prev]);
    }
  }

  return (
    <div className="page">
      <div className="auth-header" style={{ marginBottom: '24px', justifyContent: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
           <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)' }}>Welcome to StudyBuddy! Ready to sync your studies?</span>
           <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn-auth">Log In</Link>
              <Link to="/register" className="btn-auth primary">Register</Link>
           </div>
        </div>
      </div>
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard onPost={handlePost} />
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              animationDelay={`${(i + 1) * 0.05}s`}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
