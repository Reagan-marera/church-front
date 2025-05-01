import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const ChartOfAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null);

  const [formData, setFormData] = useState({
    parent_account: '',
    account_name: '',
    account_type: '',
    note_number: '',
    parent_account_id: null,
    sub_account_details: [{ id: '', name: '', opening_balance: '', description: '', debit: '', credit: '' }],
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
    if (field === 'debit' || field === 'credit') {
      value = value === '' ? '' : parseFloat(value) || 0;
    }
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
        { id: '', name: '', opening_balance: '', description: '', debit: '', credit: '' },
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
      subAccount.id = `subaccount-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const updatedSubAccountDetails = formData.sub_account_details.map((subAccount) => {
      generateSubAccountId(subAccount);
      return {
        ...subAccount,
        opening_balance: subAccount.opening_balance || '',
        description: subAccount.description || '',
        debit: subAccount.debit || 0,
        credit: subAccount.credit || 0,
      };
    });

    const updatedFormData = {
      ...formData,
      sub_account_details: updatedSubAccountDetails,
    };

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    const url = editingAccountId
      ? `https://yoming.boogiecoin.com/chart-of-accounts/${editingAccountId}`
      : 'https://yoming.boogiecoin.com/chart-of-accounts';

    const method = editingAccountId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFormData),
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
        note_number: '',
        parent_account_id: null,
        sub_account_details: [{ id: '', name: '', opening_balance: '', description: '', debit: '', credit: '' }],
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
      const response = await fetch('https://yoming.boogiecoin.com/chart-of-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      const sortedAccounts = data.sort((a, b) => (a.parent_account < b.parent_account ? -1 : 1));
      setAccounts(sortedAccounts);
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
      note_number: account.note_number || '',
      parent_account_id: account.parent_account_id || null,
      sub_account_details: account.sub_account_details || [{ id: '', name: '', opening_balance: '', description: '', debit: '', credit: '' }],
    });
  };

  const handleDelete = async (accountId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`https://yoming.boogiecoin.com/chart-of-accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  const printTable = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Print Table</title></head><body>');
    printWindow.document.write('<h2>Chart of Accounts</h2>');
    printWindow.document.write(document.querySelector('table').outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token is missing.');
        return;
      }

      try {
        for (const item of data) {
          const formattedData = {
            parent_account: item.parent_account || '',
            account_name: item.account_name || '',
            account_type: item.account_type || '',
            note_number: item.note_number || '',
            parent_account_id: item.parent_account_id || null,
            sub_account_details: JSON.parse(item.sub_account_details || '[]'),
          };

          const response = await fetch('https://yoming.boogiecoin.com/chart-of-accounts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formattedData),
          });

          if (!response.ok) {
            console.error('Upload failed for:', formattedData);
            continue;
          }
        }

        fetchAccounts();
        alert('Excel file uploaded successfully!');
      } catch (err) {
        setError(`Upload error: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
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
          <input type="text" name="account_type" value={formData.account_type} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Account Class:</label>
          <input type="text" name="account_name" value={formData.account_name} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>General Ledger:</label>
          <input type="text" name="parent_account" value={formData.parent_account} onChange={handleInputChange} required style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Note Number:</label>
          <input type="text" name="note_number" value={formData.note_number} onChange={handleInputChange} style={styles.input} />
        </div>

        <div>
          <h3>Subaccounts</h3>
          {formData.sub_account_details.map((sub, index) => (
            <div key={index} style={styles.formGroup}>
              <label style={styles.label}>Subaccount Name:</label>
              <input
                type="text"
                value={sub.name}
                onChange={(e) => handleSubAccountChange(index, 'name', e.target.value)}
                placeholder={`Subaccount ${index + 1}`}
                style={styles.input}
              />
              <button type="button" onClick={() => handleRemoveSubAccount(index)} style={styles.removeButton}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={handleAddSubAccount} style={styles.addButton}>Add Subaccount</button>
        </div>

        <button type="submit" style={styles.button}>{editingAccountId ? 'Update Account' : 'Add Account'}</button>
      </form>

      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={styles.fileInput} />
      <button onClick={printTable} style={styles.button}>Print ChartOfAccounts</button>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Account Type</th>
            <th style={styles.tableHeader}>Account Class</th>
            <th style={styles.tableHeader}>General Ledger</th>
            <th style={styles.tableHeader}>Note Number</th>
            <th style={styles.tableHeader}>Sub Account Details</th>
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 ? (
            <tr><td colSpan="6" style={styles.tableCell}>No accounts available.</td></tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id}>
                <td style={styles.tableCell}>{account.account_type}</td>
                <td style={styles.tableCell}>{account.account_name}</td>
                <td style={styles.tableCell}>{account.parent_account}</td>
                <td style={styles.tableCell}>{account.note_number || 'N/A'}</td>
                <td style={styles.tableCell}>
                  {account.sub_account_details?.map((sub, idx) => (
                    <div key={idx}><strong>{sub.name}</strong></div>
                  )) || 'No subaccounts'}
                </td>
                <td style={styles.tableCell}>
                  <button onClick={() => handleEdit(account)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(account.id)} style={styles.deleteButton}>Delete</button>
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
  container: { padding: '20px', fontFamily: 'Arial Black' },
  form: { marginBottom: '20px' },
  formGroup: { marginBottom: '10px' },
  label: { fontWeight: 'bold', color: 'blue' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#f0f0f0' },
  addButton: { backgroundColor: 'blue', color: 'white', padding: '10px', fontWeight: 'bold', border: 'none' },
  removeButton: { backgroundColor: '#e53935', color: 'white', padding: '5px 10px', fontWeight: 'bold', border: 'none' },
  button: { backgroundColor: 'green', color: 'white', padding: '10px 15px', fontWeight: 'bold', border: 'none', marginTop: '10px' },
  editButton: { backgroundColor: 'orange', color: 'white', padding: '5px 10px', marginRight: '5px' },
  deleteButton: { backgroundColor: '#e53935', color: 'white', padding: '5px 10px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  tableHeader: { backgroundColor: '#003366', color: 'white', padding: '10px' },
  tableCell: { padding: '10px', border: '1px solid #333' },
  fileInput: { marginTop: '20px', padding: '10px', borderRadius: '5px', border: '1px solid #333' },
};

export default ChartOfAccountsTable;
