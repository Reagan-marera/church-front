import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setToken, setRole, setTransactions }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate(); // Use navigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const loginData = {
      username,
      password,
    };

    try {
      const response = await fetch('https://finance.boogiecoin.com /login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);  // Set the token in the parent component
        setRole(data.role);    // Set the role in the parent component
        localStorage.setItem('token', data.token);  // Save token to localStorage

        // If the role is 'CEO', fetch all transactions
        if (data.role === 'CEO') {
          fetchTransactions(data.token);  // Fetch all transactions
        }

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

  // Fetch all transactions if the user is a CEO
  const fetchTransactions = async (token) => {
    try {
      const response = await fetch('https://finance.boogiecoin.com /transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);  // Set transactions in the parent component
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
    </div>
  );
};

// Styles
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
};

export default Login;
