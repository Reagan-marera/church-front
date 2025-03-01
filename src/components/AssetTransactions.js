import React, { useEffect, useState } from 'react';

const AssetTransactions = () => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchAccount, setSearchAccount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Retrieve the JWT token from local storage or wherever it's stored
        const token = localStorage.getItem('token');

        const response = await fetch('http://127.0.0.1:5000/assettransactions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        const combined = [
          // Cash Disbursement
          ...data.cash_disbursements.map((cd) => ({
            type: 'Cash Disbursement',
            date: cd.disbursement_date,
            reference: cd.cheque_no,
            from: cd.to_whom_paid,
            description: cd.description,
            debited_account: cd.account_debited || '', // Default to empty string if undefined
            credited_account: '',
            parent_account: cd.parent_account || '', // Default to empty string if undefined
            amount: cd.total,
            dr: cd.total, // Use DR for Cash Disbursement
            cr: 0,
          })),

          // Invoice Received
          ...data.invoices_received.map((inv) => ({
            type: 'Invoice Received',
            date: inv.date_issued,
            reference: inv.invoice_number,
            from: inv.name,
            description: inv.description,
            debited_account: inv.account_debited || '', // Default to empty string if undefined
            credited_account: '',
            parent_account: inv.parent_account || '', // Default to empty string if undefined
            amount: inv.amount,
            dr: inv.amount, // Use DR for Invoice Received
            cr: 0,
          })),

          // Invoice Issued
          ...data.invoices_issued.map((inv) => ({
            type: 'Invoice Issued',
            date: inv.date_issued,
            reference: inv.invoice_number,
            from: inv.name,
            description: inv.description,
            debited_account: '',
            credited_account: inv.account_credited || '', // Default to empty string if undefined
            parent_account: inv.parent_account || '', // Default to empty string if undefined
            amount: inv.amount,
            cr: 0,
            dr: inv.amount, // Use CR for Invoice Issued
          })),

          // Cash Receipt
          ...data.cash_receipts.map((cr) => ({
            type: 'Cash Receipt',
            date: cr.receipt_date,
            reference: cr.receipt_no,
            from: cr.from_whom_received,
            description: cr.description,
            debited_account: '',
            credited_account: cr.account_credited || '', // Default to empty string if undefined
            parent_account: cr.parent_account || '', // Default to empty string if undefined
            amount: cr.total,
            dr: 0,
            cr: cr.total, // Use CR for Cash Receipt
          })),

          // Transactions
          ...data.transactions.map((txn) => ({
            type: 'Transaction',
            date: txn.date_issued,
            reference: txn.id,
            from: txn.debited_account_name || txn.credited_account_name || '', // Default to empty string if undefined
            description: txn.description,
            debited_account: txn.debited_account_name || '', // Default to empty string if undefined
            credited_account: txn.credited_account_name || '', // Default to empty string if undefined
            parent_account: txn.parent_account || '', // Default to empty string if undefined
            amount: txn.amount_debited || txn.amount_credited || 0, // Default to 0 if undefined
            dr: txn.amount_debited || 0, // Use DR for Transactions
            cr:0, // Use CR for Transactions
          })),
        ];

        setCombinedData(combined);
        setFilteredData(combined); // Initialize filtered data with all data
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    const account = e.target.value;
    setSearchAccount(account);

    if (account) {
      const filtered = combinedData.filter((item) =>
        item.debited_account.toLowerCase().includes(account.toLowerCase()) ||
        item.credited_account.toLowerCase().includes(account.toLowerCase()) ||
        item.parent_account.toLowerCase().includes(account.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData); // Reset to all data if search is empty
    }
  };

  // Calculate total amounts for DR and CR
  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const totalDR = filteredData.reduce((sum, item) => sum + (item.dr || 0), 0);
  const totalCR = filteredData.reduce((sum, item) => sum + (item.cr || 0), 0);
  const closingBalance = totalDR - totalCR; // Calculate closing balance

  const formatNumber = (num) => {
    if (num === 0 || !num) return "0.00";
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Asset Transactions</h1>

      {/* Search by Account */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by account or parent account..."
          value={searchAccount}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>

      {/* Display Combined Data in One Table */}
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Type</th>
            <th>Date</th>
            <th>Reference</th>
            <th>From</th>
            <th>Description</th>
            <th>Account</th>
            <th>Parent Account</th>
            <th>DR</th>
            <th>CR</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
              <td>{item.type}</td>
              <td>{item.date}</td>
              <td>{item.reference}</td>
              <td>{item.from}</td>
              <td>{item.description}</td>
              <td>{item.credited_account || item.debited_account}</td>
              <td>{item.parent_account}</td>
              <td>{formatNumber(item.dr)}</td>
              <td>{formatNumber(item.cr)}</td>
              <td>{formatNumber(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display Total Amounts and Closing Balance */}
      <div style={styles.totalAmount}>
        <div>Total DR: {formatNumber(totalDR)}</div>
        <div>Total CR: {formatNumber(totalCR)}</div>
        <div style={{ fontWeight: 'bold', marginTop: '10px' }}>
          Closing Balance: {formatNumber(closingBalance)}
        </div>
      </div>
    </div>
  );
};

// Styling
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f4f6f9', // Light gray background
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    fontFamily: 'Georgia, serif',
    color: '#003366', // Darker blue for header
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  searchInput: {
    padding: '10px',
    width: '300px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#003366', // Dark blue header
    color: 'black',
    textAlign: 'left',
    fontWeight: 'bold',
    padding: '12px 15px',
  },
  evenRow: {
    backgroundColor: '#f7f7f7',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  totalAmount: {
    marginTop: '20px',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textAlign: 'right',
    color: '#003366', // Dark blue for total
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#007BFF',
  },
  error: {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#FF0000',
  },
};

export default AssetTransactions;
