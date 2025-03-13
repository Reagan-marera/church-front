import React, { useState, useEffect } from 'react';
import './trialbalance.css';

const TrialBalance = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trial balance data from the backend
  const fetchTrialBalance = async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve auth token (if required)
      const response = await fetch('http://127.0.0.1:5000/trial-balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Include token if authentication is required
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial balance data');
      }

      const data = await response.json(); // Expecting an array of trial balance data
      setTrialBalance(data); // Set the trial balance data directly
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  // Group accounts by parent account (assuming no parent-child hierarchy in the current data)
  const groupedByParentAccount = trialBalance.reduce((acc, account) => {
    const parentAccount = 'Uncategorized'; // Default grouping since no parent-child hierarchy exists
    if (!acc[parentAccount]) {
      acc[parentAccount] = [];
    }
    acc[parentAccount].push(account);
    return acc;
  }, {});

  // Helper function to format numbers with commas and two decimal places
  const formatNumber = (value) => {
    return value > 0 ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="trial-balance-container">
      <h1>Trial Balance</h1>
      <table className="trial-balance-table">
        <thead>
          <tr>
            <th className="account-header">Account</th>
            <th className="numeric-header">Debit</th>
            <th className="numeric-header">Credit</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(groupedByParentAccount).map((parentAccount) => {
            const subAccounts = groupedByParentAccount[parentAccount];

            return subAccounts.map((account, index) => (
              <tr key={account.Account}>
                <td className="account-cell">{account.Account}</td>
                <td className="numeric-cell">{formatNumber(account.Debit)}</td>
                <td className="numeric-cell">{formatNumber(account.Credit)}</td>
              </tr>
            ));
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="total-label"><strong>Total</strong></td>
            <td className="total-value">
              {formatNumber(trialBalance.reduce((total, account) => total + account.Debit, 0))}
            </td>
            <td className="total-value">
              {formatNumber(trialBalance.reduce((total, account) => total + account.Credit, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TrialBalance;