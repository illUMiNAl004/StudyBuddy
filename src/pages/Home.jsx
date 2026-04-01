import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import NewPostCard from '../components/NewPostCard'
import PostCard from '../components/PostCard'

const INITIAL_POSTS = [
  {
    id: 1,
    initial: 'S',
    name: 'Student Name',
    course: 'Course Name',
    time: 'a moment ago',
    avatarBg: '#e8f0eb',
    avatarColor: '#5a8a62',
    tagStyle: {},
    body: 'Post body goes here.',
    helpful: 0,
    comments: 0,
    actionLabel: 'Action →',
    actionStyle: 'join',
  } // this can be used to add more posts into here
]

export default function Home() {
  const [posts, setPosts] = useState(INITIAL_POSTS)

  function addPost(body, course = 'StudyBuddy') {
    if (!body || !body.trim()) return

    const nextPost = {
      id: Date.now(),
      initial: 'U',
      name: 'You',
      course: (course && course.trim()) || 'StudyBuddy',
      time: 'just now',
      avatarBg: '#d9eaff',
      avatarColor: '#1d4ed8',
      tagStyle: {},
      body: body.trim(),
      helpful: 0,
      comments: 0,
      actionLabel: 'Join →',
      actionStyle: 'join',
    }

    setPosts(prev => [nextPost, ...prev])
  }

  return (
    <div className="page">
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard onPost={addPost} />
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
  )
}
