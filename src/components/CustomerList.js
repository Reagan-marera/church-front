import React, { useState, useEffect } from 'react';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    sub_account_details: [{ id: '', name: '', description: '', debit: '', credit: '' }],
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
        { id: '', name: '', description: '', debit: '', credit: '' },
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure all subaccounts have the required fields even if not visible to the user
    formData.sub_account_details.forEach((subaccount) => {
      if (!subaccount.id) {
        subaccount.id = `subaccount-${Date.now()}`;
      }
      if (!subaccount.description) {
        subaccount.description = '';  // Default value if missing
      }
      if (!subaccount.debit) {
        subaccount.debit = '';  // Default value if missing
      }
      if (!subaccount.credit) {
        subaccount.credit = '';  // Default value if missing
      }
    });

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    const url = editingCustomerId
      ? `http://127.0.0.1:5000/customer/${editingCustomerId}`
      : 'http://127.0.0.1:5000/customer';

    const method = editingCustomerId ? 'PUT' : 'POST';

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
      fetchCustomers();
      setEditingCustomerId(null);
      setFormData({
        parent_account: '',
        account_name: '',
        account_type: '',
        sub_account_details: [{ id: '', name: '', description: '', debit: '', credit: '' }],
      });
      alert(result.message);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/customer', {
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
      setCustomers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomerId(customer.id);
    setFormData({
      parent_account: customer.parent_account,
      account_name: customer.account_name,
      account_type: customer.account_type,
      sub_account_details: customer.sub_account_details.map(sub => ({
        ...sub,
        description: sub.description || '',
        debit: sub.debit || '',
        credit: sub.credit || '',
      })),
    });
  };

  const handleDelete = async (customerId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/customer/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      setCustomers(customers.filter((customer) => customer.id !== customerId));
      alert('Customer deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) return <div className="loader">Loading...</div>;

  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <i><h2 className="color-changing-words">{editingCustomerId ? 'Edit Customer' : 'Add New Customer'}</h2></i>

      <form onSubmit={handleFormSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Customer Type:</label>
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
          <label style={styles.label}>customer Class:</label>
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
          <label style={styles.label}>General ledger</label>
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
          <h3>Customer Details</h3>
          {formData.sub_account_details.map((subAccount, index) => (
            <div key={index} style={styles.formGroup}>
              <label style={styles.label}>Subaccount Name:</label>
              <input
                type="text"
                value={subAccount.name}
                onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
                placeholder={`Subaccount ${index + 1} Name`}
                style={styles.input}
              />
              {/* Hidden fields */}
              <input
                type="hidden"
                value={subAccount.description}
                onChange={(e) => handleSubAccountChange(index, 'description', e.target.value)}
              />
              <input
                type="hidden"
                value={subAccount.debit}
                onChange={(e) => handleSubAccountChange(index, 'debit', e.target.value)}
              />
              <input
                type="hidden"
                value={subAccount.credit}
                onChange={(e) => handleSubAccountChange(index, 'credit', e.target.value)}
              />

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
          {editingCustomerId ? 'Update Customer' : 'Add Customer'}
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>customer Type</th>
            <th style={styles.tableHeader}>customer Name</th>
            <th style={styles.tableHeader}>General Ledger</th>
            <th style={styles.tableHeader}>Customer Details</th>
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="5" style={styles.tableCell}>No customers available.</td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{customer.account_type}</td>
                <td style={styles.tableCell}>{customer.account_name}</td>
                <td style={styles.tableCell}>{customer.parent_account}</td>
                <td style={styles.tableCell}>
                  {customer.sub_account_details && customer.sub_account_details.length > 0
                    ? customer.sub_account_details.map((sub, idx) => (
                        <div key={idx}>
                          {sub.name}
                        </div>
                      ))
                    : 'No subaccounts'}
                </td>
                <td style={styles.tableCell}>
                  <button onClick={() => handleEdit(customer)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(customer.id)} style={styles.deleteButton}>
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
  },
  heading: {
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold',
    color: '#003366',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
    color: '#003366',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginTop: '5px',
    borderRadius: '6px',
    border: '1px solid #003366',
    backgroundColor: '#f4f6f9',
    color: '#333',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#003366', 
    color: 'white',
    padding: '12px 18px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '5px',
    marginTop: '10px',
    transition: 'all 0.3s ease',
  },
  removeButton: {
    backgroundColor: '#e53935',
    color: 'white',
    padding: '8px 15px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '5px',
    transition: 'all 0.3s ease',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 18px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '5px',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  editButton: {
    backgroundColor: '#ffbb33',
    color: 'white',
    padding: '12px 18px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '5px',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  deleteButton: {
    backgroundColor: '#e53935',
    color: 'white',
    padding: '12px 18px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '5px',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  tableHeader: {
    backgroundColor: '#003366',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: '12px',
    border: '1px solid #ddd',
    textAlign: 'left',
    color: 'black',
    fontWeight: 'normal',
    backgroundColor: 'white',
  },
  tableRow: {
    backgroundColor: '#fff',
  },
  loader: {
    textAlign: 'center',
    fontSize: '20px',
    padding: '20px',
    color: '#333',
  },
};

// Smooth Hover Animation
const style = document.createElement('style');
style.innerHTML = `
  .button:hover,
  .removeButton:hover,
  .editButton:hover,
  .deleteButton:hover {
    transform: scale(1.05);
  }

  .button:focus,
  .removeButton:focus,
  .editButton:focus,
  .deleteButton:focus {
    outline: none;
    box-shadow: 0 0 5px 2px rgba(0, 123, 255, 0.6);
  }
`;
document.head.appendChild(style);

export default CustomerList;
