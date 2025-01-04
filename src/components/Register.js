import React, { useState } from 'react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [churchName, setChurchName] = useState('');
  const [residence, setResidence] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [churchData, setChurchData] = useState({ name: '', address: '', phoneNumber: '', churchEmail: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
  
    // Construct the user data to send in the request
    const userData = {
      username,
      email,
      password,
      role,
      church: role === 'Church CEO' ? {
        name: churchData.name,  // Correctly sending church name
        address: churchData.address,  // Correctly sending church address
        phone_number: churchData.phoneNumber,  // Correctly sending phone number
        email: churchData.churchEmail  // Correctly sending church email
      } : undefined,
  
      // Send additional fields for the "Member" role
      ...(role === 'Member' && {
        residence,
        phone_number: phoneNumber,
        occupation,
        member_number: memberNumber,
        church_name: churchName,
      })
    };
  
    console.log('Sending user data:', userData);  // Log the data for debugging
  
    try {
      const response = await fetch('http://127.0.0.1:5000/register', {
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
        setChurchName('');
        setResidence('');
        setPhoneNumber('');
        setOccupation('');
        setMemberNumber('');
        setChurchData({ name: '', address: '', phoneNumber: '', churchEmail: '' });
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Registration failed');
        console.log('Sending user data:', userData);  // Log the user data before sending

      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error in registering');
    }
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
            <option value="Church CEO">Church Exucutive</option>
            <option value="Member">church Member</option>
          </select>
        </div>

        {role === 'Church CEO' && (
          <div>
            <h3>Church Information</h3>
            <div style={styles.formGroup}>
              <label>Church Name:</label>
              <input
                type="text"
                value={churchData.name}
                onChange={(e) => setChurchData({ ...churchData, name: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Church Address:</label>
              <input
                type="text"
                value={churchData.address}
                onChange={(e) => setChurchData({ ...churchData, address: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Church Phone Number:</label>
              <input
                type="text"
                value={churchData.phoneNumber}
                onChange={(e) => setChurchData({ ...churchData, phoneNumber: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Church Email:</label>
              <input
                type="email"
                value={churchData.churchEmail}
                onChange={(e) => setChurchData({ ...churchData, churchEmail: e.target.value })}
                required
                style={styles.input}
              />
            </div>
          </div>
        )}

{role === 'Member' && (
  <>
    <div style={styles.formGroup}>
      <label>Residence:</label>
      <input
        type="text"
        value={residence}
        onChange={(e) => setResidence(e.target.value)}
        required
        style={styles.input}
      />
    </div>
    <div style={styles.formGroup}>
      <label>Phone Number:</label>
      <input
        type="text"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
        style={styles.input}
      />
    </div>
    <div style={styles.formGroup}>
      <label>Occupation:</label>
      <input
        type="text"
        value={occupation}
        onChange={(e) => setOccupation(e.target.value)}
        required
        style={styles.input}
      />
    </div>
    <div style={styles.formGroup}>
      <label>Member Number:</label>
      <input
        type="text"
        value={memberNumber}
        onChange={(e) => setMemberNumber(e.target.value)}
        required
        style={styles.input}
      />
    </div>
    <div style={styles.formGroup}>
      <label>Church Name:</label>
      <input
        type="text"
        value={churchName}
        onChange={(e) => setChurchName(e.target.value)}
        required
        style={styles.input}
      />
    </div>
  </>
)}


        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        {successMessage && <p style={styles.success}>{successMessage}</p>}
        <button type="submit" style={styles.button}>Register</button>
      </form>
    </div>
  );
};

// Styles (unchanged)
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
};

export default Register;
