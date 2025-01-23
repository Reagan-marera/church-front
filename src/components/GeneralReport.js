import React, { useState, useEffect } from 'react';
import './FinancialReportComponent.css'; // Import your CSS styles

const FinancialReportComponent = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parentFilter, setParentFilter] = useState(''); // For filtering by parent account
  const token = 'your-token-here'; // Replace with your actual token

  // Fetch all accounts and transactions
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
        console.log("Fetched Data:", data); // Log the fetched data for debugging
        const accountArray = data.data || [];
        setReportData(accountArray);
        setFilteredData(accountArray); // Initially display all data
      })
      .catch((error) => {
        setError(error.message);
        console.error('Error fetching general report:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Format date properly (Handle invalid date gracefully)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString('en-GB') : ''; // Only format if it's a valid date
  };

  // Handle filtering by parent account
  const handleParentFilterChange = (event) => {
    const selectedParent = event.target.value;
    setParentFilter(selectedParent);

    if (selectedParent === '') {
      setFilteredData(reportData);
    } else {
      setFilteredData(reportData.filter(item => item.parent_account === selectedParent));
    }
  };

  // Calculate closing balance based on account type (add for revenue, subtract for expenses)
  const calculateClosingBalance = (item) => {
    const amount = Number(item.total_amount) || 0; // Default to 0 if amount is missing
    const openingBalance = Number(item.opening_balance) || 0; // Default to 0 if opening balance is missing

    if (item.account_type === "40-Revenue") {
      return openingBalance + amount; // Revenue increases balance
    } else if (item.account_type === "50-Expenses") {
      return openingBalance - amount; // Expenses decrease balance
    } else {
      return openingBalance + amount; // For assets, liabilities, and other accounts
    }
  };

  // Render Parent Account Details and Total (Show accounts with no transactions as well)
  const renderParentAccountDetails = (parentAccount) => {
    const parentData = filteredData.filter(item => item.parent_account === parentAccount);

    // Find all accounts including those with no transactions
    const allAccounts = filteredData.filter(item => item.parent_account === parentAccount || item.parent_account === '');

    const total = parentData.reduce((acc, item) => acc + (Number(item.total_amount) || 0), 0);

    return (
      <div key={parentAccount}>
        <h4>Parent Account: {parentAccount}</h4>
        <table className="financial-table">
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Account Type</th>
              <th>Sub Account</th>
              <th>Parent Account</th>
              <th>Total Amount</th>
              <th>Opening Balance</th>
              <th>Closing Balance</th>
              <th>Transactions</th> {/* New column for transactions */}
            </tr>
          </thead>
          <tbody>
            {allAccounts.map((item, index) => {
              // Deriving account name if missing
              const accountName = item.account_name || item.account_credited || item.account_debited || 'No Name';

              return (
                <tr key={index}>
                  <td>{accountName}</td> {/* Display derived or fallback account name */}
                  <td>{item.account_type || ''}</td>
                  <td>{item.sub_account || ''}</td>
                  <td>{item.parent_account || ''}</td>
                  <td>{item.total_amount ? item.total_amount : '0'}</td>
                  <td>{item.opening_balance ? item.opening_balance : '0'}</td>
                  <td>{calculateClosingBalance(item) || '0'}</td>
                  <td>{item.type || 'No Transactions'}</td> {/* Display transaction type if available */}
                </tr>
              );
            })}
            <tr>
              <td colSpan="6">Total for {parentAccount}</td>
              <td>{total.toFixed(2) || '0.00'}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Get unique parent accounts for the filter
  const uniqueParentAccounts = [...new Set(reportData.map(item => item.parent_account))];

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
          <h2 className="section-title">Financial Report</h2>

          {/* Parent Account Filter */}
          <div className="filter-container">
            <select onChange={handleParentFilterChange} value={parentFilter}>
              <option value="">All Parent Accounts</option>
              {uniqueParentAccounts.map((parentAccount, index) => (
                <option key={index} value={parentAccount}>
                  {parentAccount}
                </option>
              ))}
            </select>
          </div>

          {/* Render Parent Account Details with Transactions */}
          <div>
            {parentFilter === '' ? (
              uniqueParentAccounts.map(renderParentAccountDetails)
            ) : (
              renderParentAccountDetails(parentFilter)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReportComponent;
