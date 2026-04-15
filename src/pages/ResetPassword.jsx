import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../../Supabase_Config/supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function checkRecoverySession() {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        setErrorMsg('This password reset link is invalid or expired. Please request a new one.')
      }
    }

    checkRecoverySession()
  }, [])

  async function handleResetPassword(event) {
    event.preventDefault()
    setErrorMsg('')

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setSuccessMsg('Your password has been reset successfully. You can now sign in.')
    setLoading(false)

    setTimeout(() => {
      navigate('/login')
    }, 1200)
  }

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '420px' }}>
          <h2>Reset password</h2>
          <p className="subtitle">Enter your new password below.</p>

          {errorMsg && (
            <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '10px' }}>
              {errorMsg}
            </div>
          )}

          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--text)', marginBottom: '12px' }}>{successMsg}</p>
              <Link to="/login" className="forgot-password-link">Go to sign in</Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <button type="submit" className="btn-post" disabled={loading}>
                {loading ? 'Updating...' : 'Update password'}
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
