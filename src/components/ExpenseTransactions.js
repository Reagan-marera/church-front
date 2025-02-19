import React, { useEffect, useState } from 'react';

const ExpenseTransactions = () => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchAccount, setSearchAccount] = useState('');

  useEffect(() => {
    // Fetch data from the /expensetransactions route
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/expensetransactions');
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
            debited_account: cd.account_debited,
            credited_account: '', // No credited account for cash disbursement
            parent_account: cd.parent_account,
            amount: cd.total,
          })),
          ...data.invoices_received.map((inv) => ({
            type: 'Invoice Received',
            date: inv.date_issued,
            reference: inv.invoice_number,
            from: inv.name,
            description: inv.description,
            debited_account: inv.account_debited,
            credited_account: '', // No credited account for invoices
            parent_account: inv.parent_account,
            amount: inv.amount,
          })),
          ...data.transactions.map((txn) => ({
            type: 'Transaction',
            date: txn.date_issued,
            reference: txn.id,
            from: txn.debited_account_name,
            description: txn.description,
            debited_account: txn.debited_account_name,
            credited_account: txn.credited_account_name, // Include credited account
            parent_account: txn.parent_account,
            amount: txn.amount_debited,
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
        item.debited_account.toLowerCase().includes(account.toLowerCase()) ||
        item.credited_account.toLowerCase().includes(account.toLowerCase()) ||
        item.parent_account.toLowerCase().includes(account.toLowerCase()) // Include parent account in search
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData); // Reset to all data if search is empty
    }
  };

  // Calculate total amount for filtered data
  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);

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
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Reference</th>
            <th>From</th>
            <th>Description</th>
           
            <th> Account</th>
            <th>Parent Account</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index}>
              <td>{item.type}</td>
              <td>{item.date}</td>
              <td>{item.reference}</td>
              <td>{item.from}</td>
              <td>{item.description}</td>
              
              <td>{item.credited_account || item.debited_account}</td>
              <td>{item.parent_account}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display Total Amount */}
      <div style={styles.totalAmount}>
        Total Amount: {totalAmount.toFixed(2)}
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
    backgroundColor: '#f9f9f9',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    color: '#333',
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  searchInput: {
    padding: '8px',
    width: '300px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'left',
  },
  totalAmount: {
    marginTop: '20px',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textAlign: 'right',
    color: '#333',
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
