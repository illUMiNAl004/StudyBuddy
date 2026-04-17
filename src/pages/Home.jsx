import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewPostCard from "../components/NewPostCard";
import PostCard from "../components/PostCard";
import AuthPromptModal from "../components/AuthPromptModal";
import supabase from "../../Supabase_Config/supabaseClient";
import { useAuth } from "../context/AuthContext";

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
    userId: row.user_id,
    initial: (row.course || row.title)?.[0]?.toUpperCase() || '?',
    name: row.profiles?.full_name || row.name || 'Student',
    course: row.course || row.title || 'General',
    time: timeAgo(row.created_at),
    avatarBg: '#e8f0eb',
    avatarColor: '#5a8a62',
    tagStyle: {},
    body: row.description,
    helpful: row.helpful ?? 0,
    actionLabel: 'Action →',
    actionStyle: 'join',
  };
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { user } = useAuth();

  function openAuthPrompt() {
    setAuthPromptOpen(true);
  }

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

      let likedPostIds = new Set();
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        if (likesData) {
          likedPostIds = new Set(likesData.map((l) => String(l.post_id)));
        }
      }

      setPosts(data.map((row) => ({ ...mapRow(row), likedByUser: likedPostIds.has(String(row.id)) })));
    }
    fetchPosts();
  }, [user]);

  async function handleDelete(postId) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }

  async function handleEdit(postId, updatedBody) {
    const { data, error } = await supabase
      .from('posts')
      .update({ description: updatedBody })
      .eq('id', postId)
      .select();

    if (error) {
      console.error('Error updating post:', error);
      return;
    }

    if (data && data.length > 0) {
      setPosts((prev) => prev.map((post) => post.id === postId ? mapRow(data[0]) : post));
    }
  }

  async function handleLike(postId, liked) {
    if (!user) return;

    const postIdStr = String(postId);

    if (liked) {
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({ user_id: user.id, post_id: postIdStr });
      if (likeError) {
        console.error('Error inserting like (did you run 03_post_likes_schema.sql?):', likeError);
        return;
      }
    } else {
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postIdStr);
      if (unlikeError) {
        console.error('Error deleting like:', unlikeError);
        return;
      }
    }

    const delta = liked ? 1 : -1;
    const currentPost = posts.find((p) => p.id === postId);
    const newCount = (currentPost?.helpful ?? 0) + delta;

    const { error } = await supabase
      .from('posts')
      .update({ helpful: newCount })
      .eq('id', postId);

    if (error) {
      console.error('Error updating helpful count:', error);
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, helpful: newCount, likedByUser: liked } : p
      )
    );
  }

  async function handlePost(body, course) {
    const GROUP_ID = '23fad67b-51f1-4d6b-b88a-8acce722e063';

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        user_id: user?.id || '452e8572-d91c-4303-9aac-45f545fbca3d',
        group_id: GROUP_ID,
        course: course,
        description: body,
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
      {!user && (
        <div className="auth-header" style={{ marginBottom: '24px', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
             <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)' }}>Welcome to StudyBuddy! Ready to sync your studies?</span>
             <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/login" className="btn-auth">Log In</Link>
                <Link to="/register" className="btn-auth primary">Register</Link>
             </div>
          </div>
        </div>
      )}
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard
            onPost={handlePost}
            isAuthenticated={Boolean(user)}
            onAuthRequired={openAuthPrompt}
          />
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              initialLiked={post.likedByUser ?? false}
              isAuthenticated={Boolean(user)}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onLike={handleLike}
              onAuthRequired={openAuthPrompt}
              animationDelay={`${(i + 1) * 0.05}s`}
            />
          ))}
        </main>
      </div>
      <AuthPromptModal open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </div>
  );
}
