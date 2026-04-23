import { useEffect, useMemo } from 'react';

export default function PasswordStrengthComponent({ password, onStrengthChange }) {
  const requirements = [
    { id: 'length', label: 'At least 8 characters', regex: /.{8,}/ },
    { id: 'uppercase', label: 'At least one uppercase letter', regex: /[A-Z]/ },
    { id: 'lowercase', label: 'At least one lowercase letter', regex: /[a-z]/ },
    { id: 'number', label: 'At least one number', regex: /[0-9]/ },
    { id: 'special', label: 'At least one special character (!@#$%^&*)', regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/ },
  ];

  // Calculate which requirements are met
  const metRequirements = useMemo(() => {
    return requirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
  }, [password]);

  // Calculate strength level
  const metCount = metRequirements.filter(r => r.met).length;
  const strengthLevels = {
    0: { label: 'No password', percentage: 0, color: '#e0e0e0' },
    1: { label: 'Very Weak', percentage: 20, color: '#f44336' },
    2: { label: 'Weak', percentage: 40, color: '#ff9800' },
    3: { label: 'Fair', percentage: 60, color: '#ffc107' },
    4: { label: 'Good', percentage: 80, color: '#2196f3' },
    5: { label: 'Strong', percentage: 100, color: '#4caf50' }
  };

  const strength = strengthLevels[metCount];

  // Notify parent component of strength changes
  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange({
        level: metCount,
        isValid: metCount === 5,
        percentage: strength.percentage
      });
    }
  }, [metCount, strength.percentage, onStrengthChange]);

  return (
    <div className="password-strength-container">
      {/* Progress Bar */}
      <div className="password-strength-bar-wrapper">
        <div 
          className="password-strength-bar"
          style={{
            width: `${strength.percentage}%`,
            backgroundColor: strength.color,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </div>

      {/* Strength Label */}
      <div className="password-strength-label">
        <span className="strength-text">{strength.label}</span>
        <span className="strength-percentage">{strength.percentage}%</span>
      </div>

      {/* Requirements List */}
      <div className="password-requirements">
        <h4 className="requirements-title">Password Requirements</h4>
        <ul className="requirements-list">
          {metRequirements.map(req => (
            <li key={req.id} className={`requirement-item ${req.met ? 'met' : ''}`}>
              <span className="requirement-icon">
                {req.met ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
              </span>
              <span className="requirement-text">{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
