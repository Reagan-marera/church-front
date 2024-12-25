import React, { useState, useEffect } from 'react';

const ChartOfAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the form inputs
  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    sub_account_details: [{ name: '' }], // Removed description
  });

  // Handle input change for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle subaccount input change (for multiple subaccounts)
  const handleSubAccountChange = (index, field, value) => {
    const newSubAccounts = [...formData.sub_account_details];
    newSubAccounts[index][field] = value;
    setFormData({
      ...formData,
      sub_account_details: newSubAccounts,
    });
  };

  // Add a new subaccount input field
  const handleAddSubAccount = () => {
    setFormData({
      ...formData,
      sub_account_details: [...formData.sub_account_details, { name: '' }], // Removed description
    });
  };

  // Remove a subaccount input field
  const handleRemoveSubAccount = (index) => {
    const newSubAccounts = formData.sub_account_details.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sub_account_details: newSubAccounts,
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
      const response = await fetch('https://finance.boogiecoin.com/chart-of-accounts', {
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
        sub_account_details: [{ name: '' }], // Reset subaccount details
      });
      alert(newAccount.message); // Show success message
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle deletion of an account
  const handleDelete = async (accountId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`https://finance.boogiecoin.com/chart-of-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Remove the deleted account from the local state
      setAccounts(accounts.filter(account => account.id !== accountId));
      alert('Account deleted successfully');
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
      const response = await fetch('https://finance.boogiecoin.com/chart-of-accounts', {
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
          <label style={styles.label}>Account Class:</label>
          <input
            type="text"
            name="account_name"
            value={formData.account_name}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
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

        {/* Subaccount details */}
        <div>
          <h3>Subaccounts</h3>
          {formData.sub_account_details.map((subAccount, index) => (
            <div key={index} style={styles.formGroup}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subaccount Name:</label>
                <input
                  type="text"
                  value={subAccount.name}
                  onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
                  placeholder={`Subaccount ${index + 1} Name`}
                  style={styles.input}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSubAccount(index)}
                style={styles.removeButton}
              >
                Remove Subaccount
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddSubAccount} style={styles.addButton}>
            Add Subaccount
          </button>
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
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 ? (
            <tr>
              <td colSpan="6" style={styles.tableCell}>No accounts available.</td>
            </tr>
          ) : (
            accounts.map(account => (
              <tr key={account.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{account.id}</td>
                <td style={styles.tableCell}>{account.account_type}</td>
                <td style={styles.tableCell}>{account.account_name}</td>
                <td style={styles.tableCell}>{account.parent_account}</td>
                <td style={styles.tableCell}>
                  {account.sub_account_details && account.sub_account_details.length > 0
                    ? account.sub_account_details.map((sub, idx) => (
                        <div key={idx}>
                          <strong>{sub.name}</strong>
                        </div>
                      ))
                    : 'No subaccounts'}
                </td>
                <td style={styles.tableCell}>
                  <button
                    onClick={() => handleDelete(account.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
const styles = {
  container: {
    margin: '0 auto',
    padding: '30px',
    maxWidth: '1200px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Helvetica, Arial, sans-serif', // World Bank typical font family
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2.2rem',
    fontWeight: '600',
    color: '#005f87', // World Bank blue shade
  },
  form: {
    marginBottom: '30px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '8px',
    fontSize: '1.1rem',
    color: '#333', // Dark grey for readability
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #d1e0e9', // Light blue-gray border
    outline: 'none',
    transition: 'border 0.3s ease',
  },
  inputFocus: {
    border: '1px solid #005f87', // World Bank blue on focus
  },
  button: {
    backgroundColor: '#005f87', // World Bank blue
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontSize: '1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  buttonHover: {
    backgroundColor: '#003f5c', // Darker blue on hover
  },
  addButton: {
    backgroundColor: '#007bff', // Slightly lighter blue for add action
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontSize: '1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  removeButton: {
    backgroundColor: '#f0ad4e', // Light orange for remove
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    fontSize: '0.9rem',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '5px',
    transition: 'background-color 0.3s ease',
  },
  deleteButton: {
    backgroundColor: '#d9534f', // Red for delete action
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    fontSize: '0.9rem',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '30px',
  },
  tableHeader: {
    backgroundColor: '#f0f8ff', // Light blue-gray for table headers
    color: '#003f5c', // World Bank dark blue
    padding: '15px 20px',
    border: '1px solid #e0e7f1',
    textAlign: 'left',
    fontSize: '1rem',
    fontWeight: '600',
  },
  tableRow: {
    borderBottom: '1px solid #e0e7f1',
  },
  tableCell: {
    padding: '15px 20px',
    textAlign: 'left',
    fontSize: '1rem',
    color: '#333', // Standard dark text for readability
  },
  tableCellActions: {
    padding: '15px 20px',
    textAlign: 'center',
    fontSize: '1rem',
  },
  alert: {
    padding: '10px 15px',
    backgroundColor: '#f8d7da', // Light red background for alerts
    color: '#721c24',
    borderRadius: '5px',
    marginTop: '15px',
    marginBottom: '15px',
  },
};


export default ChartOfAccountsTable;
