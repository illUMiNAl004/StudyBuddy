import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import NewPostCard from '../components/NewPostCard'
import PostCard from '../components/PostCard'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setPosts([])
      } else {
        setError(null)
        setPosts(data || [])
      }
      setLoading(false)
    }

    loadPosts()
  }, [])

  const handleCreatePost = async (payload) => {
    const user = supabase.auth.user()
    if (!user) {
      throw new Error('User must be authenticated to create posts')
    }

    const insertPayload = {
      user_id: user.id,
      title: payload.title,
      description: payload.description,
      group_name: payload.group_name,
      is_private: payload.is_private,
    }

    const { data, error } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      throw error
    }

    setPosts((old) => [data, ...old])
  }

  const mapPost = (post) => ({
    id: post.id,
    initial: post.title?.charAt(0).toUpperCase() || '?',
    name: post.title || 'Untitled',
    course: post.group_name || 'General',
    time: new Date(post.created_at).toLocaleString(),
    avatarBg: '#e8f0eb',
    avatarColor: '#5a8a62',
    tagStyle: {},
    body: post.description || '',
    helpfulText: `Helpful · ${post.helpful_count ?? 0}`,
    commentText: `Comment · ${post.comment_count ?? 0}`,
    actionLabel: post.is_private ? 'Private' : 'Public',
    actionStyle: post.is_private ? 'private' : 'join',
  })

  return (
    <div className="page">
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard onCreatePost={handleCreatePost} />
          {loading && <div>Loading posts…</div>}
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={mapPost(post)}
              animationDelay={`${(i + 1) * 0.05}s`}
            />
          ))}
        </main>
      </div>
    </div>
  )
}
