import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const ChartOfAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const [formData, setFormData] = useState({
    account_name: '',
    account_type: '',
    id: '',
    note_number: '',
    parent_account: '',
    parent_account_id: null,
    sub_account_details: [{ name: '' }],
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
        { name: '' },
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
      ? `https://backend.youmingtechnologies.co.ke/chart-of-accounts/${editingAccountId}`
      : 'https://backend.youmingtechnologies.co.ke/chart-of-accounts';

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
        account_name: '',
        account_type: '',
        id: '',
        note_number: '',
        parent_account: '',
        parent_account_id: null,
        sub_account_details: [{ name: '' }],
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
      const response = await fetch('https://backend.youmingtechnologies.co.ke/chart-of-accounts', {
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
      account_name: account.account_name,
      account_type: account.account_type,
      id: account.id || '',
      note_number: account.note_number || '',
      parent_account: account.parent_account,
      parent_account_id: account.parent_account_id || null,
      sub_account_details: account.sub_account_details || [{ name: '' }],
    });
  };

  const handleDelete = async (accountId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch(`https://backend.youmingtechnologies.co.ke/chart-of-accounts/${accountId}`, {
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

  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete ALL accounts? This action cannot be undone.');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    setDeletingAll(true);
    try {
      for (const account of accounts) {
        await fetch(`https://backend.youmingtechnologies.co.ke/chart-of-accounts/${account.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setAccounts([]);
      alert('All accounts deleted successfully.');
    } catch (err) {
      setError('Failed to delete all accounts.');
      console.error(err);
    } finally {
      setDeletingAll(false);
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
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with header: 1 to get array of arrays
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        console.log('Complete file data:', rawData);
  
        // Process all rows looking for account data pattern
        const accountsToUpload = [];
        const parentAccountMap = {};
  
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          
          // Skip empty rows or rows with insufficient data (need at least 6 columns including the empty first one)
          if (!row || row.length < 6) continue;
  
          // Extract values from specific columns - accounting for the empty first column
          const accountType = String(row[1] || '').trim();    // Second column (account_type)
          const accountName = String(row[2] || '').trim();    // Third column (account_name)
          const noteNumber = String(row[3] || '').trim();     // Fourth column (note_number)
          const parentAccount = String(row[4] || '').trim();  // Fifth column (parent_account)
          const subAccount = String(row[5] || '').trim();     // Sixth column (sub_account_details)
  
          // Validate required fields - we don't require note_number
          if (!accountType || !accountName || !parentAccount || !subAccount) {
            console.log('Skipping row due to missing essential data:', row);
            continue;
          }
  
          // Group by parent account
          if (!parentAccountMap[parentAccount]) {
            parentAccountMap[parentAccount] = {
              account_type: accountType,
              account_name: accountName,
              parent_account: parentAccount,
              note_number: noteNumber || '0', // Default to '0' if empty
              sub_account_details: []
            };
            accountsToUpload.push(parentAccountMap[parentAccount]);
          }
  
          // Add sub-account details
          parentAccountMap[parentAccount].sub_account_details.push({
            name: subAccount,
            id: `subacc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          });
        }
  
        if (accountsToUpload.length === 0) {
          throw new Error(
            `No valid accounts found. Your file must have this exact structure:\n\n` +
            `[empty] | account_type | account_name | note_number | parent_account | sub_account_details\n` +
            `Example:\n` +
            `null | "10-Assets" | "100-Current Assets" | 20 | "1000-Cash & Cash Equivalent" | "1001-College Fund Acc"\n\n` +
            `First 5 rows of your file:\n${JSON.stringify(rawData.slice(0, 5), null, 2)}`
          );
        }
  
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing');
          return;
        }
  
        // Upload accounts with progress tracking
        let successCount = 0;
        const uploadPromises = accountsToUpload.map(async (account) => {
          try {
            const response = await fetch('https://backend.youmingtechnologies.co.ke/chart-of-accounts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(account),
            });
  
            if (!response.ok) {
              const error = await response.json();
              console.error('Upload failed:', account.parent_account, error);
              return false;
            }
            successCount++;
            return true;
          } catch (err) {
            console.error('Error uploading:', account.parent_account, err);
            return false;
          }
        });
  
        const results = await Promise.all(uploadPromises);
        const failedCount = results.filter(result => !result).length;
  
        if (successCount > 0) {
          fetchAccounts(); // Refresh the accounts list
          alert(`${successCount} parent accounts with ${accountsToUpload.reduce((sum, acc) => sum + acc.sub_account_details.length, 0)} sub-accounts uploaded successfully!${failedCount > 0 ? ` ${failedCount} failed.` : ''}`);
        } else {
          throw new Error('All uploads failed. Check console for details.');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message);
      }
    };
    reader.readAsArrayBuffer(file);
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
          <label style={styles.label}>Note Number:</label>
          <input type="text" name="note_number" value={formData.note_number} onChange={handleInputChange} style={styles.input} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Parent Account:</label>
          <input type="text" name="parent_account" value={formData.parent_account} onChange={handleInputChange} required style={styles.input} />
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

      <div style={{ margin: '20px 0' }}>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={styles.fileInput} />
        <p>Upload Excel file with Chart of Accounts (must match the required format)</p>
      </div>
      <button onClick={printTable} style={styles.button}>Print ChartOfAccounts</button>
      <button
        onClick={handleDeleteAll}
        style={{ ...styles.deleteButton, marginBottom: '10px' }}
        disabled={deletingAll}
      >
        {deletingAll ? 'Deleting...' : 'Delete All Accounts'}
      </button>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Account Type</th>
            <th style={styles.tableHeader}>Account Class</th>
            <th style={styles.tableHeader}>Note Number</th>
            <th style={styles.tableHeader}>Parent Account</th>
            <th style={styles.tableHeader}>Sub Account Details</th>
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 ? (
            <tr><td colSpan="7" style={styles.tableCell}>No accounts available.</td></tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id}>
                <td style={styles.tableCell}>{account.account_type}</td>
                <td style={styles.tableCell}>{account.account_name}</td>
                <td style={styles.tableCell}>{account.note_number || 'N/A'}</td>
                <td style={styles.tableCell}>{account.parent_account}</td>
                <td style={styles.tableCell}>
                  {account.sub_account_details?.map((sub, idx) => (
                    <div key={idx}>
                      <strong>{sub.name}</strong>
                    </div>
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
  label: { fontWeight: 'bold', color: 'blue', display: 'block', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#f0f0f0', marginBottom: '10px' },
  addButton: { backgroundColor: 'blue', color: 'white', padding: '10px', fontWeight: 'bold', border: 'none', marginRight: '10px' },
  removeButton: { backgroundColor: '#e53935', color: 'white', padding: '5px 10px', fontWeight: 'bold', border: 'none' },
  button: { backgroundColor: 'green', color: 'white', padding: '10px 15px', fontWeight: 'bold', border: 'none', marginTop: '10px', marginRight: '10px' },
  editButton: { backgroundColor: 'orange', color: 'white', padding: '5px 10px', marginRight: '5px' },
  deleteButton: { backgroundColor: '#e53935', color: 'white', padding: '5px 10px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  tableHeader: { backgroundColor: '#003366', color: 'white', padding: '10px' },
  tableCell: { padding: '10px', border: '1px solid #333' },
  fileInput: { marginTop: '20px', padding: '10px', borderRadius: '5px', border: '1px solid #333' },
};

export default ChartOfAccountsTable;
