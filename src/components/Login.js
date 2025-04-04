import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Use named import

const Login = ({ setToken, setRole, setTransactions }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState(''); // For Forgot Password
  const [otp, setOtp] = useState(''); // For OTP verification
  const [newPassword, setNewPassword] = useState(''); // For resetting the password
  const [showForgotPassword, setShowForgotPassword] = useState(false); // To toggle the Forgot Password form
  const [showOtpVerification, setShowOtpVerification] = useState(false); // To toggle OTP verification
  const navigate = useNavigate(); // Use navigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const loginData = {
      username,
      password,
    };

    try {
      const response = await fetch('https://yoming.boogiecoin.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();

        // Decode the JWT token to get the username
        const decodedToken = jwtDecode(data.token); // Use jwtDecode
        const decodedUsername = decodedToken.username;

        console.log('Decoded username:', decodedUsername); // Check the decoded username

        setToken(data.token);  // Set the token in the parent component
        setRole(data.role);    // Set the role in the parent component
        localStorage.setItem('token', data.token);  // Save token to localStorage
        localStorage.setItem('userId', data.userId); // Save userId to localStorage
        localStorage.setItem('username', decodedUsername); // Save decoded username to localStorage

        navigate('/'); // Redirect to home page after successful login
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('An error occurred during login');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your email.');
      return;
    }

    try {
      const response = await fetch('https://yoming.boogiecoin.com/request_reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('OTP sent to your email. Please check your inbox.');
        setShowOtpVerification(true); // Show OTP form
        setShowForgotPassword(false); // Hide forgot password form
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('An error occurred during password reset request');
    }
  };

  const handleOtpVerificationSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otp || !email) {
      setErrorMessage('Please enter the OTP and email.');
      return;
    }

    try {
      const response = await fetch('https://yoming.boogiecoin.com/verify_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        alert('OTP verified successfully!');
        setShowOtpVerification(false);
        setShowForgotPassword(false);
        // Proceed to reset password form
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('An error occurred during OTP verification');
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || !email || !otp) {
      setErrorMessage('Please enter your new password, email, and OTP.');
      return;
    }

    try {
      const response = await fetch('https://yoming.boogiecoin.com/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      if (response.ok) {
        alert('Password reset successfully!');
        navigate('/'); // Redirect to login or home page
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('An error occurred during password reset');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        <button type="submit" style={styles.button}>Login</button>
      </form>

      {/* Forgot Password link */}
      <p style={styles.forgotPassword} onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>

      {/* Forgot Password form */}
      {showForgotPassword && (
        <div style={styles.forgotPasswordModal}>
          <h3>Forgot Password</h3>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleForgotPasswordSubmit} style={styles.button}>Send OTP</button>
          <p style={styles.cancel} onClick={() => setShowForgotPassword(false)}>Cancel</p>
        </div>
      )}

      {/* OTP Verification form */}
      {showOtpVerification && (
        <div style={styles.forgotPasswordModal}>
          <h3>Verify OTP</h3>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleOtpVerificationSubmit} style={styles.button}>Verify OTP</button>
        </div>
      )}

      {/* Reset Password form */}
      {showOtpVerification && (
        <div style={styles.forgotPasswordModal}>
          <h3>Reset Password</h3>
          <input
            type="password"
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
          />
          <button onClick={handlePasswordResetSubmit} style={styles.button}>Reset Password</button>
        </div>
      )}
    </div>
  );
};

// Styles (same as previous, with additions for Forgot Password)
const styles = {
  container: {
    maxWidth: '500px',
    margin: '100px auto',
    padding: '30px',
    backgroundColor: '#f7f9fc',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
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
    gap: '20px',
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
  },
  inputFocus: {
    borderColor: '#007bff',
  },
  button: {
    padding: '12px',
    fontSize: '1.1rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
    transform: 'scale(1.05)',
  },
  error: {
    color: '#e74c3c',
    fontSize: '1rem',
    marginTop: '10px',
  },
  forgotPassword: {
    color: '#007bff',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '15px',
  },
  forgotPasswordModal: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f7f9fc',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },
  cancel: {
    textAlign: 'center',
    color: '#007bff',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default Login;
