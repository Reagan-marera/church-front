import React, { useState, useEffect } from 'react';
import './FinancialReportComponent.css';

const GeneralReport = () => {
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

  // Function to format the date
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';

    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

    // Filter by account type range (10-assets to 60-expenses)
    filtered = filtered.filter(item => {
      const accountType = item.account_type;
      return (
        (accountType && 
         (parseInt(accountType.split('-')[0]) >= 10 && parseInt(accountType.split('-')[0]) <= 60))
      );
    });
    

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

  const calculateTotal = (data, type, accountType) => {
    return data.reduce((total, item) => {
      // Use Number() to parse the total_amount
      const amount = Number(item.total_amount) || 0;
  
      // Handle Liabilities separately
      if (accountType === 'Liabilities') {
        // For Liabilities:
        // - DR decreases liabilities (when paid)
        // - CR increases liabilities (when accrued)
        if (type === 'Receipt' && item.type === 'Receipt') {
          return total + amount; // DR increases Liabilities
        }
        if (type === 'Disbursement' && item.type === 'Disbursement') {
          return total + amount; // CR increases Liabilities
        }
      } else {
        // Default calculation for other account types (Assets, etc.)
        if (type === 'Receipt' && item.type === 'Receipt') {
          return total + amount; // DR increases assets
        }
        if (type === 'Disbursement' && item.type === 'Disbursement') {
          return total + amount; // CR decreases assets
        }
      }
  
      // Handling Invoices (Accrual-based):
      // Add invoice amounts to DR (for received) or CR (for issued)
      if (item.invoice_type === 'Invoice Received' && type === 'Receipt') {
        return total + amount; // Invoice Received is DR
      } else if (item.invoice_type === 'Invoice Issued' && type === 'Disbursement') {
        return total + amount; // Invoice Issued is CR
      }
  
      return total;
    }, 0);
  };

  // Function to calculate closing balance
  const calculateClosingBalance = (accountData, openingBalance, accountType) => {
    if (accountData.length === 0) {
      return openingBalance; // If no data, return the opening balance as the closing balance
    }

    const totalDR = calculateTotal(accountData, 'Receipt', accountType);
    const totalCR = calculateTotal(accountData, 'Disbursement', accountType);

    const closingBalance = openingBalance + totalDR - totalCR;
    return closingBalance;
  };

  const renderTransactionDetails = (item, accountOpeningBalance) => {
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

    // Group invoice amounts under DR (Invoice Received) or CR (Invoice Issued)
    const drAmount = (type === 'Receipt' || invoice_type === 'Invoice Received') ? formatCurrency(total_amount) : '';
    const crAmount = (type === 'Disbursement' || invoice_type === 'Invoice Issued') ? formatCurrency(total_amount) : '';

    return (
      <tr key={item.id || Math.random()}>
        <td>{formatDate(date) || 'No Date'}</td>
        <td>{account_type || sub_account || ''}</td>
        <td>{invoice_type ||  ''}</td>
        <td>{account_name || sub_account || ''}</td>
        <td>{to_whom_paid || from_whom_received || 'No Payee'}</td>
        <td>{description || ''}</td>
        <td>{drAmount || '0.00'}</td> {/* DR (Debit): Includes both Receipts and Invoice Received */}
        <td>{crAmount || '0.00'}</td> {/* CR (Credit): Includes both Disbursements and Invoice Issued */}
        <td>{''}</td> {/* Removed Invoice Amount column */}
        <td>{''}</td> {/* Opening Balance will be rendered once per parent account */}
      </tr>
    );
  };

  const renderParentAccount = (parentAccount) => {
    const associatedData = filteredData.filter(item => item.parent_account === parentAccount);

    const openingBalance = associatedData.length > 0 ? associatedData[0].opening_balance || 0 : 0;
    const accountType = associatedData.length > 0 ? associatedData[0].account_type : 'asset'; 

    // Calculate totals for DR, CR, and Invoices
    const totalDR = calculateTotal(associatedData, 'Receipt', accountType);
    const totalCR = calculateTotal(associatedData, 'Disbursement', accountType);
    const closingBalance = calculateClosingBalance(associatedData, openingBalance, accountType);

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
              <th>Opening Balance</th>
            </tr>
          </thead>
          <tbody>
            {/* Displaying the opening balance only once */}
            <tr className="opening-balance-row">
              <td colSpan="8"><strong>Opening Balance</strong></td>
              <td><strong>{formatCurrency(openingBalance)}</strong></td>
            </tr>

            {associatedData.map(item => renderTransactionDetails(item, openingBalance))}

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
          <h2 className="section-title">General Report</h2>

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

export default GeneralReport;
