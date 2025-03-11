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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

        // Refetch transactions to update the table
        fetchData();

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
        // Refetch transactions to update the table
        fetchData();
      } else {
        throw new Error('Failed to delete transaction');
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

  const filteredTransactions = transactions.filter(transaction =>
    transaction.credited_account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.debited_account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <button onClick={() => setIsPopupOpen(true)}>Add Transaction</button>
      <input
        type="text"
        placeholder="Search by account..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input-field"
      />
      {successMessage && <p>{successMessage}</p>}
      <table>
        <thead>
          <tr>
          <th>Date </th>

            <th>Debited Account</th>
            <th>Credited Account</th>
            <th>Description</th>

            <th>Amount Credited</th>
            <th>Amount Debited</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.id}>
                            <td>{transaction.date_issued}</td>

              <td>{transaction.debited_account_name}</td>
              <td>{transaction.credited_account_name}</td>
              <td>{transaction.description}</td>

              <td>{formatAmount(transaction.amount_credited)}</td>
              <td>{formatAmount(transaction.amount_debited)}</td>
              <td>
                <button onClick={() => handleEdit(transaction)}>Edit</button>
                <button onClick={() => handleDelete(transaction.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isPopupOpen && (
        <div className="popup">
          <div className="popup-content">
            <span className="close" onClick={clearForm}>&times;</span>
            <form onSubmit={handleSubmit}>
            <div>
                <label>Date:</label>
                <input
                  type="date"
                  value={dateIssued}
                  onChange={(e) => setDateIssued(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label>Debited Account:</label>
                <Select
                  value={selectedDebitedAccount}
                  onChange={(option) => setSelectedDebitedAccount(option)}
                  options={accountOptions}
                  styles={customStyles}
                />
              </div>
              <div>
                <label>Credited Account:</label>
                <Select
                  value={selectedCreditedAccount}
                  onChange={(option) => setSelectedCreditedAccount(option)}
                  options={accountOptions}
                  styles={customStyles}
                />
              </div>
              <div>
                <label>Description:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label>Amount Credited:</label>
                <input
                  type="text"
                  value={formatAmount(amountCredited)}
                  onChange={(e) => handleAmountChange(e, setAmountCredited)}
                  className="input-field"
                />
              </div>
              <div>
                <label>Amount Debited:</label>
                <input
                  type="text"
                  value={formatAmount(amountDebited)}
                  onChange={(e) => handleAmountChange(e, setAmountDebited)}
                  className="input-field"
                  readOnly
                />
              </div>
            
           
              <button type="submit">{isEditing ? 'Update' : 'Submit'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSelection;
