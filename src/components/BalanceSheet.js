import React, { useState, useEffect } from 'react';
import './BalanceSheet.css'; // Importing styles

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

  // Group accounts by account_type
  const groupedAccounts = details.reduce((groups, account) => {
    if (!groups[account.account_type]) {
      groups[account.account_type] = [];
    }
    groups[account.account_type].push(account);
    return groups;
  }, {});

  // Remove "Customer" and "Member" account types
  const filteredGroupedAccounts = Object.keys(groupedAccounts)
    .filter(accountType => accountType !== "Customer" && accountType !== "Member")
    .reduce((obj, accountType) => {
      obj[accountType] = groupedAccounts[accountType];
      return obj;
    }, {});

  // Group accounts by parent_account
  const groupedByParentAccount = (accountType) => {
    return filteredGroupedAccounts[accountType].reduce((parents, account) => {
      if (!parents[account.parent_account]) {
        parents[account.parent_account] = [];
      }
      parents[account.parent_account].push(account);
      return parents;
    }, {});
  };

  // Calculate the total balance for a parent account
  const calculateParentAccountTotal = (parentAccounts) => {
    return parentAccounts.reduce((total, account) => {
      return total + parseFloat(account.balance);
    }, 0).toFixed(2);
  };

  // Define account type to color mapping
  const accountTypeColors = {
    "10-asset": "#3498db",    // Blue
    "Liability": "#e74c3c", // Red
    "Equity": "#2ecc71",    // Green
    "Revenue": "#f39c12",   // Yellow
    "Expense": "#9b59b6",   // Purple
    // Add more account types and their colors if necessary
  };

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
      <div className="balance-sheet-table-container">
        <table className="balance-sheet-table">
          <thead>
            <tr>
              <th>Account Type</th>
              <th>Account Name</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {/* Render filtered accounts grouped by account type */}
            {Object.keys(filteredGroupedAccounts).sort().map((accountType, index) => (
              <React.Fragment key={index}>
                <tr
                  style={{
                    backgroundColor: accountTypeColors[accountType] || "#fff"  // Color for each account type section
                  }}
                >
                  <td colSpan="3" className="group-header">
                    <strong>{accountType}</strong>
                  </td>
                </tr>

                {/* Render accounts grouped by parent account */}
                {Object.keys(groupedByParentAccount(accountType)).sort().map((parentAccount, idx) => (
                  <React.Fragment key={idx}>
                    <tr
                      style={{
                        backgroundColor: accountTypeColors[accountType] || "#fff"  // Keep the same color for each account type
                      }}
                    >
                      <td colSpan="3" className="parent-account-header">
                        <strong>{parentAccount}</strong>
                      </td>
                    </tr>

                    {/* Render individual accounts for each parent account */}
                    {groupedByParentAccount(accountType)[parentAccount].map((account, i) => (
                      <tr
                        key={i}
                        style={{
                          backgroundColor: accountTypeColors[accountType] || "#fff"  // Maintain the same color for rows
                        }}
                      >
                        <td>{account.account_type}</td>
                        <td>{account.account_name}</td>
                        <td>{account.balance ? account.balance.toFixed(2) : '0.00'}</td>
                      </tr>
                    ))}

                    {/* Display total balance for the parent account */}
                    <tr
                      style={{
                        backgroundColor: accountTypeColors[accountType] || "#fff"  // Same color for total row
                      }}
                    >
                      <td colSpan="2" className="total-label">Total for {parentAccount}:</td>
                      <td>{calculateParentAccountTotal(groupedByParentAccount(accountType)[parentAccount])}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BalanceSheet;
