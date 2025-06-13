import React, { useState } from 'react';

const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!amount || !phone) {
      setMessage('Please fill in both fields.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('https://backend.youmingtechnologies.co.ke/sendstk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          phone
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Payment request sent successfully.');
      } else {
        setMessage(data.error || 'Payment failed.');
      }
    } catch (error) {
      setMessage('An error occurred while sending payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Make a Payment</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? 'Processing...' : 'Send Payment'}
        </button>
      </form>

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  input: {
    padding: '10px',
    marginTop: '5px',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  message: {
    marginTop: '20px',
    fontSize: '1.2rem',
    color: '#007bff',
  },
};

export default PaymentForm;
