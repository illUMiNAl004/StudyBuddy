export default function NewPostCard() {
  return (
    <div className="new-post-card">
      <div className="new-post-top">
        <div className="mini-avatar">?</div>
        <input className="post-input" type="text" placeholder="Looking to study? Start a post…" />
      </div>
      <div className="post-actions">
        <button className="post-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Set time
        </button>
        <button className="post-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Add course
        </button>
        <button className="btn-post">Post</button>
      </div>
    </div>
  )
}
