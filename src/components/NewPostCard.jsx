import { useState } from 'react'

export default function NewPostCard({ onPost }) {
 const [expanded, setExpanded] = useState(false)
 const [courseInput, setCourseInput] = useState('')
 const [postInput, setPostInput] = useState('')

 function reset() {
   setExpanded(false)
   setCourseInput('')
   setPostInput('')
 }

 function submit() {
   const course = courseInput.trim() || 'StudyBuddy'
   const body = postInput.trim()
   if (!body) return

   onPost?.(body, course)
   reset()
 }

 return (
   <>
     <div className="new-post-card">
       <div className="new-post-top" onClick={() => setExpanded(true)} style={{ cursor: 'text' }}>
         <div className="mini-avatar">?</div>
         <input
           className="post-input"
           type="text"
           placeholder="What do you want to talk about?"
           readOnly
         />
       </div>
     </div>

     {expanded && (
       <div className="new-post-modal" onClick={reset}>
         <div className="new-post-modal-card" onClick={e => e.stopPropagation()}>
           <div className="new-post-modal-header">
             <span>Create post</span>
             <button className="close-btn" onClick={reset}>&times;</button>
           </div>

           <div className="new-post-field">
             <label htmlFor="courseInput">Course (subject)</label>
             <input
               id="courseInput"
               type="text"
               value={courseInput}
               onChange={e => setCourseInput(e.target.value)}
               placeholder="Add course name..."
             />
           </div>

           <div className="new-post-field">
             <label htmlFor="postInput">Post content</label>
             <textarea
               id="postInput"
               value={postInput}
               onChange={e => setPostInput(e.target.value)}
               placeholder="What do you want to study?"
               rows={6}
             />
           </div>

           <div className="post-actions" style={{ marginTop: '0.75rem' }}>
             <button className="btn-post" type="button" onClick={submit}>
               Post
             </button>
             <button className="post-action-btn" type="button" onClick={reset}>
               Cancel
             </button>
           </div>
         </div>
       </div>
     )}
   </>
 )
}

