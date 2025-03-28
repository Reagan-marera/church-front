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
      const response = await fetch('https://church.boogiecoin.com/trial-balance', {
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
      setTrialBalance(data.trial_balance); // Set the trial balance data directly
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  // Helper function to format numbers with commas and two decimal places
  const formatNumber = (value) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            <th className="numeric-header">Dr</th>
            <th className="numeric-header">Cr</th>
          </tr>
        </thead>
        <tbody>
          {trialBalance.map((account, index) => {
            const isDebit = account.balance >= 0; // Positive balance goes to Dr
            const drValue = isDebit ? account.balance : 0; // Dr column gets balance if positive
            const crValue = !isDebit ? Math.abs(account.balance) : 0; // Cr column gets abs(balance) if negative

            return (
              <tr key={account.account}>
                <td className="account-cell">{account.account}</td>
                <td className="numeric-cell">{formatNumber(drValue)}</td>
                <td className="numeric-cell">{formatNumber(crValue)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="total-label"><strong>Total</strong></td>
            <td className="total-value">
              {formatNumber(
                trialBalance.reduce((total, account) => total + (account.balance >= 0 ? account.balance : 0), 0)
              )}
            </td>
            <td className="total-value">
              {formatNumber(
                trialBalance.reduce((total, account) => total + (account.balance < 0 ? Math.abs(account.balance) : 0), 0)
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TrialBalance;