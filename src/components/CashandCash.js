import React, { useEffect, useState } from 'react';
import { useBalance } from './BalanceContext';

const CashTransactions = ({ startDate, endDate }) => {
  const { updateBalances } = useBalance();
  const [transactions, setTransactions] = useState([]);
  const [groupedAccounts, setGroupedAccounts] = useState([]);
  const [searchAccount, setSearchAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found. Please log in.');
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);

        const response = await fetch(`https://church.boogiecoin.com/api/transactions?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setTransactions(data.transactions);
        setGroupedAccounts(data.filtered_grouped_accounts);

        // Calculate opening and closing balances
        const openingBalance = calculateOpeningBalance(data.transactions);
        const closingBalance = calculateClosingBalance(data.transactions);
        updateBalances(openingBalance, closingBalance); // Update balances in context
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, updateBalances]);

  const handleSearch = (e) => {
    setSearchAccount(e.target.value);
  };

  const filteredTransactions = transactions.filter((item) => {
    const accountDebited = item.account_debited ? item.account_debited.toString() : '';
    const accountCredited = item.account_credited ? JSON.stringify(item.account_credited) : '';
    return (
      accountDebited.toLowerCase().includes(searchAccount.toLowerCase()) ||
      accountCredited.toLowerCase().includes(searchAccount.toLowerCase())
    );
  });

  const formatNumber = (num) => {
    if (!num || num === 0) return "0.00";
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalDebited = filteredTransactions.reduce(
    (acc, item) => {
      if (item.transaction_type === "Cash Receipt") {
        return acc + (item.total || 0);
      } else if (item.transaction_type === "Transaction") {
        return acc + (item.amount_debited || 0);
      } else {
        return acc;
      }
    },
    0
  );

  const totalCredited = filteredTransactions.reduce(
    (acc, item) => {
      if (item.transaction_type === "Cash Disbursement") {
        return acc + (item.total || 0);
      } else if (item.transaction_type === "Transaction" || item.transaction_type === "Invoice Issued") {
        return acc + (item.amount_credited || 0);
      } else {
        return acc;
      }
    },
    0
  );

  const closingBalance = totalDebited - totalCredited;

  const calculateOpeningBalance = (transactions) => {
    const openingBalanceTransactions = transactions.filter(
      (item) =>
        item.transaction_type === "Transaction" &&
        item.description === "Opening Balance"
    );

    const totalDebited = openingBalanceTransactions.reduce(
      (acc, item) => acc + (item.amount_debited || 0),
      0
    );

    const totalCredited = openingBalanceTransactions.reduce(
      (acc, item) => acc + (item.amount_credited || 0),
      0
    );

    return totalDebited + totalCredited;
  };

  const calculateClosingBalance = (transactions) => {
    const totalDebited = transactions.reduce((acc, item) => acc + (item.amount_debited || 0), 0);
    const totalCredited = transactions.reduce((acc, item) => acc + (item.amount_credited || 0), 0);
    return totalDebited - totalCredited;
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Cash & Cash Equivalents</h1>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by account..."
          value={searchAccount}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>
      <h2 style={styles.subHeader}>Cash & Cash Transactions</h2>
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Type</th>
            <th>Date</th>
            <th>Reference</th>
            <th>From/To</th>
            <th>Description</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Amount Debited</th>
            <th>Amount Credited</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((item, index) => (
            <tr key={index} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
              <td>{item.transaction_type}</td>
              <td>{item.date}</td>
              <td>{item.receipt_no || item.ref_no || item.id}</td>
              <td>{item.from_whom_received || item.to_whom_paid || item.name}</td>
              <td>{item.description}</td>
              <td>{item.account_debited}</td>
              <td>
                {Array.isArray(item.account_credited)
                  ? item.account_credited.map((acct, idx) => (
                      <span key={idx}>{acct.name}{idx < item.account_credited.length - 1 ? ', ' : ''}</span>
                    ))
                  : item.account_credited}
              </td>
              <td>
                {formatNumber(
                  item.transaction_type === "Cash Receipt"
                    ? item.total || 0
                    : item.transaction_type === "Transaction"
                    ? item.amount_debited || 0
                    : 0
                )}
              </td>
              <td>
                {formatNumber(
                  item.transaction_type === "Cash Disbursement"
                    ? item.total || 0
                    : item.transaction_type === "Transaction" || item.transaction_type === "Invoice Issued"
                    ? item.amount_credited || 0
                    : 0
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.tableFooter}>
            <td colSpan="7" style={styles.totalText}>Total DR</td>
            <td colSpan="2" style={styles.totalAmount}>{formatNumber(totalDebited)}</td>
          </tr>
          <tr style={styles.tableFooter}>
            <td colSpan="7" style={styles.totalText}>Total CR</td>
            <td colSpan="2" style={styles.totalAmount}>{formatNumber(totalCredited)}</td>
          </tr>
          <tr style={styles.tableFooter}>
            <td colSpan="7" style={styles.totalText}>Cash Closing Balance</td>
            <td colSpan="2" style={styles.totalAmount}>{formatNumber(closingBalance)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f4f6f9',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    fontFamily: 'Georgia, serif',
    color: '#003366',
  },
  subHeader: {
    marginTop: '30px',
    marginBottom: '15px',
    fontSize: '1.5rem',
    color: '#003366',
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
    backgroundColor: '#003366',
    color: 'white',
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
  tableFooter: {
    backgroundColor: '#f7f7f7',
    fontWeight: 'bold',
  },
  totalText: {
    textAlign: 'right',
    paddingRight: '15px',
  },
  totalAmount: {
    padding: '12px 15px',
    textAlign: 'right',
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

export default CashTransactions;