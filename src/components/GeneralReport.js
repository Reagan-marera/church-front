import React, { useState, useEffect } from 'react';
import './FinancialReportComponent.css'; // Import your CSS styles

const FinancialReportComponent = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentAccount, setSelectedParentAccount] = useState('');
  const token = 'your-token-here'; // Replace with your actual token

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get_debited_credited_accounts', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }

        const data = await response.json();
        console.log("Fetched Data:", data);

        const accountArray = data.data || [];
        setReportData(accountArray);
        setFilteredData(accountArray); // Initially display all data
      } catch (error) {
        setError(error.message);
        console.error('Error fetching general report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [token]);

  // Format numbers as currency with commas
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KSH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle search for credit/debit accounts (transaction search)
  const handleSearchChange = (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);
    filterData(searchTerm, selectedParentAccount); // Apply both searches (parent + transaction)
  };

  // Handle selection of parent account from dropdown
  const handleParentAccountSelect = (event) => {
    const parentSearchTerm = event.target.value;
    setSelectedParentAccount(parentSearchTerm);
    filterData(searchTerm, parentSearchTerm); // Apply both searches (parent + transaction)
  };

  // Filter data based on both search terms
  const filterData = (searchTerm, parentSearchTerm) => {
    let filtered = reportData;

    // Filter by transaction details (if there is a search term)
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          (item.account_name && item.account_name.toLowerCase().includes(lowerSearchTerm)) ||
          (item.account_credited && item.account_credited.toLowerCase().includes(lowerSearchTerm)) ||
          (item.account_debited && item.account_debited.toLowerCase().includes(lowerSearchTerm)) ||
          (item.description && item.description.toLowerCase().includes(lowerSearchTerm)) ||
          (item.opening_balance && String(item.opening_balance).toLowerCase().includes(lowerSearchTerm)) ||
          (item.type && item.type.toLowerCase().includes(lowerSearchTerm))
        );
      });
    }

    // Filter by parent account if there is a parent search term
    if (parentSearchTerm) {
      filtered = filtered.filter(item => 
        item.parent_account && item.parent_account.toLowerCase().includes(parentSearchTerm.toLowerCase())
      );
    }

    // Set filtered data
    setFilteredData(filtered);
  };

  // Function to parse amounts from KSH format (e.g., "KSH 1,000,000") to numbers
  const parseAmount = (amount) => {
    if (typeof amount === 'string') {
      // Remove "KSH" and commas, then convert to a number
      const numericValue = parseFloat(amount.replace(/KSH|,/g, '').trim());
      return isNaN(numericValue) ? 0 : numericValue;
    }
    return 0;
  };
  

