import React, { useState, useEffect } from 'react';

const PayeeList = () => {
  const [payees, setPayees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPayeeId, setEditingPayeeId] = useState(null);

  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    sub_account_details: [{ id: '', name: '' }],
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
        { id: '', name: '' },
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

    const url = editingPayeeId
      ? `http://127.0.0.1:5000/payee/${editingPayeeId}`
      : 'http://127.0.0.1:5000/payee';

    const method = editingPayeeId ? 'PUT' : 'POST';

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
      fetchPayees();
      setEditingPayeeId(null);
      setFormData({
        parent_account: '',
        account_name: '',
        account_type: '',
        sub_account_details: [{ id: '', name: '' }],
      });
      alert(result.message);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchPayees = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/payee', {
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
      setPayees(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payee) => {
    setEditingPayeeId(payee.id);
    setFormData({
      parent_account: payee.parent_account,
      account_name: payee.account_name,
      account_type: payee.account_type,
      sub_account_details: payee.sub_account_details || [{ id: '', name: '' }],
    });
  };

  const handleDelete = async (payeeId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/payee/${payeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete payee');
      }

      setPayees(payees.filter((payee) => payee.id !== payeeId));
      alert('Payee deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchPayees();
  }, []);

  if (loading) return <div className="loader">Loading...</div>;

  if (error) return <p style={{ color: '#ff4d4d' }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <i><h2 className="color-changing-words">{editingPayeeId ? 'Edit Payee Account' : 'Add New Payee Account'}</h2></i> 

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
          <label style={styles.label}>General ledger:</label>
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
          {editingPayeeId ? 'Update Payee' : 'Add Payee'}
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Account Type</th>
            <th style={styles.tableHeader}>Account Name</th>
            <th style={styles.tableHeader}>Parent Account</th>
            <th style={styles.tableHeader}>Sub Account Details</th>
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payees.length === 0 ? (
            <tr>
              <td colSpan="5" style={styles.tableCell}>No payee accounts available.</td>
            </tr>
          ) : (
            payees.map((payee) => (
              <tr key={payee.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{payee.account_type}</td>
                <td style={styles.tableCell}>{payee.account_name}</td>
                <td style={styles.tableCell}>{payee.parent_account}</td>
                <td style={styles.tableCell}>
                  {payee.sub_account_details && payee.sub_account_details.length > 0
                    ? payee.sub_account_details.map((sub, idx) => (
                        <div key={idx}>{sub.name}</div>
                      ))
                    : 'No subaccounts'}
                </td>
                <td style={styles.tableCell}>
                  <button onClick={() => handleEdit(payee)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(payee.id)} style={styles.deleteButton}>
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
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f8ff',
    },
    heading: {
      fontSize: '24px',
      marginBottom: '20px',
      fontWeight: 'bold',
      color: '#3e8e41', // Green color
    },
    form: {
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '10px',
    },
    label: {
      fontWeight: 'bold',
      color: '#333', // Dark gray for readability
    },
    input: {
      width: '100%',
      padding: '12px',
      marginTop: '5px',
      borderRadius: '6px',
      border: '1px solid #4CAF50', // Green border
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: '#333',
    },
    addButton: {
      backgroundColor: '#4CAF50', // Green
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '10px',
      fontWeight: 'bold',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    removeButton: {
      backgroundColor: '#ff6347', // Red
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '10px',
      fontWeight: 'bold',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    button: {
      backgroundColor: '#4CAF50', // Green
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginBottom: '5px',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    editButton: {
      backgroundColor: '#ffa500', // Orange
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginBottom: '5px',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    tableHeader: {
      backgroundColor: '#008080', // Teal
      padding: '12px',
      textAlign: 'left',
      color: 'white',
      fontWeight: 'bold',
    },
    tableCell: {
      padding: '12px',
      border: '1px solid #333',
      color: 'black',
      borderRadius: '5px',
    },
    tableRow: {
      backgroundColor: '#ffffff',
    },
    deleteButton: {
      backgroundColor: '#ff6347', // Red
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    loader: {
      textAlign: 'center',
      fontSize: '20px',
      padding: '20px',
      color: '#333',
    },
    // Hover effects on buttons
    buttonHover: {
      ':hover': {
        backgroundColor: '#45a049', // Slightly darker green for button hover
        transform: 'translateY(-2px)', // Slight lift effect
      },
    },
    removeButtonHover: {
      ':hover': {
        backgroundColor: '#ff4d30', // Slightly darker red
        transform: 'translateY(-2px)', // Slight lift effect
      },
    },
    editButtonHover: {
      ':hover': {
        backgroundColor: '#ff7f29', // Slightly darker orange
        transform: 'translateY(-2px)', // Slight lift effect
      },
    },
    deleteButtonHover: {
      ':hover': {
        backgroundColor: '#e53d29', // Slightly darker red for delete
        transform: 'translateY(-2px)', // Slight lift effect
      },
    },
  };
  
  const animationStyle = document.createElement('style');
  animationStyle.innerHTML = `
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
        color: #00BFFF; /* Deep Sky Blue */
      }
      75% {
        color: #FF6347; /* Tomato */
      }
      100% {
        color: #2E8B57; /* Sea Green */
      }
    }
  `;
  
  document.head.appendChild(animationStyle);
  
export default PayeeList;
