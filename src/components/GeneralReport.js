import React, { useState, useEffect } from 'react';
import './FinancialReportComponent.css'; // Import your CSS styles

const FinancialReportComponent = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parentFilter, setParentFilter] = useState(''); // For filtering by parent account
  const [searchTerm, setSearchTerm] = useState(''); // Single search term for credited and debited accounts
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

  // Handle filtering by parent account
  const handleParentFilterChange = (event) => {
    const selectedParent = event.target.value;
    setParentFilter(selectedParent);
    filterData(selectedParent, searchTerm);
  };

  // Handle search for credited and debited accounts (single search term)
  const handleSearchChange = (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);
    filterData(parentFilter, searchTerm);
  };

  // Filter the data based on parent and search term for both credit and debit
  const filterData = (parentFilter, searchTerm) => {
    let filtered = reportData;

    if (parentFilter) {
      filtered = filtered.filter(item => item.parent_account === parentFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.account_credited && item.account_credited.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.account_debited && item.account_debited.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(filtered);
  };

  // Generalized row rendering for each transaction item
  const renderTransactionDetails = (item) => {
    const {
      date,
      account_name,
      account_type,
      parent_account,
      total_amount,
      cashbook,
      type,
      account_credited,
      account_debited,
      cheque_no,
      to_whom_paid,
      description,
    } = item;

    // Logic to display DR/CR in respective columns
    const drAmount = type === 'Receipt' ? total_amount : ''; // Show amount under DR for Receipts
    const crAmount = type === 'Disbursement' ? total_amount : ''; // Show amount under CR for Disbursements

    return (
      <tr key={item.id || Math.random()}>
        <td>{date || 'No Date'}</td>
        <td>{account_type || ''}</td>
        <td>{account_name || 'No Name'}</td>
        <td>{to_whom_paid || 'No Payee'}</td>
        <td>{description || 'No Description'}</td>
        <td>{drAmount || '0.00'}</td> {/* DR Column */}
        <td>{crAmount || '0.00'}</td> {/* CR Column */}
      </tr>
    );
  };

  // Calculate total for Receipts (credit) and Disbursements (debit)
  const calculateTotal = (data, type) => {
    return data.reduce((total, item) => {
      if (type === 'Receipt' && item.type === 'Receipt') {
        return total + (Number(item.total_amount) || 0);
      }
      if (type === 'Disbursement' && item.type === 'Disbursement') {
        return total + (Number(item.total_amount) || 0);
      }
      return total;
    }, 0);
  };

  // Render Parent Account Details and Total (Show accounts with no transactions as well)
  const renderParentAccountDetails = (parentAccount) => {
    const parentData = filteredData.filter(item => item.parent_account === parentAccount);
  
    // Find all accounts including those with no transactions
    const allAccounts = filteredData.filter(item => item.parent_account === parentAccount || item.parent_account === '');
  
    // Ensure openingBalance has a valid value (0 if not found)
    const openingBalance = allAccounts.length > 0 && allAccounts[0].opening_balance !== undefined ? allAccounts[0].opening_balance : 0;
  
    const totalReceipts = calculateTotal(allAccounts, 'Receipt');
    const totalDisbursements = calculateTotal(allAccounts, 'Disbursement');
  
    // Ensure total amounts are numbers (fallback to 0 if NaN)
    const validTotalReceipts = !isNaN(totalReceipts) ? totalReceipts : 0;
    const validTotalDisbursements = !isNaN(totalDisbursements) ? totalDisbursements : 0;
  
    // Calculate Closing Balance
    const closingBalance = openingBalance + validTotalReceipts - validTotalDisbursements;
  
    return (
      <div key={parentAccount}>
        <h4>Parent Account: {parentAccount}</h4>
        <p><strong>Opening Balance: </strong>{openingBalance.toFixed(2) || '0.00'}</p>
  
        <table className="financial-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account Type</th>
              <th>Account Class</th>
              <th>To Whom Paid</th>
              <th>Description</th>
              <th>DR</th> {/* DR Column */}
              <th>CR</th> {/* CR Column */}
            </tr>
          </thead>
          <tbody>
            {allAccounts.map(renderTransactionDetails)}
  
            {/* Totals for DR and CR */}
            <tr>
              <td colSpan="5"><strong>Total Receipt Amount</strong></td>
              <td><strong>{validTotalReceipts.toFixed(2) || '0.00'}</strong></td> {/* Total DR */}
              <td></td> {/* Empty column for CR */}
            </tr>
            <tr>
              <td colSpan="5"><strong>Total Disbursement Amount</strong></td>
              <td></td> {/* Empty column for DR */}
              <td><strong>{validTotalDisbursements.toFixed(2) || '0.00'}</strong></td> {/* Total CR */}
            </tr>
  
            {/* Closing Balance */}
            <tr className="closing-balance-row">
              <td colSpan="5"><strong>Closing Balance</strong></td>
              <td colSpan="2"><strong>{closingBalance.toFixed(2) || '0.00'}</strong></td>
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

          {/* Single Search Input for Credit/Debit Accounts */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search Credit/Debit Accounts"
              value={searchTerm}
              onChange={handleSearchChange}
            />
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
