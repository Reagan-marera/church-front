import React, { useState, useEffect } from 'react';

const ChartOfAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null); // Track editing state

  // State for the form inputs
  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    sub_account_details: [{ id: '', name: '', opening_balance: '', balance_type: 'debit' }],
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
      sub_account_details: [
        ...formData.sub_account_details,
        { id: '', name: '', opening_balance: '', balance_type: 'debit' }, // New subaccount without an ID
      ],
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

  // Function to generate unique ID for subaccounts that don't have one
  const generateSubAccountId = (subAccount) => {
    if (!subAccount.id) {
      subAccount.id = `subaccount-${Date.now()}`; // Generate unique ID using current timestamp
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Ensure each subaccount has an ID
    formData.sub_account_details.forEach(generateSubAccountId);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    const url = editingAccountId
      ? `http://127.0.0.1:5000/chart-of-accounts/${editingAccountId}` // For updating
      : 'http://127.0.0.1:5000/chart-of-accounts'; // For creating new

    const method = editingAccountId ? 'PUT' : 'POST'; // POST for creating, PUT for updating

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const result = await response.json();
      fetchAccounts(); // Reload accounts
      setEditingAccountId(null); // Reset editing state

      // Clear the form after submission
      setFormData({
        parent_account: '',
        account_name: '',
        account_type: '',
        sub_account_details: [{ id: '', name: '', opening_balance: '', balance_type: 'debit' }],
      });
      alert(result.message); // Show success message
    } catch (error) {
      setError(error.message);
    }
  };

  // Fetch accounts from the server
  const fetchAccounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/chart-of-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setAccounts(data); // Populate the accounts list
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (account) => {
    setEditingAccountId(account.id); // Set the ID of the account being edited
    setFormData({
      parent_account: account.parent_account,
      account_name: account.account_name,
      account_type: account.account_type,
      sub_account_details: account.sub_account_details || [{ id: '', name: '', opening_balance: '', balance_type: 'debit' }],
    });
  };

  // Handle delete button click
  const handleDelete = async (accountId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/chart-of-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      setAccounts(accounts.filter((account) => account.id !== accountId)); // Update the list after deletion
      alert('Account deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchAccounts(); // Fetch the accounts when the component mounts
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>{editingAccountId ? 'Edit Account' : 'Add New Account'}</h2>

      {/* Form to create or edit an account */}
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
              <div style={styles.formGroup}>
                <label style={styles.label}>Opening Balance:</label>
                <input
                  type="number"
                  value={subAccount.opening_balance}
                  onChange={(e) => handleSubAccountChange(index, 'opening_balance', e.target.value)}
                  placeholder={`Enter Opening Balance ${index + 1}`}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Balance Type:</label>
                <select
                  value={subAccount.balance_type}
                  onChange={(e) => handleSubAccountChange(index, 'balance_type', e.target.value)}
                  style={styles.input}
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
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

        <button type="submit" style={styles.button}>
          {editingAccountId ? 'Update Account' : 'Add Account'}
        </button>
      </form>

      {/* Table for displaying accounts */}
      <table style={styles.table}>
        <thead>
          <tr>
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
              <td colSpan="5" style={styles.tableCell}>No accounts available.</td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{account.account_type}</td>
                <td style={styles.tableCell}>{account.account_name}</td>
                <td style={styles.tableCell}>{account.parent_account}</td>
                <td style={styles.tableCell}>
                  {account.sub_account_details && account.sub_account_details.length > 0
                    ? account.sub_account_details.map((sub, idx) => (
                        <div key={idx}>
                          <strong>{sub.name}</strong> - Opening Balance: 
                          <span style={sub.balance_type === 'credit' ? { color: 'red' } : { color: 'green' }}>
                            {sub.opening_balance}
                          </span>
                          ({sub.balance_type === 'credit' ? 'Credit' : 'Debit'})
                        </div>
                      ))
                    : 'No subaccounts'}
                </td>
                <td style={styles.tableCell}>
                  <button onClick={() => handleEdit(account)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(account.id)} style={styles.deleteButton}>
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
    padding: '20px',
  },
  heading: {
    fontSize: '24px',
    marginBottom: '20px',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
  },
  removeButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    textAlign: 'left',
  },
  tableCell: {
    padding: '10px',
    border: '1px solid #ccc',
  },
  tableRow: {
    backgroundColor: '#ffffff',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    cursor: 'pointer',
  },
};

export default ChartOfAccountsTable;
