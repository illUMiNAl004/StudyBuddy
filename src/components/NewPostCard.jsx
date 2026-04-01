import { useState } from 'react'

export default function NewPostCard({ onPost }) {
  const [expanded, setExpanded] = useState(false)
  const [couseInput, setCourseInput] = useState('')
  const [postInput, setPostInput] = useState('')

  function reset() {
    setExpanded(false)
    setCourseInput('')
    setPostInput('')
  }

  function submit() {
    const course = couseInput.trim() || 'StudyBuddy'
    const body = postInput.trim()
    if (!body) return

    onPost?.(body, course)
    reset()
  }

  return (
    <div className="new-post-card">
      {!expanded ? (
        <div className="new-post-top" onClick={() => setExpanded(true)} style={{ cursor: 'text' }}>
          <div className="mini-avatar">?</div>
          <input
            className="post-input"
            type="text"
            placeholder="Looking to study? Start a post…"
            value={postInput}
            readOnly
          />
        </div>
      ) : (
        <div className="new-post-expanded">
          <div className="new-post-field">
            <label htmlFor="courseInput">Course</label>
            <input
              id="courseInput"
              type="text"
              value={couseInput}
              onChange={e => setCourseInput(e.target.value)}
              placeholder="Enter course name"
            />
          </div>
          <div className="new-post-field">
            <label htmlFor="postInput">Post</label>
            <textarea
              id="postInput"
              value={postInput}
              onChange={e => setPostInput(e.target.value)}
              placeholder="What do you want to study?"
              rows={4}
            />
          </div>
          <div className="post-actions" style={{ marginTop: '0.75rem' }}>
            <button className="btn-post" type="button" onClick={submit}>
              Post
            </button>
            <button
              className="post-action-btn"
              type="button"
              onClick={reset}
              style={{ marginLeft: '0.5rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
