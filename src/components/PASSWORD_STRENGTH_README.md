# Password Strength Component

## Overview
A reusable, real-time password strength validator component for React that provides visual feedback on password quality through a dynamic progress bar and requirement checklist.

## Features
✅ Real-time password strength calculation  
✅ Dynamic color-coded progress bar (Red → Orange → Yellow → Blue → Green)  
✅ Live requirement validation with visual icons  
✅ Fully responsive design  
✅ Reusable across multiple pages  
✅ Accessibility-friendly with clear labels  

## Password Strength Criteria

The component evaluates passwords against 5 requirements:

1. **Length** - At least 8 characters
2. **Uppercase** - At least one uppercase letter (A-Z)
3. **Lowercase** - At least one lowercase letter (a-z)
4. **Number** - At least one number (0-9)
5. **Special Character** - At least one special character (!@#$%^&*)

### Strength Levels

| Met Requirements | Level | Bar Width | Color |
|------------------|-------|-----------|-------|
| 0 | No password | 0% | Gray |
| 1 | Very Weak | 20% | Red (#f44336) |
| 2 | Weak | 40% | Orange (#ff9800) |
| 3 | Fair | 60% | Yellow (#ffc107) |
| 4 | Good | 80% | Blue (#2196f3) |
| 5 | Strong | 100% | Green (#4caf50) |

**Password is valid only when all 5 requirements are met (Strong level)**

## Usage

### Basic Implementation

```jsx
import PasswordStrengthComponent from '../components/PasswordStrengthComponent';
import { useState } from 'react';

export default function MyForm() {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState({ level: 0, isValid: false });

  return (
    <div>
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
      
      <PasswordStrengthComponent 
        password={password}
        onStrengthChange={setStrength}
      />
      
      <button disabled={!strength.isValid}>
        Submit
      </button>
    </div>
  );
}
```

## Props

### `password` (string) - **Required**
The current password value to evaluate.

```jsx
<PasswordStrengthComponent password={password} />
```

### `onStrengthChange` (function) - **Optional**
Callback function that receives strength updates whenever password changes.

```jsx
const handleStrengthChange = (strengthData) => {
  console.log(strengthData);
  // strengthData = {
  //   level: 0-5,        // Number of requirements met
  //   isValid: boolean,  // True only when all 5 requirements met
  //   percentage: 0-100  // Visual bar percentage
  // }
}

<PasswordStrengthComponent 
  password={password}
  onStrengthChange={handleStrengthChange}
/>
```

## Visual States

### Empty State
- Gray progress bar at 0%
- All requirements shown in gray with X icons
- Displays "No password"

### Building Strength
As user types and meets requirements:
- Progress bar fills and changes color
- Requirements turn green with checkmarks
- Strength label updates dynamically

### Valid State (All Requirements Met)
- Progress bar fills completely to 100% in green
- All 5 requirements show green checkmarks
- Displays "Strong"
- Ready for form submission

## CSS Classes

The component uses the following CSS classes (defined in `index.css`):

- `.password-strength-container` - Main wrapper
- `.password-strength-bar-wrapper` - Progress bar container
- `.password-strength-bar` - Animated progress bar
- `.password-strength-label` - Strength text and percentage
- `.password-requirements` - Requirements list wrapper
- `.requirements-title` - "Password Requirements" heading
- `.requirements-list` - List of requirements
- `.requirement-item` - Individual requirement
- `.requirement-item.met` - Requirement when condition is met
- `.requirement-icon` - Icon container (checkmark or X)
- `.requirement-text` - Requirement description text

## Integration Examples

### Sign Up Page
```jsx
// src/pages/Register.jsx
import PasswordStrengthComponent from '../components/PasswordStrengthComponent';

export default function Register() {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState({ isValid: false });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!strength.isValid) {
      setErrorMsg('Password does not meet requirements');
      return;
    }
    
    // Proceed with registration
  };

  return (
    <form onSubmit={handleRegister}>
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordStrengthComponent 
        password={password}
        onStrengthChange={setStrength}
      />
      <button disabled={!strength.isValid}>Register</button>
    </form>
  );
}
```

### Reset Password Page
```jsx
// src/pages/ResetPassword.jsx
import PasswordStrengthComponent from '../components/PasswordStrengthComponent';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState({ isValid: false });

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (!strength.isValid) {
      setErrorMsg('Password does not meet requirements');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    // Proceed with reset
  };

  return (
    <form onSubmit={handleReset}>
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordStrengthComponent 
        password={password}
        onStrengthChange={setStrength}
      />
      
      <input 
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
      />
      
      <button disabled={!strength.isValid || password !== confirmPassword}>
        Reset Password
      </button>
    </form>
  );
}
```

## Responsive Behavior

The component is fully responsive:
- **Desktop**: Full-size progress bar and requirement list
- **Mobile**: Proportionally smaller elements with proper padding
- Progress bar height adjusts from 8px (desktop) to 6px (mobile)
- Font sizes scale appropriately for smaller screens

## Styling Customization

To customize colors, modify the CSS in `index.css`:

```css
.password-strength-bar {
  background: #e0e0e0;
  /* Change the progress bar color by modifying the inline 
     backgroundColor in the component */
}

.requirement-item.met {
  color: #4caf50; /* Green for met requirements */
}
```

To customize via CSS variables in your theme, update:

```css
:root {
  --strength-weak: #f44336;
  --strength-fair: #ff9800;
  --strength-good: #ffc107;
  --strength-better: #2196f3;
  --strength-strong: #4caf50;
}
```

## Performance Notes

- Uses `useMemo` to optimize requirement calculations
- Only re-evaluates when password changes
- Minimal re-renders through React hooks optimization
- Smooth CSS transitions for visual feedback

## Accessibility

- Clear requirement labels for screen readers
- SVG icons with proper stroke styling
- High contrast colors for visibility
- Keyboard navigable (works within form inputs)

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Android Chrome)
