import React, { useState } from 'react';

const CashbookReconciliationForm = () => {
  const [formData, setFormData] = useState({
    date: '',
    transaction_type: '',
    bank_account: '',
    amount: '',
    details: '',
    transaction_details: '',
    manual_number: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const response = await fetch('http://localhost:5000/api/cashbook-reconciliations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Expected JSON, got: ${contentType}. Response: ${errorText}`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }

      setSuccessMessage('Reconciliation added successfully!');
      setFormData({
        date: '',
        transaction_type: '',
        bank_account: '',
        amount: '',
        details: '',
        transaction_details: '',
        manual_number: ''
      });

    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Add Reconciliation</h2>
      {successMessage && <div style={styles.success}>{successMessage}</div>}
      {errorMessage && <div style={styles.error}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Date:
          <input type="date" name="date" value={formData.date} onChange={handleChange} style={styles.input} required />
        </label>

        <label style={styles.label}>
  Transaction Type:
  <select
    name="transaction_type"
    value={formData.transaction_type}
    onChange={handleChange}
    style={styles.input}
    required
  >
    <option value="">-- Select --</option>
    <option value="Receipt">Receipt</option>
    <option value="Payment">Payment</option>
  </select>
</label>


        <label style={styles.label}>
          Bank Account:
          <input type="text" name="bank_account" value={formData.bank_account} onChange={handleChange} style={styles.input} required />
        </label>

        <label style={styles.label}>
          Details:
          <textarea name="details" value={formData.details} onChange={handleChange} style={styles.textarea} />
        </label>
        <label style={styles.label}>
          Transaction Details:
          <textarea name="transaction_details" value={formData.transaction_details} onChange={handleChange} style={styles.textarea} />
        </label>
        <label style={styles.label}>
          Amount:
          <input type="number" name="amount" value={formData.amount} onChange={handleChange} style={styles.input} required />
        </label>

      

      

        <label style={styles.label}>
          Serial Number:
          <input type="text" name="manual_number" value={formData.manual_number} onChange={handleChange} style={styles.input} />
        </label>

        <button type="submit" style={styles.button}>Submit</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    color: '#003366',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '12px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginTop: '4px',
    width: '100%',
  },
  textarea: {
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginTop: '4px',
    width: '100%',
    resize: 'vertical',
  },
  button: {
    padding: '12px',
    marginTop: '20px',
    backgroundColor: '#003366',
    color: 'white',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  success: {
    color: 'green',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: '15px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
};

export default CashbookReconciliationForm;
