import React, { useState, useEffect } from 'react';
import './FinancialReportComponent.css'; // Import the CSS file for styling

const FinancialReportComponent = () => {
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({
    assetsReceived: 0,
    assetsIssued: 0,
    revenue: 0,
    expenses: 0,
  });
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

        // Collect distinct parent accounts
        const distinctParentAccounts = [
          ...new Set(accountArray.map((account) => account.parent_account).filter(Boolean)),
        ];
        setParentAccounts(distinctParentAccounts);

        // Initialize totals for received and issued assets, revenue, and expenses
        let assetsReceived = 0;
        let assetsIssued = 0;
        let revenue = 0;
        let expenses = 0;

        // Iterate over the accounts to calculate totals based on account type
        accountArray.forEach((account) => {
          const amount = Number(account.total_amount) || 0;
          const accountType = account.account_type || 'Unknown';
          const grnNumber = account.grn_number;

          // For assets received (GRN present)
          if (accountType === "10-assets" && grnNumber) {
            assetsReceived += amount;
          }

          // For assets issued (GRN absent)
          if (accountType === "10-assets" && !grnNumber) {
            assetsIssued += amount;
          }

          // For revenue
          if (accountType === "40-Revenue") {
            revenue += amount;
          }

          // For expenses
          if (accountType === "50-Expenses") {
            expenses += amount;
          }
        });

        setTotals({
          assetsReceived,
          assetsIssued,
          revenue,
          expenses,
        });
      })
      .catch((error) => {
        setError(error.message);
        console.error('Error fetching general report:', error);
      })
      .finally(() => {
        clearTimeout(loaderTimeout); // Clear the timeout when data is fetched or error occurs
        setLoading(false);
      });

    // Cleanup timeout in case the component is unmounted before the timeout finishes
    return () => clearTimeout(loaderTimeout);
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Calculate the closing balance for each asset, revenue, and expense account
  const calculateClosingBalance = (openingBalance, receivedAssets, issuedAssets, revenue, expenses) => {
    let closingBalance = openingBalance;

    // For Assets
    closingBalance += receivedAssets;  // Add received assets
    closingBalance += issuedAssets;    // Subtract issued assets

    // For Revenue (Add to balance)
    closingBalance += revenue;

    // For Expenses (Subtract from balance)
    closingBalance -= expenses;

    return closingBalance;
  };

  // Filter report data based on selected parent account
  const filteredReportData = selectedParentAccount
    ? reportData.filter(
        (account) => account.parent_account === selectedParentAccount
      )
    : reportData;

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
          <h2 className="section-title">Total Financial Information</h2>
          <table className="financial-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Assets Received (GRN Present) */}
              <tr>
                <td>Assets Received</td>
                <td>{totals.assetsReceived.toFixed(2)}</td>
              </tr>

              {/* Assets Issued (GRN Absent) */}
              <tr>
                <td>Assets Issued</td>
                <td>{totals.assetsIssued.toFixed(2)}</td>
              </tr>

              {/* Revenue */}
              <tr>
                <td>Revenue</td>
                <td>{totals.revenue.toFixed(2)}</td>
              </tr>

              {/* Expenses */}
              <tr>
                <td>Expenses</td>
                <td>{totals.expenses.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Parent Account Selector */}
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

          {/* Transaction details */}
          <h3 className="section-title">Transaction Details</h3>

          {/* Assets Received (GRN Present) */}
          <h4>Assets Received</h4>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Cheque No</th>
                <th>Account Debited</th>
                <th>Account Class</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
                <th>To Whom Paid</th>
                <th>Parent Account</th>
                <th>GRN No.</th>
                <th>Opening Balance</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData
                .filter(
                  (account) =>
                    account.account_type === "10-assets" && account.grn_number
                )
                .map((account, index) => {
                  const receivedAssets = Number(account.total_amount) || 0;
                  const openingBalance = Number(account.opening_balance) || 0;
                  const closingBalance = calculateClosingBalance(openingBalance, receivedAssets, 0, 0, 0);

                  return (
                    <tr key={index}>
                      <td>{account.cheque_no || "N/A"}</td>
                      <td>{account.account_debited}</td>
                      <td>{account.account_class}</td>
                      <td>{account.account_credited}</td>
                      <td>{account.total_amount}</td>
                      <td>{formatDate(account.date_issued || account.date)}</td>
                      <td>{account.to_whom_paid || "N/A"}</td>
                      <td>{account.parent_account || "N/A"}</td>
                      <td>{account.grn_number || "N/A"}</td>
                      <td>{account.opening_balance || "N/A"}</td>
                      <td>{closingBalance.toFixed(2)}</td> {/* Display closing balance */}
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Assets Issued (GRN Absent) */}
          <h4>Assets Issued</h4>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Cheque No</th>
                <th>Account Debited</th>
                <th>Account Class</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
                <th>To Whom Paid</th>
                <th>Parent Account</th>
                <th>Opening Balance</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData
                .filter(
                  (account) =>
                    account.account_type === "10-assets" && !account.grn_number
                )
                .map((account, index) => {
                  const issuedAssets = Number(account.total_amount) || 0;
                  const openingBalance = Number(account.opening_balance) || 0;
                  const closingBalance = calculateClosingBalance(openingBalance, 0, issuedAssets, 0, 0);

                  return (
                    <tr key={index}>
                      <td>{account.cheque_no || "N/A"}</td>
                      <td>{account.account_debited}</td>
                      <td>{account.account_class}</td>
                      <td>{account.account_credited}</td>
                      <td>{account.total_amount}</td>
                      <td>{formatDate(account.date_issued || account.date)}</td>
                      <td>{account.to_whom_paid || "N/A"}</td>
                      <td>{account.parent_account || "N/A"}</td>
                      <td>{account.opening_balance || "0"}</td>
                      <td>{closingBalance.toFixed(2)}</td> {/* Display closing balance */}
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Revenue Transactions (40-Revenue) */}
          <h4>Revenue Transactions (40-Revenue)</h4>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Account Debited</th>
                <th>Account Class</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Parent Account</th>
                <th>Opening Balance</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData
                .filter(
                  (account) =>
                    account.account_type === "40-Revenue"
                )
                .map((account, index) => {
                  const revenue = Number(account.total_amount) || 0;
                  const openingBalance = Number(account.opening_balance) || 0;
                  const closingBalance = calculateClosingBalance(openingBalance, 0, 0, revenue, 0);

                  return (
                    <tr key={index}>
                      <td>{account.account_debited}</td>
                      <td>{account.account_class}</td>
                      <td>{account.account_credited}</td>
                      <td>{account.total_amount}</td>
                      <td>{formatDate(account.date_issued || account.date)}</td>
                      <td>{account.parent_account || "N/A"}</td>
                      <td>{account.opening_balance || "0"}</td>
                      <td>{closingBalance.toFixed(2)}</td> {/* Display closing balance */}
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Expense Transactions */}
          <h4>Expense Transactions (50-Expenses)</h4>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Cheque No</th>
                <th>Account Debited</th>
                <th>Account Class</th>
                <th>Account Credited</th>
                <th>Amount</th>
                <th>Date</th>
                <th>To Whom Paid</th>
                <th>Parent Account</th>
                <th>GRN No.</th>
                <th>Opening Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData
                .filter(
                  (account) =>
                    account.account_type === "50-Expenses"
                )
                .map((account, index) => {
                  const expenses = Number(account.total_amount) || 0;
                  const openingBalance = Number(account.opening_balance) || 0;
                  const closingBalance = calculateClosingBalance(openingBalance, 0, 0, 0, expenses);

                  return (
                    <tr key={index}>
                      <td>{account.cheque_no || "N/A"}</td>
                      <td>{account.account_debited}</td>
                      <td>{account.account_class}</td>
                      <td>{account.account_credited}</td>
                      <td>{account.total_amount}</td>
                      <td>{formatDate(account.date_issued || account.date)}</td>
                      <td>{account.to_whom_paid || "N/A"}</td>
                      <td>{account.parent_account || "N/A"}</td>
                      <td>{account.grn_number || "N/A"}</td>
                      <td>{account.opening_balance || "0"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancialReportComponent;
