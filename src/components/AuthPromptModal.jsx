import { Link } from 'react-router-dom'

export default function AuthPromptModal({ open, onClose, title = 'Want to join the conversation?', message = 'Sign in to like and create posts, join study groups and much more!' }) {
  if (!open) return null

  return (
    <div className="auth-prompt-backdrop" onClick={onClose}>
      <div className="auth-prompt-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="auth-prompt-close" onClick={onClose} aria-label="Close sign in prompt">
          ×
        </button>
        <div className="auth-prompt-badge">StudyBuddy</div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="auth-prompt-actions">
          <Link to="/login" className="auth-prompt-primary" onClick={onClose}>
            Sign in
          </Link>
          <Link to="/register" className="auth-prompt-secondary" onClick={onClose}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