const calculateClosingBalance = (accountData) => {
  if (accountData.length === 0) {
    return 0;
  }

  // Handle the opening balance only once (taking the first occurrence)
  const openingBalance = accountData.reduce((sum, item) => {
    const openingBalanceValue = item.opening_balance || item.amount;
    const parsedOpeningBalance = parseAmount(openingBalanceValue || 0);
    console.log("Parsed Opening Balance:", parsedOpeningBalance);
    return sum + parsedOpeningBalance;
  }, 0);

  // Calculate the totals for debits (Receipts), credits (Disbursements), and invoices
  const totalDR = calculateTotal(accountData, 'Receipt');
  const totalCR = calculateTotal(accountData, 'Disbursement');
  
  console.log("Total DR (Receipts):", totalDR);
  console.log("Total CR (Disbursements):", totalCR);

  // Invoices are 0 in your case, so let's ignore them.
  const totalInvoicesIssued = 0;
  const totalInvoicesReceived = 0;

  // Closing balance formula
  const closingBalance = openingBalance + totalDR - totalCR - totalInvoicesIssued - totalInvoicesReceived;
  console.log("Calculated Closing Balance:", closingBalance);

  return closingBalance;
};

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




  
  const renderTransactionDetails = (item) => {
    const {
      date,
      account_name,
      account_type,
      invoice_type,
      total_amount,
      sub_account,
      type,
      to_whom_paid,
      from_whom_received,
      description,
      opening_balance,
      amount
    } = item;

    const accountOpeningBalance = Number(opening_balance || amount || 0);

    const formatDate = (dateString) => {
      if (!dateString) return 'No Date';

      const date = new Date(dateString);
      if (isNaN(date)) return 'Invalid Date';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const drAmount = type === 'Receipt' ? formatCurrency(total_amount) : '';
    const crAmount = type === 'Disbursement' ? formatCurrency(total_amount) : '';
    const invoiceAmount = invoice_type === 'Invoice Issued' ? formatCurrency(total_amount) : '';
    const invoiceReceivedAmount = invoice_type === 'Invoice Received' ? formatCurrency(total_amount) : '';

    return (
      <tr key={item.id || Math.random()}>
        <td>{formatDate(date) || 'No Date'}</td>
        <td>{account_type || sub_account || ''}</td>
        <td>{invoice_type ||  ''}</td>
        <td>{account_name || sub_account || ''}</td>
        <td>{to_whom_paid || from_whom_received || 'No Payee'}</td>
        <td>{description || ''}</td>
        <td>{drAmount || '0.00'}</td>
        <td>{crAmount || '0.00'}</td>
        <td>{invoiceAmount || invoiceReceivedAmount || '0.00'}</td>
        <td>{formatCurrency(accountOpeningBalance) || '0.00'}</td>
      </tr>
    );
  };

  const renderParentAccount = (parentAccount) => {
    const associatedData = filteredData.filter(item => item.parent_account === parentAccount);
    
    // Calculate totals for DR, CR, and Invoices
    const totalDR = calculateTotal(associatedData, 'Receipt');
    const totalCR = calculateTotal(associatedData, 'Disbursement');
    const totalInvoicesIssued = calculateTotal(associatedData, 'Invoice Issued');
    const totalInvoicesReceived = calculateTotal(associatedData, 'Invoice Received');
    
    const closingBalance = calculateClosingBalance(associatedData);

    return (
      <div key={parentAccount}>
        <h4>{parentAccount || 'Parent Account'}</h4>
        <table className="financial-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account Type</th>
              <th>Invoice Type</th>
              <th>Account Class</th>
              <th>Payee/Receiver</th>
              <th>Description</th>
              <th>DR</th>
              <th>CR</th>
              <th>Invoice Amount</th>
              <th>Opening Balance</th>
            </tr>
          </thead>
          <tbody>
            {associatedData.map(renderTransactionDetails)}

            {/* Parent Account Totals */}
            <tr className="closing-balance-row">
              <td colSpan="5"><strong>Total DR (Receipt)</strong></td>
              <td colSpan="2"><strong>{formatCurrency(totalDR) || '0.00'}</strong></td>
            </tr>
            <tr className="closing-balance-row">
              <td colSpan="5"><strong>Total CR (Disbursement)</strong></td>
              <td colSpan="2"><strong>{formatCurrency(totalCR) || '0.00'}</strong></td>
            </tr>
            <tr className="closing-balance-row">
              <td colSpan="5"><strong>Total Invoices Issued</strong></td>
              <td colSpan="2"><strong>{formatCurrency(totalInvoicesIssued) || '0.00'}</strong></td>
            </tr>
            <tr className="closing-balance-row">
              <td colSpan="5"><strong>Total Invoices Received</strong></td>
              <td colSpan="2"><strong>{formatCurrency(totalInvoicesReceived) || '0.00'}</strong></td>
            </tr>
            <tr className="closing-balance-row">
              <td colSpan="5"><strong>Closing Balance</strong></td>
              <td colSpan="2"><strong>{formatCurrency(closingBalance) || '0.00'}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Get unique parent accounts
  const getUniqueParentAccounts = () => {
    const parentAccounts = filteredData.map(item => item.parent_account).filter(Boolean);
    return [...new Set(parentAccounts)];
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
          <h2 className="section-title">Financial Report</h2>

          {/* Parent Account Dropdown */}
          <div className="search-container">
            <select
              value={selectedParentAccount}
              onChange={handleParentAccountSelect}
              className="parent-account-select"
            >
              <option value="">Select Parent Account</option>
              {getUniqueParentAccounts().map((parentAccount) => (
                <option key={parentAccount} value={parentAccount}>
                  {parentAccount}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar for Transactions (DR/CR) */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search Credit/Debit Accounts"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Render Parent Accounts */}
          <div>
            {getUniqueParentAccounts().map((parentAccount) => renderParentAccount(parentAccount))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReportComponent;
