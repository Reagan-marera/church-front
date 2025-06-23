import React, { useState } from 'react';

const USER_SECRET_PASSWORD = '@youming1234#,'; // Hardcoded secret password for users

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [secretCode, setSecretCode] = useState('');
  const [userSecretPassword, setUserSecretPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (role === 'User' && userSecretPassword !== USER_SECRET_PASSWORD) {
      setErrorMessage('Invalid user secret password');
      return;
    }

    const userData = {
      username,
      email,
      password,
      role,
      ...(role === 'CEO' && { secret_code: secretCode }),
    };

    console.log('Sending user data:', userData);  // Log the data for debugging

    try {
      const response = await fetch('https://backend.youmingtechnologies.co.ke/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setSuccessMessage('User registered successfully');
        // Reset the form fields after successful registration
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('User');
        setSecretCode('');
        setUserSecretPassword('');
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error in registering');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Register</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Password:</label>
          <div style={styles.passwordInputContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <button type="button" onClick={togglePasswordVisibility} style={styles.toggleButton}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div style={styles.formGroup}>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
            <option value="User">User</option>
            <option value="CEO">CEO</option>
          </select>
        </div>

        {role === 'CEO' && (
          <div style={styles.formGroup}>
            <label>Secret Code:</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                style={styles.input}
              />
              <button type="button" onClick={togglePasswordVisibility} style={styles.toggleButton}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        )}

        {role === 'User' && (
          <div style={styles.formGroup}>
            <label>Secret Password:</label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={userSecretPassword}
                onChange={(e) => setUserSecretPassword(e.target.value)}
                required
                style={styles.input}
              />
              <button type="button" onClick={togglePasswordVisibility} style={styles.toggleButton}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        )}

        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        {successMessage && <p style={styles.success}>{successMessage}</p>}
        <button type="submit" style={styles.button}>Register</button>
      </form>
    </div>
  );
};

// Styles (updated)
const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    color: '#343a40',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '1rem',
    marginBottom: '5px',
    color: '#495057',
  },
  input: {
    padding: '12px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ced4da',
    outline: 'none',
    transition: 'border-color 0.3s',
    flex: 1,
  },
  select: {
    padding: '12px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ced4da',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '12px',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  error: {
    color: '#e74c3c',
    fontSize: '1rem',
    marginTop: '10px',
  },
  success: {
    color: '#2ecc71',
    fontSize: '1rem',
    marginTop: '10px',
  },
  passwordInputContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  toggleButton: {
    marginLeft: '10px',
    padding: '8px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default Register;
