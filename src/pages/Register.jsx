import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="page auth-container">
      <div className="auth-card">
        <h2>Create an account</h2>
        <p className="subtitle">Join StudyBuddy today</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="auth-field">
            <label>Full Name</label>
            <input type="text" placeholder="Jane Doe" />
          </div>
          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button type="submit">Register</button>
        </form>
        <div className="auth-links">
          Already have an account? <Link to="/login"><button>Sign in</button></Link>
        </div>
      </div>
    </div>
  );
}
