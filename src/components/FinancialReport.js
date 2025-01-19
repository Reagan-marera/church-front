import React, { useState, useEffect } from 'react';
import './trialbalance.css'; // Import the CSS file for styling

const TrialBalanceComponent = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedParentAccount, setSelectedParentAccount] = useState('');
  const [parentAccounts, setParentAccounts] = useState([]);
  const token = 'your-token-here'; // Replace with your actual token

  useEffect(() => {
    // Simulate loading time (e.g., 5 seconds)
    const loaderTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Fetch trial balance data from the API
    fetch('http://127.0.0.1:5000/get_trial_balance', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch trial balance data');
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setTrialBalance(data.data); // Set the trial balance data

          // Collect distinct parent accounts (if applicable)
          const distinctParentAccounts = [
            ...new Set(data.data.map((account) => account.parent_account).filter(Boolean)),
          ];
          setParentAccounts(distinctParentAccounts);
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      })
      .catch((error) => {
        setError(error.message);
        console.error('Error fetching trial balance:', error);
      })
      .finally(() => {
        clearTimeout(loaderTimeout); // Clear the timeout when data is fetched or error occurs
        setLoading(false);
      });

    // Cleanup timeout in case the component is unmounted before the timeout finishes
    return () => clearTimeout(loaderTimeout);
  }, [token]);

  // Filter trial balance data based on the selected parent account
  const filteredTrialBalance = selectedParentAccount
    ? trialBalance.filter((account) => account.parent_account === selectedParentAccount)
    : trialBalance;

  // Ensure proper formatting of numeric values
  const formatNumber = (number) => {
    return number && !isNaN(number) ? parseFloat(number).toFixed(2) : '0.00';
  };

  // Calculate the balance based on the opening balance, debit, and credit
  const calculateBalance = (account) => {
    const openingBalance = parseFloat(account.opening_balance) || 0.0;
    const debit = parseFloat(account.debit) || 0.0;
    const credit = parseFloat(account.credit) || 0.0;

    // If balance_type is 'debit', assume it adds to the balance; otherwise, subtract it.
    const balance =
      account.balance_type === 'debit'
        ? openingBalance + debit - credit
        : openingBalance - debit + credit;

    return balance.toFixed(2);
  };

  return (
    <div className="financial-report">
      {loading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
      {error && <div className="error-message">Error: {error}</div>}
      {!loading && !error && (
        <div className="content">
          <h2 className="section-title">Trial Balance</h2>
          <div className="table-container">
            <table className="trial-balance-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Parent Account</th>
                  <th>Account Type</th> {/* Add Account Type column */}
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
                {/* Parent Account Selector in the Table */}
                <tr>
                  <td colSpan="6">
                    <div className="parent-account-selector">
                      <label htmlFor="parentAccount">Select Parent Account:</label>
                      <select
                        id="parentAccount"
                        value={selectedParentAccount}
                        onChange={(e) => setSelectedParentAccount(e.target.value)}
                      >
                        <option value="">All Parent Accounts</option>
                        {parentAccounts.map((parentAccount, index) => (
                          <option key={index} value={parentAccount}>
                            {parentAccount}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                {filteredTrialBalance.map((account, index) => (
                  <tr key={index}>
                    <td>{account.account_name}</td>
                    <td>{account.parent_account}</td> {/* Display Parent Account */}
                    <td>{account.account_type}</td> {/* Display Account Type */}
                    <td>{formatNumber(account.debit)}</td>
                    <td>{formatNumber(account.credit)}</td>
                    <td>{formatNumber(calculateBalance(account))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialBalanceComponent;
