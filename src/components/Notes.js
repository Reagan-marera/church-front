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
        const response = await fetch('http://127.0.0.1:5000/transactions/accounts', {
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
        setTransactions(data);
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ksh',
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
      <h1>Notes To The Financial Statements</h1>
      {Object.keys(transactions).map((note) => (
        <div key={note} className="note-group">
          <h2>Note {note}</h2>
          <table>
            <thead>
              <tr>
                <th>Parent Account</th>
                <th>Relevant Account</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions[note].relevant_accounts.map((account, index) => (
                <tr key={index}>
                  <td>{transactions[note].parent_account || 'N/A'}</td>
                  <td>{account}</td>
                  <td>{formatCurrency(transactions[note].amounts[index])}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="2"><strong>Total Amount</strong></td>
                <td><strong>{formatCurrency(transactions[note].total_amount)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default AccountsTransactions;
