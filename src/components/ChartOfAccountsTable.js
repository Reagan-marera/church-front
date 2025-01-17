import React, { useState, useEffect } from 'react';

const ChartOfAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null);

  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    sub_account_details: [{ id: '', name: '', opening_balance: '', balance_type: 'debit' }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubAccountChange = (index, field, value) => {
    const newSubAccounts = [...formData.sub_account_details];
    newSubAccounts[index][field] = value;
    setFormData({
      ...formData,
      sub_account_details: newSubAccounts,
    });
  };

  const handleAddSubAccount = () => {
    setFormData({
      ...formData,
      sub_account_details: [
        ...formData.sub_account_details,
        { id: '', name: '', opening_balance: '', balance_type: 'debit' },
      ],
    });
  };

  const handleRemoveSubAccount = (index) => {
    const newSubAccounts = formData.sub_account_details.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sub_account_details: newSubAccounts,
    });
  };

  const generateSubAccountId = (subAccount) => {
    if (!subAccount.id) {
      subAccount.id = `subaccount-${Date.now()}`;
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    formData.sub_account_details.forEach(generateSubAccountId);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    const url = editingAccountId
      ? `http://127.0.0.1:5000/chart-of-accounts/${editingAccountId}`
      : 'http://127.0.0.1:5000/chart-of-accounts';

    const method = editingAccountId ? 'PUT' : 'POST';

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
      fetchAccounts();
      setEditingAccountId(null);
      setFormData({
        parent_account: '',
        account_name: '',
        account_type: '',
        sub_account_details: [{ id: '', name: '', opening_balance: '', balance_type: 'debit' }],
      });
      alert(result.message);
    } catch (error) {
      setError(error.message);
    }
  };

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
      setAccounts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccountId(account.id);
    setFormData({
      parent_account: account.parent_account,
      account_name: account.account_name,
      account_type: account.account_type,
      sub_account_details: account.sub_account_details || [{ id: '', name: '', opening_balance: '', balance_type: 'debit' }],
    });
  };

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

      setAccounts(accounts.filter((account) => account.id !== accountId));
      alert('Account deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (loading) return <div className="loader">Loading...</div>;

  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <h2 className="color-changing-words">{editingAccountId ? 'Edit Account' : 'Add New Account'}</h2>

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
    fontFamily: 'Arial Black, Impact, sans-serif',
  },
  heading: {
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold',
    color: 'black',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginTop: '5px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Arial Black, Impact, sans-serif',
    fontWeight: 'bold',
    color: 'black',
  },
  addButton: {
    backgroundColor: 'blue',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#e53935',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'green',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom:'5px'
  },
  editButton: {
    backgroundColor: 'orange',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom:'5px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    fontFamily: 'Arial Black, Impact, sans-serif',
  },
  tableHeader: {
    backgroundColor: '#003366',
    padding: '12px',
    textAlign: 'left',
    color: 'white',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: '12px',
    border: '1px solid #333',
    color: 'black',
    borderRadius:'5px'
  },
  tableRow: {
    backgroundColor: 'white',
  },
  deleteButton: {
    backgroundColor: '#e53935',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  loader: {
    textAlign: 'center',
    fontSize: '20px',
    padding: '20px',
    color: '#333',
  },
};

// Changing colors animation
const style = document.createElement('style');
style.innerHTML = `
  .color-changing-words {
    font-size: 2rem;
    font-weight: bold;
    animation: colorChange 5s infinite;
    color: #003A5C; /* Initial color */
  }

  @keyframes colorChange {
    0% {
      color: #003A5C; /* Dark Blue */
    }
    25% {
      color: #0071BC; /* Blue */
    }
    50% {
      color: #6EC1E4; /* Light Blue */
    }
    75% {
      color: #7DCA4A; /* Green */
    }
    100% {
      color: #003A5C; /* Dark Blue */
    }
  }
`;
document.head.appendChild(style);


export default ChartOfAccountsTable;
