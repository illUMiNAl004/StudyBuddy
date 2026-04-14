import { useEffect, useRef, useState } from 'react'

const ThumbIcon = () => (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
   <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
   <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
 </svg>
)

const MoreIcon = () => (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
   <circle cx="12" cy="5" r="1.5" />
   <circle cx="12" cy="12" r="1.5" />
   <circle cx="12" cy="19" r="1.5" />
 </svg>
)

export default function PostCard({ post, animationDelay = '0s', currentUserId, initialLiked = false, onEdit, onDelete, onLike, isAuthenticated, onAuthRequired, onAction }) {
 const [helpful, setHelpful] = useState(post.helpful ?? 0)
 const [liked, setLiked] = useState(initialLiked)
 const [menuOpen, setMenuOpen] = useState(false)
 const [isEditing, setIsEditing] = useState(false)
 const [draftBody, setDraftBody] = useState(post.body)
 const menuRef = useRef(null)
 const isOwner = post.userId && currentUserId && post.userId === currentUserId

 useEffect(() => {
   function handleClickOutside(event) {
     if (menuRef.current && !menuRef.current.contains(event.target)) {
       setMenuOpen(false)
     }
   }
   document.addEventListener('mousedown', handleClickOutside)
   return () => document.removeEventListener('mousedown', handleClickOutside)
 }, [])

 useEffect(() => {
   setLiked(initialLiked)
 }, [initialLiked])

 useEffect(() => {
   setHelpful(post.helpful ?? 0)
 }, [post.helpful])

 function toggleLike() {
   if (!isAuthenticated) {
     onAuthRequired?.()
     return
   }

   const newLiked = !liked
   setLiked(newLiked)
   setHelpful(prev => (newLiked ? prev + 1 : prev - 1))
   onLike?.(post.id, newLiked)
 }

 function handleActionClick() {
   if (!isAuthenticated) {
     onAuthRequired?.()
     return
   }

   onAction?.(post.id)
 }

 function startEdit() {
   setMenuOpen(false)
   setIsEditing(true)
 }

 function cancelEdit() {
   setIsEditing(false)
   setDraftBody(post.body)
 }

 function saveEdit() {
   if (!draftBody.trim()) return
   onEdit?.(post.id, draftBody.trim())
   setIsEditing(false)
 }

 function deletePost() {
   setMenuOpen(false)
   onDelete?.(post.id)
 }

 return (
   <div className="post-card" style={{ animationDelay }}>
     <div className="post-header" ref={menuRef}>
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
       {isOwner && (
         <div className="post-options">
           <button type="button" className="post-options-trigger" onClick={() => setMenuOpen((prev) => !prev)}>
             <MoreIcon />
           </button>
           {menuOpen && (
             <div className="post-options-menu">
               <button type="button" onClick={startEdit}>Edit post</button>
               <button type="button" onClick={deletePost}>Delete post</button>
             </div>
           )}
         </div>
       )}
     </div>

     {isEditing ? (
       <div className="post-edit-section">
         <textarea
           className="post-edit-textarea"
           value={draftBody}
           onChange={(e) => setDraftBody(e.target.value)}
           rows={5}
         />
         <div className="post-edit-actions">
           <button type="button" className="react-btn" onClick={cancelEdit}>Cancel</button>
           <button type="button" className="react-btn join" onClick={saveEdit}>Save</button>
         </div>
       </div>
     ) : (
       <p className="post-body">{post.body}</p>
     )}

     <div className="post-footer">
       <button className={`react-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} type="button">
         <ThumbIcon />
         {helpful} Helpful
       </button>
       <button
         className={`react-btn ${post.actionStyle || ''}`}
         style={post.actionBtnStyle || {}}
         type="button"
        onClick={handleActionClick}
       >
         {post.actionLabel}
       </button>
     </div>
   </div>
 )
}

