import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../../Supabase_Config/supabaseClient'
import PasswordStrengthComponent from '../components/PasswordStrengthComponent'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, isValid: false })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase automatically parses the #access_token fragment from the URL
    // and fires PASSWORD_RECOVERY when it detects a recovery link was clicked.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is now active — user can safely call updateUser()
        setSessionReady(true)
      } else if (event === 'SIGNED_IN' && session) {
        // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
        setSessionReady(true)
      }
    })

    // Fallback: if the session is already set (e.g. page was refreshed),
    // check for it directly
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
      } else {
        // Give the onAuthStateChange listener 2 seconds to fire before
        // showing the invalid-link error
        const timer = setTimeout(() => {
          setSessionReady((prev) => {
            if (!prev) {
              setErrorMsg('This password reset link is invalid or expired. Please request a new one.')
            }
            return prev
          })
        }, 2000)
        return () => clearTimeout(timer)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleResetPassword(event) {
    event.preventDefault()
    setErrorMsg('')

    if (!passwordStrength.isValid) {
      setErrorMsg('Password does not meet all required criteria.')
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
          ) : !sessionReady && !errorMsg ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)' }}>
              Verifying reset link...
            </div>
          ) : sessionReady && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <PasswordStrengthComponent 
                  password={password} 
                  onStrengthChange={setPasswordStrength}
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

              <button type="submit" className="btn-post" disabled={loading || !passwordStrength.isValid}>
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


