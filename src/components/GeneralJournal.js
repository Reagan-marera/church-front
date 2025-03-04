import React, { useState, useEffect } from 'react';
import Select from 'react-select'; // Import react-select
import './AccountSelection.css';

const AccountSelection = () => {
  const [accounts, setAccounts] = useState([]);
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
  const [accountOptions, setAccountOptions] = useState([]); // Options for react-select

  // Custom styles for react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#e2e8f0' : 'white', // Background color on hover
      color: state.isSelected ? '#4a5568' : 'black', // Text color for selected option
      padding: '10px',
      fontWeight: state.inputValue && state.label.toLowerCase().includes(state.inputValue.toLowerCase()) ? 'bold' : 'normal', // Bold matching options
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("User is not authenticated");
        }

        const headers = { Authorization: `Bearer ${token}` };

        const chartOfAccountsResponse = await fetch('http://127.0.0.1:5000/chart-of-accounts', { headers });
        const customersResponse = await fetch('http://127.0.0.1:5000/customer', { headers });
        const payeesResponse = await fetch('http://127.0.0.1:5000/payee', { headers });

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

        setAccounts(allAccounts);

        // Prepare options for react-select
        const options = allAccounts.flatMap(account =>
          account.subaccounts.map(subaccount => ({
            value: subaccount.name,
            label: subaccount.name,
            type: account.type, // Add account type for color coding
          }))
        );
        setAccountOptions(options);

        const transactionsResponse = await fetch('http://127.0.0.1:5000/get-transactions', { headers });
        const data = await transactionsResponse.json();

        const validTransactions = Array.isArray(data.transactions) ? data.transactions.filter(t => t) : [];
        setTransactions(validTransactions);
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (transaction) => {
    if (transaction) {
      setSelectedCreditedAccount({ value: transaction.credited_account_name, label: transaction.credited_account_name });
      setSelectedDebitedAccount({ value: transaction.debited_account_name, label: transaction.debited_account_name });
      setAmountCredited(transaction.amount_credited || '');
      setAmountDebited(transaction.amount_debited || '');
      setDescription(transaction.description || '');
      setDateIssued(transaction.date_issued || '');
      setCurrentTransactionId(transaction.id);
      setIsEditing(true);
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
      amountCredited: parseFloat(amountCredited),
      amountDebited: parseFloat(amountDebited),
      description,
      dateIssued,
    };

    if (isEditing && !currentTransactionId) {
      console.error("Transaction ID is missing");
      return;
    }

    try {
      const response = await fetch(isEditing
        ? `http://127.0.0.1:5000/update-transaction/${currentTransactionId}`
        : 'http://127.0.0.1:5000/submit-transaction', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);

        if (isEditing) {
          // Update the existing transaction in the state
          setTransactions(transactions.map(transaction =>
            transaction.id === currentTransactionId ? { ...transaction, ...transactionData } : transaction
          ));
        } else {
          // Add the new transaction to the state
          setTransactions([...transactions, { id: data.transactionId, ...transactionData }]);
        }

        clearForm();
      } else {
        throw new Error('Failed to submit or update transaction');
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage("Failed to submit or update transaction. Please try again.");
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/delete-transaction/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);
        // Remove the deleted transaction from the state
        setTransactions(transactions.filter(t => t.id !== id));
      } else {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="account-selection-container">
      <h2 className="form-title">Account Transaction</h2>
      {successMessage && <div className="success-message">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="form-label">Credited Account</label>
          <Select
            value={selectedCreditedAccount}
            onChange={(selectedOption) => setSelectedCreditedAccount(selectedOption)}
            options={accountOptions}
            placeholder="Select a credited account"
            isSearchable
            styles={customStyles} // Apply custom styles
          />
        </div>

        <div className="form-field">
          <label className="form-label">Debited Account</label>
          <Select
            value={selectedDebitedAccount}
            onChange={(selectedOption) => setSelectedDebitedAccount(selectedOption)}
            options={accountOptions}
            placeholder="Select a debited account"
            isSearchable
            styles={customStyles} // Apply custom styles
          />
        </div>

        <div className="form-field">
          <label className="form-label">Amount Credited</label>
          <input
            type="number"
            value={amountCredited}
            onChange={(e) => setAmountCredited(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Amount Debited</label>
          <input
            type="number"
            value={amountDebited}
            onChange={(e) => setAmountDebited(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Date </label>
          <input
            type="date"
            value={dateIssued}
            onChange={(e) => setDateIssued(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            placeholder="Add a description (optional)"
          />
        </div>

        <div>
          <button type="submit" className="form-button">
            {isEditing ? 'Update Transaction' : 'Submit Transaction'}
          </button>
        </div>
      </form>

      <h3 className="form-title">Transaction History</h3>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Credited Account</th>
            <th>Debited Account</th>
            <th>Amount Credited</th>
            <th>Amount Debited</th>
            <th>Date </th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? transactions.map((transaction) => (
            transaction?.id ? (
              <tr key={transaction?.id}>
                <td>{transaction?.credited_account_name || "N/A"}</td>
                <td>{transaction?.debited_account_name || "N/A"}</td>
                <td>{transaction?.amount_credited || "0"}</td>
                <td>{transaction?.amount_debited || "0"}</td>
                <td>{transaction?.date_issued || "N/A"}</td>
                <td>{transaction?.description || "N/A"}</td>
                <td>
                  <button onClick={() => handleEdit(transaction)}>Edit</button>
                  <button onClick={() => handleDelete(transaction?.id)}>Delete</button>
                </td>
              </tr>
            ) : null
          )) : (
            <tr>
              <td colSpan="7">No transactions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AccountSelection;