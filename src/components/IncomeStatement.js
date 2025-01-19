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

  return (
    <div className="financial-report">
      {loading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
      {error && <div className="error-message">Error: {error}</div>}
      {!loading && !error && incomeStatement && (
        <div className="content">
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
                  <th>Account Type</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {incomeStatement.details.map((account, index) => (
                  <tr key={index}>
                    <td>{account.account_name}</td>
                    <td>{account.account_type}</td>
                    <td>{account.debit}</td>
                    <td>{account.credit}</td>
                    <td>{account.balance}</td>
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

export default IncomeStatementComponent;
