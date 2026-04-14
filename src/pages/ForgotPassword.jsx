import { useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../../Supabase_Config/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return

    setErrorMsg('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
              {errorMsg && (
                <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}

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
              <button type="submit" className="btn-post" disabled={loading}>
                {loading ? 'Sending...' : 'Next'}
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
