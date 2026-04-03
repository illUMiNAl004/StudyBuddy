import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="subtitle">Join StudyBuddy and sync your studies</p>
          
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" required />
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="you@university.edu" required />
            </div>
            
            <div className="auth-field" style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Major</label>
                <input type="text" placeholder="Computer Science" required />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Class Year</label>
                <input type="text" placeholder="2027" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" required />
            </div>
            
            <button type="submit">Register</button>
          </form>
          
          <div className="auth-links">
            Already have an account? 
            <Link to="/login"><button>Log in</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
