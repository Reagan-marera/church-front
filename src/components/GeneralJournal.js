import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import './AccountSelection.css';
import moment from 'moment';

// Define the API base URL as a constant
const API_BASE_URL = 'https://backend.youmingtechnologies.co.ke';

const AccountSelection = () => {
  const [selectedCreditedAccount, setSelectedCreditedAccount] = useState(null);
  const [selectedDebitedAccount, setSelectedDebitedAccount] = useState(null);
  const [amountCredited, setAmountCredited] = useState('');
  const [amountDebited, setAmountDebited] = useState('');
  const [description, setDescription] = useState('');
  const [dateIssued, setDateIssued] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [accountOptions, setAccountOptions] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#e2e8f0' : 'white',
      color: state.isSelected ? '#4a5568' : 'black',
      padding: '10px',
      fontWeight: state.inputValue && state.label.toLowerCase().includes(state.inputValue.toLowerCase()) ? 'bold' : 'normal',
    }),
    control: (provided) => ({
      ...provided,
      border: '1px solid #cbd5e0',
      borderRadius: '4px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#a0aec0',
      },
    }),
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
        const rawData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: '',
          raw: false
        });
  
        const transactionsToUpload = [];
        const skippedReasons = [];
  
        // Define column indices
        const COLS = {
          TRANSACTION_DATE: 1,
          ACCOUNT_DEBITED: 2,
          ACCOUNT_CREDITED: 3,
          DESCRIPTION: 4,
          AMOUNT_DEBITED: 5,
          AMOUNT_CREDITED: 6
        };
  
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 6) {
            skippedReasons.push(`Row ${i + 1}: Insufficient columns`);
            continue;
          }
  
          const transactionDate = row[COLS.TRANSACTION_DATE];
          const accountDebited = String(row[COLS.ACCOUNT_DEBITED] || '').trim();
          const accountCredited = String(row[COLS.ACCOUNT_CREDITED] || '').trim();
          const description = String(row[COLS.DESCRIPTION] || '').trim();
          const amountDebited = parseFloat(
            String(row[COLS.AMOUNT_DEBITED] || '0').replace(/,/g, '').replace(/[^\d.-]/g, '')
          ) || 0;
          const amountCredited = parseFloat(
            String(row[COLS.AMOUNT_CREDITED] || '0').replace(/,/g, '').replace(/[^\d.-]/g, '')
          ) || 0;
  
          if (!accountDebited || !accountCredited) {
            skippedReasons.push(`Row ${i + 1}: Missing account info`);
            continue;
          }
  
          if (amountDebited === 0 && amountCredited === 0) {
            skippedReasons.push(`Row ${i + 1}: Both amounts are zero`);
            continue;
          }
  
          let formattedDate;
          try {
            if (typeof transactionDate === 'number') {
              const dateObj = XLSX.SSF.parse_date_code(transactionDate);
              if (!dateObj) throw new Error("Invalid Excel serial date");
              formattedDate = moment(new Date(dateObj.y, dateObj.m - 1, dateObj.d)).format('YYYY-MM-DD');
            } else if (typeof transactionDate === 'string') {
              formattedDate = moment(transactionDate, ['MM/DD/YYYY', 'DD/MM/YYYY']).format('YYYY-MM-DD');
            } else {
              throw new Error("Unrecognized date type");
            }
          } catch (err) {
            skippedReasons.push(`Row ${i + 1}: Invalid date "${transactionDate}"`);
            continue;
          }
  
          transactionsToUpload.push({
            creditedAccount: accountCredited,
            debitedAccount: accountDebited,
            amountCredited,
            amountDebited,
            description,
            dateIssued: formattedDate,
          });
        }
  
        if (transactionsToUpload.length === 0) {
          throw new Error(`No valid transactions found.\n${skippedReasons.slice(0, 10).join('\n')}`);
        }
  
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token missing');
          return;
        }
  
        let successCount = 0;
        const uploadErrors = [];
  
        for (const transaction of transactionsToUpload) {
          try {
            const response = await fetch(`${API_BASE_URL}/submit-transaction`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(transaction),
            });
  
            if (!response.ok) {
              const error = await response.json();
              uploadErrors.push(`${transaction.description}: ${error.error || response.statusText}`);
              continue;
            }
            successCount++;
          } catch (err) {
            uploadErrors.push(`${transaction.description}: ${err.message}`);
          }
        }
  
        let resultMessage = `${successCount} transactions uploaded successfully.`;
        if (uploadErrors.length > 0) {
          resultMessage += `\n\n${uploadErrors.length} errors:\n${uploadErrors.slice(0, 5).join('\n')}`;
          if (uploadErrors.length > 5) {
            resultMessage += `\n...and ${uploadErrors.length - 5} more`;
          }
        }
        alert(resultMessage);
        fetchData(); // Assuming fetchData is a function to refresh the UI
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message);
        alert(`Upload failed: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User is not authenticated");
      }
      const headers = { Authorization: `Bearer ${token}` };
      const chartOfAccountsResponse = await fetch(`${API_BASE_URL}/chart-of-accounts`, { headers });
      const customersResponse = await fetch(`${API_BASE_URL}/customer`, { headers });
      const payeesResponse = await fetch(`${API_BASE_URL}/payee`, { headers });
      if (!chartOfAccountsResponse.ok || !customersResponse.ok || !payeesResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      const chartOfAccounts = await chartOfAccountsResponse.json();
      const customers = await customersResponse.json();
      const payees = await payeesResponse.json();
      const allAccounts = [
        ...chartOfAccounts.map(account => ({
          ...account,
          type: 'chart_of_accounts',
          subaccounts: account.sub_account_details || []
        })),
        ...payees.map(account => ({
          ...account,
          type: 'payee',
          subaccounts: account.sub_account_details || []
        })),
        ...customers.map(account => ({
          ...account,
          type: 'customer',
          subaccounts: account.sub_account_details || []
        }))
      ];
      const options = allAccounts.flatMap(account =>
        account.subaccounts.map(subaccount => ({
          value: subaccount.name,
          label: subaccount.name,
          type: account.type,
        }))
      );
      setAccountOptions(options);
      const transactionsResponse = await fetch(`${API_BASE_URL}/get-transactions`, { headers });
      const data = await transactionsResponse.json();
      const validTransactions = Array.isArray(data.transactions) ? data.transactions.filter(t => t) : [];
      setTransactions(validTransactions);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (transaction) => {
    if (transaction) {
      setSelectedCreditedAccount({ value: transaction.credited_account_name, label: transaction.credited_account_name });
      setSelectedDebitedAccount({ value: transaction.debited_account_name, label: transaction.debited_account_name });
      setAmountCredited(transaction.amount_credited.toString());
      setAmountDebited(transaction.amount_debited.toString());
      setDescription(transaction.description || '');
      setDateIssued(transaction.date_issued || '');
      setCurrentTransactionId(transaction.id);
      setIsEditing(true);
      setIsPopupOpen(true);
    }
  };

  const isDuplicateTransaction = () => {
    return transactions.some(transaction =>
      transaction.credited_account_name === selectedCreditedAccount?.value &&
      transaction.debited_account_name === selectedDebitedAccount?.value &&
      transaction.amount_credited === parseFloat(amountCredited) &&
      transaction.amount_debited === parseFloat(amountDebited) &&
      transaction.date_issued === dateIssued
    );
  };

  const clearForm = () => {
    setSelectedCreditedAccount(null);
    setSelectedDebitedAccount(null);
    setAmountCredited('');
    setAmountDebited('');
    setDescription('');
    setDateIssued('');
    setIsEditing(false);
    setCurrentTransactionId(null);
    setIsPopupOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountCredited || !amountDebited || isNaN(amountCredited) || isNaN(amountDebited)) {
      setSuccessMessage("Please enter valid amounts for credited and debited accounts.");
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    if (!dateIssued) {
      setSuccessMessage("Please enter a valid date.");
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    if (isDuplicateTransaction()) {
      setSuccessMessage("This transaction already exists.");
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }
    const transactionData = {
      creditedAccount: selectedCreditedAccount?.value,
      debitedAccount: selectedDebitedAccount?.value,
      amountCredited: parseFloat(amountCredited.replace(/,/g, '')),
      amountDebited: parseFloat(amountDebited.replace(/,/g, '')),
      description,
      dateIssued,
    };
    if (isEditing && !currentTransactionId) {
      console.error("Transaction ID is missing");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const response = await fetch(isEditing
        ? `${API_BASE_URL}/update-transaction/${currentTransactionId}`
        : `${API_BASE_URL}/submit-transaction`, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(transactionData),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        fetchData();
        clearForm();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit or update transaction');
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage("Failed to submit or update transaction. Please try again.");
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      const response = await fetch(`${API_BASE_URL}/delete-transaction/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatAmount = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAmountChange = (e, setAmount) => {
    const value = e.target.value.replace(/,/g, '');
    setAmount(value);
    if (setAmount === setAmountCredited) {
      setAmountDebited(value);
    } else {
      setAmountCredited(value);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.credited_account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.debited_account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="account-selection-container">
      <div className="action-buttons">
        <button onClick={() => setIsPopupOpen(true)} className="btn btn-primary">Add Transaction</button>
        <button onClick={exportToExcel} className="btn btn-secondary">Export to Excel</button>
        <div className="file-upload-container">
          <label htmlFor="file-upload" className="btn btn-tertiary">
            Import from Excel
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by account..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="transactions-table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Debited Account</th>
              <th>Credited Account</th>
              <th>Description</th>
              <th>Amount Credited</th>
              <th>Amount Debited</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
<td>{new Date(transaction.date_issued).toISOString().split('T')[0]}</td>
                  <td>{transaction.debited_account_name}</td>
                  <td>{transaction.credited_account_name}</td>
                  <td>{transaction.description}</td>
                  <td className="amount">{formatAmount(transaction.amount_credited)}</td>
                  <td className="amount">{formatAmount(transaction.amount_debited)}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(transaction)} className="btn btn-edit">Edit</button>
                    <button onClick={() => handleDelete(transaction.id)} className="btn btn-delete">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isPopupOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-btn" onClick={clearForm}>&times;</span>
            <h2>{isEditing ? 'Edit Transaction' : 'Add New Transaction'}</h2>
            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={dateIssued}
                  onChange={(e) => setDateIssued(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Debited Account:</label>
                <Select
                  value={selectedDebitedAccount}
                  onChange={(option) => setSelectedDebitedAccount(option)}
                  options={accountOptions}
                  styles={customStyles}
                  required
                />
              </div>
              <div className="form-group">
                <label>Credited Account:</label>
                <Select
                  value={selectedCreditedAccount}
                  onChange={(option) => setSelectedCreditedAccount(option)}
                  options={accountOptions}
                  styles={customStyles}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Amount Credited:</label>
                <input
                  type="text"
                  value={formatAmount(amountCredited)}
                  onChange={(e) => handleAmountChange(e, setAmountCredited)}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount Debited:</label>
                <input
                  type="text"
                  value={formatAmount(amountDebited)}
                  onChange={(e) => handleAmountChange(e, setAmountDebited)}
                  className="form-control"
                  required
                  readOnly
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={clearForm} className="btn btn-cancel">Cancel</button>
                <button type="submit" className="btn btn-submit">
                  {isEditing ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSelection;
