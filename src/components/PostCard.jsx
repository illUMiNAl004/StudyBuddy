import { useState } from 'react'

const ThumbIcon = () => (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
   <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
   <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
 </svg>
)

const CommentIcon = () => (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
 </svg>
)

export default function PostCard({ post, animationDelay = '0s' }) {
 const [helpful, setHelpful] = useState(post.helpful ?? 0)
 const [liked, setLiked] = useState(false)

 function toggleLike() {
   setLiked(prev => !prev)
   setHelpful(prev => (liked ? prev - 1 : prev + 1))
 }

 return (
   <div className="post-card" style={{ animationDelay }}>
     <div className="post-header">
       <div
         className="mini-avatar"
         style={{ background: post.avatarBg, color: post.avatarColor }}
       >
         {post.initial}
       </div>
       <div className="post-meta">
         <strong>{post.name}</strong>
         <span>{post.course} · {post.time}</span>
       </div>
       <span
         className="post-tag"
         style={post.tagStyle || {}}
       >
         {post.course}
       </span>
     </div>
     <p className="post-body">{post.body}</p>
     <div className="post-footer">
       <button className={`react-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} type="button">
         <ThumbIcon />
         {helpful} Helpful
       </button>
       <button
         className={`react-btn ${post.actionStyle || ''}`}
         style={post.actionBtnStyle || {}}
         type="button"
       >
         {post.actionLabel}
       </button>
     </div>
   </div>
 )
}

