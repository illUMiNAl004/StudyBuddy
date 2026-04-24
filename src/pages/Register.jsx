import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../Supabase_Config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthComponent from '../components/PasswordStrengthComponent';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [classYear, setClassYear] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, isValid: false });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Use a ref so validatePassword always reads the latest strength
  // without needing passwordStrength in every useCallback dependency array
  const passwordStrengthRef = useRef(passwordStrength);
  useEffect(() => { passwordStrengthRef.current = passwordStrength; }, [passwordStrength]);

  const [fieldErrors, setFieldErrors] = useState({
    fullName: '', email: '', major: '', classYear: '', password: ''
  });

  const [touchedFields, setTouchedFields] = useState({
    fullName: false, email: false, major: false, classYear: false, password: false
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // --- Pure validators (take the value directly, no closure over state) ---

  const validateEmail = (val) => {
    if (!val) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
    if (!val.endsWith('@umass.edu')) return 'Registration is restricted to @umass.edu emails.';
    return '';
  };

  const validateFullName = (val) => {
    if (!val || !val.trim()) return 'Full Name is required.';
    return '';
  };

  const validateMajor = (val) => (!val ? 'Major is required.' : '');

  const validateClassYear = (val) => {
    if (!val) return 'Class Year is required.';
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 2020 || n > 2030) return 'Please enter a valid graduation year (2020–2030).';
    return '';
  };

  // Reads from ref so it's always fresh, even inside handleRegister
  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (!passwordStrengthRef.current.isValid) return 'Password must meet all security criteria.';
    return '';
  };

  // --- Validate a single field given its current value ---

  const getErrorForField = useCallback((fieldName, value) => {
    switch (fieldName) {
      case 'fullName':  return validateFullName(value);
      case 'email':     return validateEmail(value);
      case 'major':     return validateMajor(value);
      case 'classYear': return validateClassYear(value);
      case 'password':  return validatePassword(value);
      default:          return '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- onChange: clear error as soon as the user fixes the field ---

  const handleChange = (fieldName, value) => {
    // Update the appropriate state value
    const setters = {
      fullName: setFullName,
      email: setEmail,
      major: setMajor,
      classYear: setClassYear,
      password: setPassword,
    };
    setters[fieldName](value);

    // Only re-validate if the field has been touched (don't show errors on first keystroke)
    if (touchedFields[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: getErrorForField(fieldName, value),
      }));
    }
  };

  // --- onBlur: mark touched and validate immediately ---

  const handleBlur = (fieldName, value) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: getErrorForField(fieldName, value),
    }));
  };

  // --- Submit ---

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Read current values directly to avoid any stale closure issues
    const currentValues = { fullName, email, major, classYear, password };

    // Touch all fields
    setTouchedFields({ fullName: true, email: true, major: true, classYear: true, password: true });

    // Validate all fields synchronously
    const errors = {
      fullName:  validateFullName(currentValues.fullName),
      email:     validateEmail(currentValues.email),
      major:     validateMajor(currentValues.major),
      classYear: validateClassYear(currentValues.classYear),
      password:  validatePassword(currentValues.password),
    };
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setErrorMsg('Please fix the errors above before registering.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, major, class_year: classYear } },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.user) {
      if (data.session) {
        navigate('/');
      } else {
        setErrorMsg('Success! Check your email to confirm your account.');
        setLoading(false);
      }
    }
  };

  // --- Shared input style helper ---
  const inputStyle = (field) => ({
    borderColor: touchedFields[field] && fieldErrors[field] ? 'var(--color-border-danger)' : undefined,
    borderWidth: touchedFields[field] && fieldErrors[field] ? '2px' : '1px',
  });

  const FieldError = ({ field }) =>
    touchedFields[field] && fieldErrors[field]
      ? <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: 4 }}>{fieldErrors[field]}</div>
      : null;

  return (
    <div className="page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="subtitle">Join StudyBuddy and sync your studies</p>

          <form className="auth-form" onSubmit={handleRegister}>
            {errorMsg && (
              <div style={{ color: 'var(--color-text-danger)', background: 'var(--color-background-danger)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text" placeholder="John Doe" required
                value={fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={(e)  => handleBlur('fullName',  e.target.value)}
                style={inputStyle('fullName')}
              />
              <FieldError field="fullName" />
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input
                type="email" placeholder="you@umass.edu" required
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={(e)  => handleBlur('email',  e.target.value)}
                style={inputStyle('email')}
              />
              <FieldError field="email" />
            </div>

            <div className="auth-field" style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label>Major</label>
                <select
                  required value={major}
                  onChange={(e) => handleChange('major', e.target.value)}
                  onBlur={(e)  => handleBlur('major',  e.target.value)}
                  style={inputStyle('major')}
                >
                  <option value="" disabled>Select a major...</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Business">Business</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                </select>
                <FieldError field="major" />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label>Class Year</label>
                <input
                  type="text" placeholder="2027" required
                  value={classYear}
                  onChange={(e) => handleChange('classYear', e.target.value)}
                  onBlur={(e)  => handleBlur('classYear',  e.target.value)}
                  style={inputStyle('classYear')}
                />
                <FieldError field="classYear" />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password" placeholder="Enter password" required
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={(e)  => handleBlur('password',  e.target.value)}
                style={inputStyle('password')}
              />
              <FieldError field="password" />
              <PasswordStrengthComponent
                password={password}
                onStrengthChange={(s) => {
                  setPasswordStrength(s);
                  passwordStrengthRef.current = s; // keep ref in sync immediately
                  if (touchedFields.password) {
                    setFieldErrors(prev => ({
                      ...prev,
                      password: !s.isValid && password ? 'Password must meet all security criteria.' : '',
                    }));
                  }
                }}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
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
