import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Login = ({ setToken, setRole, setTransactions }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();
  const Api = 'https://backend.youmingtechnologies.co.ke';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const loginData = {
      username,
      password,
    };

    try {
      const response = await fetch(`${Api}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        const decodedToken = jwtDecode(data.token);
        const decodedUsername = decodedToken.username;

        console.log('Decoded username:', decodedUsername);

        setToken(data.token);
        setRole(data.role);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', decodedUsername);

        navigate('/');
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
      const response = await fetch(`${Api}/request_reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('OTP sent to your email. Please check your inbox.');
        setShowOtpVerification(true);
        setShowForgotPassword(false);
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
      const response = await fetch(`${Api}/verify_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        alert('OTP verified successfully!');
        setShowOtpVerification(false);
        setShowResetPassword(true);
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
      const response = await fetch(`${Api}/reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      if (response.ok) {
        alert('Password reset successfully!');
        navigate('/');
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

      <p style={styles.forgotPassword} onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>

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

      {showResetPassword && (
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
