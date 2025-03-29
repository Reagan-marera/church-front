import React, { useEffect, useState } from 'react';
import './TransactionList.css'; // Import the CSS file

const AccountsTransactions = () => {
  const [transactions, setTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token);

      if (!token) {
        setError(new Error('No token found. Please log in again.'));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('https://church.boogiecoin.com/transactions/accounts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch transactions. Please try again later.');
        }

        const data = await response.json();
        console.log('Data:', data);

        // Extract the account balances from the response
        const accountBalances = data.account_balances || [];

        // Group accounts by parent account and note number
        const groupedAccounts = groupAccountsByParentAndNote(accountBalances);

        setTransactions(groupedAccounts);
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const groupAccountsByParentAndNote = (accounts) => {
    const grouped = {};
    accounts.forEach((account) => {
      const key = `${account.parent_account || 'No Parent'}`;
      if (!grouped[key]) {
        grouped[key] = { accounts: [], total: 0 };
      }
      grouped[key].accounts.push(account);
      grouped[key].total += account.balance;
    });
    return grouped;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES', // Kenyan Shillings
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading financial data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Account Balances</h1>
      {Object.keys(transactions).length === 0 ? (
        <div className="no-data">No transactions available.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Parent Account</th>
              <th>Note Number</th>
              <th>Account</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(transactions).map(([parentAccount, { accounts, total }], index) => (
              <React.Fragment key={index}>
                <tr className="group-header">
                  <td>{parentAccount}</td>
                  <td></td>
                  <td colSpan="2"></td>
                </tr>
                {accounts && accounts.length > 0 ? (
                  accounts.map((account, idx) => (
                    <tr key={idx}>
                      <td></td>
                      <td>{account.note_number || 'N/A'}</td>
                      <td>{account.account}</td>
                      <td>{formatCurrency(account.balance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No accounts available for this parent.</td>
                  </tr>
                )}
                <tr className="group-total">
                  <td colSpan="3" style={{ color: 'orange' }}>Total for {parentAccount}</td>
                 <i><td style={{ color: 'orange' }}>{formatCurrency(total)}</td></i> 
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AccountsTransactions;
