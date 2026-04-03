import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="page auth-container">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to StudyBuddy to continue</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button type="submit">Sign In</button>
        </form>
        <div className="auth-links">
          Don't have an account? <Link to="/register"><button>Sign up</button></Link>
        </div>
      </div>
    </div>
  );
}
