import React, { useEffect, useState } from 'react';

const RevenueTransactions = ({ startDate, endDate }) => {
  const [combinedData, setCombinedData] = useState([]);
  const [searchAccount, setSearchAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No token found. Please log in.');
        }

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);

        const response = await fetch(`https://yoming.boogiecoin.com/revenuetransactions?${queryParams.toString()}`, {
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
          ...data.cash_receipts.map((cr) => ({
            type: 'Cash Receipt',
            date: cr.receipt_date,
            reference: cr.receipt_no,
            from: cr.from_whom_received,
            description: cr.description,
            credited_account: cr.account_credited,
            parent_account: cr.parent_account,
            dr_amount: 0,
            cr_amount: cr.total || 0,
          })),
          ...data.invoices_issued.flatMap((inv) =>
            inv.account_credited.map((account) => ({
              type: 'Invoice Issued',
              date: inv.date_issued,
              reference: inv.invoice_number,
              from: inv.name,
              description: inv.description,
              credited_account: account.name,
              parent_account: inv.parent_account,
              dr_amount: 0,
              cr_amount: account.amount || 0,
            }))
          ),
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
              dr: isAssetAccount ? txn.amount_debited || 0 : 0,
              cr: isLiabilityAccount ? txn.amount_credited || 0 : 0,
            };
          }),
        ];

        setCombinedData(combined);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const handleSearch = (e) => {
    setSearchAccount(e.target.value);
  };

  const filteredData = combinedData.filter((item) => {
    const creditedAccount = item.credited_account ? item.credited_account.toString() : '';
    const parentAccount = item.parent_account ? item.parent_account.toString() : '';

    return (
      creditedAccount.toLowerCase().includes(searchAccount.toLowerCase()) ||
      parentAccount.toLowerCase().includes(searchAccount.toLowerCase())
    );
  });

  const totalDR = filteredData.reduce((sum, item) => sum + (Number(item.dr_amount) || 0), 0);
  const totalCR = filteredData.reduce((sum, item) => sum + (Number(item.cr_amount) || 0), 0);
  const closingBalance = totalCR - totalDR;

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
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by account or parent account..."
          value={searchAccount}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>
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
              <td>{formatNumber(item.dr_amount)}</td>
              <td>{formatNumber(item.cr_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  totalAmount: {
    marginTop: '20px',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textAlign: 'right',
    color: '#003366',
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
