import React, { useState, useEffect } from 'react';
import './AccountSelection.css';

const AccountSelection = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedCreditedAccount, setSelectedCreditedAccount] = useState(null);
  const [selectedDebitedAccount, setSelectedDebitedAccount] = useState(null);
  const [amountCredited, setAmountCredited] = useState('');
  const [amountDebited, setAmountDebited] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);

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

        const transactionsResponse = await fetch('http://127.0.0.1:5000/get-transactions', { headers });
        const data = await transactionsResponse.json();
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (transaction) => {
    console.log("Editing transaction:", transaction);

    setSelectedCreditedAccount(transaction.credited_account_name);
    setSelectedDebitedAccount(transaction.debited_account_name);
    setAmountCredited(transaction.amount_credited);
    setAmountDebited(transaction.amount_debited);
    setDescription(transaction.description);
    setCurrentTransactionId(transaction.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the inputs before submitting
    if (!amountCredited || !amountDebited || isNaN(amountCredited) || isNaN(amountDebited)) {
      setSuccessMessage("Please enter valid amounts for credited and debited accounts.");
      setTimeout(() => setSuccessMessage(''), 3000);  // Clear message after 3 seconds
      return;
    }

    const transactionData = {
      creditedAccount: selectedCreditedAccount,
      debitedAccount: selectedDebitedAccount,
      amountCredited: parseFloat(amountCredited), // Convert to float
      amountDebited: parseFloat(amountDebited),   // Convert to float
      description,
    };

    // If editing, make sure to include the 'id' of the transaction
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
        setSuccessMessage(data.message);  // Display success message
        setIsEditing(false);  // Reset editing state
        setCurrentTransactionId(null); // Clear current transaction ID

        const updatedTransactions = isEditing
          ? transactions.map((transaction) =>
              transaction.id === currentTransactionId ? { ...transaction, ...transactionData } : transaction
            )
          : [...transactions, data.transaction];

        setTransactions(updatedTransactions);
      } else {
        throw new Error('Failed to submit or update transaction');
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccessMessage("Failed to submit or update transaction. Please try again.");
      setTimeout(() => setSuccessMessage(''), 3000);  // Clear message after 3 seconds
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/delete-transaction/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message);  // Display success message
        const updatedTransactions = transactions.filter(t => t.id !== id);
        setTransactions(updatedTransactions);
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
          <select
            value={selectedCreditedAccount}
            onChange={(e) => setSelectedCreditedAccount(e.target.value)}
            className="form-select"
          >
            <option value="">Select a credited account</option>
            {accounts.map((account) =>
              account.subaccounts.map((subaccount) => (
                <option key={subaccount.id} value={subaccount.name}>
                  {subaccount.name} ({account.type})
                </option>
              ))
            )}
          </select>

          <label className="form-label">Debited Account</label>
          <select
            value={selectedDebitedAccount}
            onChange={(e) => setSelectedDebitedAccount(e.target.value)}
            className="form-select"
          >
            <option value="">Select a debited account</option>
            {accounts.map((account) =>
              account.subaccounts.map((subaccount) => (
                <option key={subaccount.id} value={subaccount.name}>
                  {subaccount.name} ({account.type})
                </option>
              ))
            )}
          </select>
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
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.credited_account_name}</td>
              <td>{transaction.debited_account_name}</td>
              <td>{transaction.amount_credited}</td>
              <td>{transaction.amount_debited}</td>
              <td>{transaction.description}</td>
              <td>
                <button onClick={() => handleEdit(transaction)}>Edit</button>
                <button onClick={() => handleDelete(transaction.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountSelection;
