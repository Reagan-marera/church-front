import React, { useEffect, useState } from 'react';

const ChartOfAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the form inputs
  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    sub_account_details: '',
  });

  // Handle input change for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create new account');
      }

      const newAccount = await response.json();
      // Reload accounts data after adding new account
      fetchAccounts();
      setFormData({
        parent_account: '',
        account_name: '',
        account_type: '',
        sub_account_details: '',
      });
      alert(newAccount.message); // Show success message
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/chart-of-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Check for unauthorized access (e.g., token expiration)
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to fetch data');
        }
        return;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setAccounts(data);
      } else {
        setError('The data received is not an array.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Chart of Accounts</h2>

      {/* Form to create a new account */}
      <form onSubmit={handleFormSubmit} style={styles.form}>
        <div style={styles.formGroup}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Account Type:</label>
          <input
            type="text"
            name="account_type"
            value={formData.account_type}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Account class:</label>
          <input
            type="text"
            name="account_name"
            value={formData.account_name}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>
       
          <label style={styles.label}>Parent Account:</label>
          <input
            type="text"
            name="parent_account"
            value={formData.parent_account}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>
       
        <div style={styles.formGroup}>
          <label style={styles.label}>Sub Account Details:</label>
          <input
            type="text"
            name="sub_account_details"
            value={formData.sub_account_details}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>Add Account</button>
      </form>

      {/* Table for displaying accounts */}
      <table style={styles.table}>
        <thead>
          <tr>
          <th style={styles.tableHeader}>ID</th>
          <th style={styles.tableHeader}>Account Type</th>
          <th style={styles.tableHeader}>Account Class</th>
          <th style={styles.tableHeader}>Parent Account</th>
          <th style={styles.tableHeader}>Sub Account Details</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 ? (
            <tr>
              <td colSpan="5" style={styles.tableCell}>No accounts available.</td>
            </tr>
          ) : (
            accounts.map(account => (
              <tr key={account.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{account.id}</td>
                <td style={styles.tableCell}>{account.account_type}</td>
                <td style={styles.tableCell}>{account.account_name}</td>
                <td style={styles.tableCell}>{account.parent_account}</td>
                <td style={styles.tableCell}>{account.sub_account_details}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Styles
const styles = {
  container: {
    margin: '0 auto',
    padding: '20px',
    maxWidth: '1200px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '2rem',
    color: '#333',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#f8f8f8',
    color: '#333',
    padding: '12px 15px',
    border: '1px solid #ddd',
    textAlign: 'left',
    fontSize: '1rem',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  tableCell: {
    padding: '12px 15px',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
};

export default ChartOfAccountsTable;
