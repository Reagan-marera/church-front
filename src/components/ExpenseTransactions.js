import React, { useEffect, useState } from 'react';

const ExpenseTransactions = () => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchAccount, setSearchAccount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://127.0.0.1:5000/expensetransactions', {
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

        // Combine and normalize data
        const combined = [
          ...data.cash_disbursements.map((cd) => ({
            type: 'Cash Disbursement',
            date: cd.disbursement_date,
            reference: cd.cheque_no,
            from: cd.to_whom_paid,
            description: cd.description,
            debited_amount: cd.total, // DR column for cash disbursement
            credited_amount: 0, // No credited amount for cash disbursement
            parent_account: cd.parent_account,
          })),
          ...data.invoices_received.map((inv) => ({
            type: 'Invoice Received',
            date: inv.date_issued,
            reference: inv.invoice_number,
            from: inv.name,
            description: inv.description,
            debited_amount: inv.amount, // DR column for invoices received
            credited_amount: 0, // No credited amount for invoices
            parent_account: inv.parent_account,
          })),
      // Transactions
      ...data.transactions.map((txn) => {
        const isAssetAccount = txn.debited_account_name && /^1[1-9]\d{2}/.test(txn.debited_account_name.split('-')[0].trim());
        const isLiabilityAccount = txn.credited_account_name && /^1[1-9]\d{2}/.test(txn.credited_account_name.split('-')[0].trim());

        return {
          type: 'Transaction',
          date: txn.date_issued,
          reference: txn.id,
          from: txn.debited_account_name || txn.credited_account_name || '',
          description: txn.description,
          debited_account: txn.debited_account_name || '',
          credited_account: txn.credited_account_name || '',
          parent_account: txn.parent_account || '',
          amount: txn.amount_debited || txn.amount_credited || 0,
          dr: isAssetAccount ? txn.amount_debited || 0 : 0, // DR if account is between 1100-1999
          cr: isLiabilityAccount ? txn.amount_credited || 0 : 0, // CR if account is between 1100-1999
        };
      }),
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
        (item.debited_amount.toString().toLowerCase().includes(account.toLowerCase())) ||
        (item.credited_amount.toString().toLowerCase().includes(account.toLowerCase())) ||
        (item.parent_account.toLowerCase().includes(account.toLowerCase())) // Include parent account in search
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData); // Reset to all data if search is empty
    }
  };

  // Calculate total DR and CR amounts
  const totalDR = filteredData.reduce((sum, item) => sum + (Number(item.debited_amount) || 0), 0);
  const totalCR = filteredData.reduce((sum, item) => sum + (Number(item.credited_amount) || 0), 0);
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
      <h1 style={styles.header}>Expense Transactions</h1>

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
            <th>DR Amount</th>
            <th>CR Amount</th>
            <th>Parent Account</th>
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
              <td>{formatNumber(item.debited_amount)}</td>  {/* DR Amount */}
              <td>{formatNumber(item.credited_amount)}</td>  {/* CR Amount */}
              <td>{item.parent_account}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display Total Amounts and Closing Balance */}
      <div style={styles.totalAmount}>
        <div>Total DR: {formatNumber(totalDR)}</div>
        <div>Total CR: {formatNumber(totalCR)}</div>
        <div>Closing Balance: {formatNumber(closingBalance)}</div>
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

export default ExpenseTransactions;
