import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Log In</h2>
          <p className="subtitle">Welcome back to StudyBuddy</p>
          
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@university.edu" required />
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" required />
            </div>
            
            <button type="submit">Sign In</button>
          </form>
          
          <div className="auth-links">
            Don't have an account? 
            <Link to="/register"><button>Register here</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
