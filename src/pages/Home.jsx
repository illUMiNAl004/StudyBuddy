import Sidebar from '../components/Sidebar'
import NewPostCard from '../components/NewPostCard'
import PostCard from '../components/PostCard'
import supabase from '../../Supabase_Config/supabaseClient'

const POSTS = [
  {
    id: 1,
    initial: '?',
    name: 'Student Name',
    course: 'Course Name',
    time: 'Time ago',
    avatarBg: '#e8f0eb',
    avatarColor: '#5a8a62',
    tagStyle: {},
    body: 'Post body goes here.',
    helpfulText: 'Helpful · 0',
    commentText: 'Comment · 0',
    actionLabel: 'Action →',
    actionStyle: 'join',
  } //this can be used to add mroe posts into here
]

export default function Home() {
  return (
    <div className="page">
      <div className="layout">
        <Sidebar />
        <main className="feed">
          <NewPostCard />
          {POSTS.map((post, i) => (
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
