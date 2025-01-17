import React, { useState, useEffect } from 'react';
import './FinancialReportComponent.css'; // Import the CSS file for styling

const FinancialReportComponent = () => {
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({
    "10-assets": 0,
    "50-Expenses": 0,
    "40-Revenue": 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = 'your-token-here'; // Replace with your actual token

  useEffect(() => {
    fetch('http://127.0.0.1:5000/get_debited_credited_accounts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        return response.json();
      })
      .then((data) => {
        const accountArray = data.data || [];
        setReportData(accountArray);

        // Initialize totals for account types we care about
        const accountTypes = {
          "10-assets": 0,
          "50-Expenses": 0,
          "40-Revenue": 0,
        };

        // Iterate over the accounts to sum totals for each account type
        accountArray.forEach((account) => {
          const amount = Number(account.total_amount) || 0;
          const accountType = account.account_type || 'Unknown';

          // Add the amount to the respective account type if it is one of the ones we care about
          if (accountTypes.hasOwnProperty(accountType)) {
            accountTypes[accountType] += amount;
          }
        });

        setTotals(accountTypes); // Store the totals for each account type
      })
      .catch((error) => {
        setError(error.message);
        console.error('Error fetching general report:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="financial-report">
      {loading && (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      )}
      {error && <div className="error-message">Error: {error}</div>}
      {!loading && !error && (
        <div className="content">
          <h2 className="section-title">Total Financial Information</h2>
          <table className="financial-table">
            <thead>
              <tr>
                <th>Account Type</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>10-assets</td>
                <td>{totals["10-assets"].toFixed(2)}</td>
              </tr>
              <tr>
                <td>20-Liabilities</td>
                <td>{totals["20-Liabilities"] || 0}</td>
              </tr>
              <tr>
                <td>30-Equity</td>
                <td>{totals["30-Equity"] || 0}</td>
              </tr>
              <tr>
                <td>40-Revenue</td>
                <td>{totals["40-Revenue"].toFixed(2)}</td>
              </tr>
              <tr>
                <td>50-Expenses</td>
                <td>{totals["50-Expenses"].toFixed(2)}</td>
              </tr>
              <tr>
                <td>60-Cost Of Goods Sold</td>
                <td>{totals["60-Cost Of Goods Sold"] || 0}</td>
              </tr>
            </tbody>
          </table>

          {/* 10-Assets Transactions */}
          <h3 className="section-title">10-Assets Transactions</h3>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Cheque No</th>
                <th>Account Debited</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
                <th>To Whom Paid</th>
              </tr>
            </thead>
            <tbody>
              {reportData
                .filter(
                  (account) =>
                    account.account_type === "10-assets" &&
                    account.total_amount > 0
                )
                .map((account, index) => (
                  <tr key={index}>
                    <td>{account.cheque_no || "N/A"}</td>
                    <td>{account.account_debited}</td>
                    <td>{account.account_credited}</td>
                    <td>{account.total_amount}</td>
                    <td>{formatDate(account.date_issued || account.date)}</td>
                    <td>{account.to_whom_paid || "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* 50-Expenses Transactions */}
          <h3 className="section-title">50-Expenses Transactions</h3>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Cheque No</th>
                <th>Account Debited</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
                <th>To Whom Paid</th>
              </tr>
            </thead>
            <tbody>
              {reportData
                .filter(
                  (account) =>
                    account.account_type === "50-Expenses" &&
                    account.total_amount > 0
                )
                .map((account, index) => (
                  <tr key={index}>
                    <td>{account.cheque_no || "N/A"}</td>
                    <td>{account.account_debited}</td>
                    <td>{account.account_credited}</td>
                    <td>{account.total_amount}</td>
                    <td>{formatDate(account.date_issued || account.date)}</td>
                    <td>{account.to_whom_paid || "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* 40-Revenue Transactions */}
          <h3 className="section-title">40-Revenue Transactions</h3>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Account Debited</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reportData
                .filter(
                  (account) =>
                    account.account_type === "40-Revenue" &&
                    account.total_amount > 0
                )
                .map((account, index) => (
                  <tr key={index}>
                    <td>{account.account_debited}</td>
                    <td>{account.account_credited}</td>
                    <td>{account.total_amount}</td>
                    <td>{formatDate(account.date_issued || account.date)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancialReportComponent;
