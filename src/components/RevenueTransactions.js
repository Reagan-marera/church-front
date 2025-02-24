import React, { useEffect, useState } from 'react';

const RevenueTransactions = () => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchAccount, setSearchAccount] = useState('');

  useEffect(() => {
    // Fetch data from the /revenuetransactions route
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/revenuetransactions');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        // Combine and normalize data
        const combined = [
          ...data.cash_receipts.map((cr) => ({
            type: 'Cash Receipt',
            date: cr.receipt_date,
            reference: cr.receipt_no,
            from: cr.from_whom_received,
            description: cr.description,
            credited_account: cr.account_credited,
            parent_account: cr.parent_account, // Include parent account
            dr_amount: 0, // No DR amount for cash receipt
            cr_amount: cr.total || 0, // All amounts are in CR, ensure it's a number
          })),
          ...data.invoices_issued.map((inv) => ({
            type: 'Invoice Issued',
            date: inv.date_issued,
            reference: inv.invoice_number,
            from: inv.name,
            description: inv.description,
            credited_account: inv.account_credited,
            parent_account: inv.parent_account, // Include parent account
            dr_amount: 0, // No DR amount for invoices issued
            cr_amount: inv.amount || 0, // All amounts are in CR, ensure it's a number
          })),
          ...data.transactions.map((txn) => ({
            type: 'Transaction',
            date: txn.date_issued,
            reference: txn.id,
            from: txn.debited_account_name,
            description: txn.description,
            credited_account: txn.credited_account_name,
            parent_account: txn.parent_account, // Include parent account
            dr_amount: 0, // No DR amount for transactions
            cr_amount: txn.amount_debited || 0, // All amounts are in CR, ensure it's a number
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

  // Handle search by account
  const handleSearch = (e) => {
    const account = e.target.value;
    setSearchAccount(account);

    if (account) {
      const filtered = combinedData.filter((item) =>
        item.credited_account.toLowerCase().includes(account.toLowerCase()) ||
        item.parent_account.toLowerCase().includes(account.toLowerCase()) // Include parent account in search
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData); // Reset to all data if search is empty
    }
  };
// Calculate total DR and CR amounts
const totalDR = filteredData.reduce((sum, item) => sum + (Number(item.dr_amount) || 0), 0);
const totalCR = filteredData.reduce((sum, item) => sum + (Number(item.cr_amount) || 0), 0);
const closingBalance = totalCR - totalDR; // Closing balance calculation


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
      <h1 style={styles.header}>Revenue Transactions</h1>

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
            <th>DR Amount</th>
            <th>CR Amount</th>
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
              <td>{item.credited_account}</td>
              <td>{item.parent_account}</td>
              <td>{formatNumber(item.dr_amount)}</td> {/* DR Amount */}
              <td>{formatNumber(item.cr_amount)}</td> {/* CR Amount */}
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

export default RevenueTransactions;