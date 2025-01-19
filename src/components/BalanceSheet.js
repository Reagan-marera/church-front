import React, { useState, useEffect } from 'react';
import './BalanceSheet.css';  // Importing styles

const BalanceSheet = ({ token }) => {
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalanceSheet = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get_balance_sheet', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error fetching balance sheet data');
        }

        const data = await response.json();
        setBalanceSheetData(data.data);
      } catch (err) {
        setError('Error fetching balance sheet data');
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceSheet();
  }, [token]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const { assets, liabilities, equity, balance_check, details } = balanceSheetData;

  return (
    <div className="balance-sheet-container">
      <h1>Balance Sheet</h1>

      <div className="summary">
        <div className="summary-item">
          <h3>Total Assets</h3>
          <p>{assets.toFixed(2)}</p>
        </div>
        <div className="summary-item">
          <h3>Total Liabilities</h3>
          <p>{liabilities.toFixed(2)}</p>
        </div>
        <div className="summary-item">
          <h3>Total Equity</h3>
          <p>{equity.toFixed(2)}</p>
        </div>
      </div>

      <div className="balance-check">
        <h4>Balance Check</h4>
        <p>{balance_check ? 'Assets = Liabilities + Equity' : 'Mismatch in balance'}</p>
      </div>

      <h2>Account Details</h2>
      <table className="balance-sheet-table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
            <th>Account Type</th>
          </tr>
        </thead>
        <tbody>
          {details.map((account, index) => (
            <tr key={index}>
              <td>{account.account_name}</td>
              <td>{account.debit.toFixed(2)}</td>
              <td>{account.credit.toFixed(2)}</td>
              <td>{account.balance.toFixed(2)}</td>
              <td>{account.account_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BalanceSheet;
