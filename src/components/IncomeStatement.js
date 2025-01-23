import React, { useState, useEffect } from 'react';
import './incomestatement.css'; // Import the CSS file for styling

const IncomeStatementComponent = () => {
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('your-token-here'); // Replace with your actual token

  useEffect(() => {
    const loaderTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Fetch income statement data from the API
    fetch('http://127.0.0.1:5000/get_income_statement', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch income statement data');
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setIncomeStatement(data.data); // Set the income statement data
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      })
      .catch((error) => {
        setError(error.message);
        console.error('Error fetching income statement:', error);
      })
      .finally(() => {
        clearTimeout(loaderTimeout); // Clear timeout when data is fetched or error occurs
        setLoading(false);
      });

    // Cleanup timeout in case the component is unmounted before the timeout finishes
    return () => clearTimeout(loaderTimeout);
  }, [token]);

  // Group accounts by account type
  const groupedAccounts = incomeStatement?.details.reduce((groups, account) => {
    if (!groups[account.account_type]) {
      groups[account.account_type] = [];
    }
    groups[account.account_type].push(account);
    return groups;
  }, {});

  // Group accounts by parent account
  const groupedByParentAccount = (accountType) => {
    return groupedAccounts[accountType].reduce((parents, account) => {
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
      return total + parseFloat(account.balance || 0);
    }, 0).toFixed(2);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="financial-report">
      <h2 className="section-title">Income Statement</h2>

      <div className="summary">
        <p><strong>Revenue: </strong>{incomeStatement.revenue}</p>
        <p><strong>Expenses: </strong>{incomeStatement.expenses}</p>
        <p><strong>Net Income: </strong>{incomeStatement.net_income}</p>
      </div>

      <div className="table-container">
        <table className="income-statement-table">
          <thead>
            <tr>
             
              <th>Account Name</th>
             
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {/* Render accounts grouped by account type */}
            {Object.keys(groupedAccounts || {}).sort().map((accountType, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td colSpan="6" className="group-header">
                    <strong>{accountType}</strong>
                  </td>
                </tr>

                {/* Render accounts grouped by parent account */}
                {Object.keys(groupedByParentAccount(accountType)).sort().map((parentAccount, idx) => (
                  <React.Fragment key={idx}>
                    <tr>
                      <td colSpan="6" className="parent-account-header">
                        <strong>{parentAccount}</strong>
                      </td>
                    </tr>

                    {/* Render individual accounts for each parent account */}
                    {groupedByParentAccount(accountType)[parentAccount].map((account, i) => (
                      <tr key={i}>
                        
                        <td>{account.account_name}</td>
                       
                       
                        <td>{account.balance ? account.balance.toFixed(2) : '0.00'}</td>
                      </tr>
                    ))}

                    {/* Display total balance for the parent account */}
                    <tr>
                      <td colSpan="5" className="total-label">Total for {parentAccount}:</td>
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

export default IncomeStatementComponent;
