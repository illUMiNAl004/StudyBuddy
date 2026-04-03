import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return
    setSent(true)
  }

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '420px' }}>
          <h2>Forgot password</h2>
          <p className="subtitle">
            Enter your email and we’ll send a verification code if it matches an existing account.
          </p>
          

          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ marginBottom: '16px', color: 'var(--text)' }}>
                Check your inbox for instructions to reset your password.
              </p>
              <Link to="/login">
                <button type="button" className="btn-post" style={{ width: '100%' }}>
                  Back to sign in
                </button>
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@umass.edu"
                  required
                />
              </div>
              <button type="submit" className="btn-post">
                Next
              </button>
              <Link to="/login" className="forgot-password-link">
                Back
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
