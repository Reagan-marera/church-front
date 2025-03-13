import React, { useEffect, useState, useMemo } from 'react';

const AssetTransactions = () => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchAccount, setSearchAccount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:5000/assettransactions', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        const combined = [
          ...data.cash_disbursements.map(item => ({
            type: 'Cash Disbursement',
            date: item.disbursement_date,
            reference: item.cheque_no || item.p_voucher_no,
            from: item.to_whom_paid,
            description: item.description,
            debited_account: item.account_debited,
            credited_account: item.account_credited,
            parent_account: item.parent_account,
            dr: item.total,
            cr: 0,
            amount: item.total,
          })),
          ...data.invoices_received.map(item => ({
            type: 'Invoice Received',
            date: item.date_issued,
            reference: item.invoice_number,
            from: item.name,
            description: item.description,
            debited_account: item.account_debited,
            credited_account: item.account_credited,
            parent_account: item.parent_account,
            dr: item.amount,
            cr: 0,
            amount: item.amount,
          })),
          ...data.invoices_issued.map(item => ({
            type: 'Invoice Issued',
            date: item.date_issued,
            reference: item.invoice_number,
            from: item.name,
            description: item.description,
            debited_account: item.account_debited,
            credited_account: item.account_credited,
            parent_account: item.parent_account,
            cr: 0,
            dr: item.amount,
            amount: item.amount,
          })),
          ...data.cash_receipts.map(item => ({
            type: 'Cash Receipt',
            date: item.receipt_date,
            reference: item.receipt_no || item.ref_no,
            from: item.from_whom_received,
            description: item.description,
            debited_account: item.account_debited,
            credited_account: item.account_credited,
            parent_account: item.parent_account,
            dr: 0,
            cr: item.total,
            amount: item.total,
          })),
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

        console.log('Combined Data:', combined);
        setCombinedData(combined);
        setFilteredData(combined);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    const account = e.target.value.trim().toLowerCase();
    setSearchAccount(account);
    if (account) {
      const filtered = combinedData.filter((item) => {
        const debitedAccount = Array.isArray(item.debited_account)
          ? item.debited_account.some(acc => acc.name.toLowerCase().includes(account))
          : String(item.debited_account).toLowerCase().includes(account);
        const creditedAccount = String(item.credited_account).toLowerCase().includes(account);
        const parentAccount = String(item.parent_account).toLowerCase().includes(account);
        console.log(`Filtering item: ${item.type}, Debited: ${debitedAccount}, Credited: ${creditedAccount}, Parent: ${parentAccount}`);
        return debitedAccount || creditedAccount || parentAccount;
      });
      console.log(`Filtered data:`, filtered);
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData);
    }
  };

  const totalAmount = useMemo(() => filteredData.reduce((sum, item) => sum + item.amount, 0), [filteredData]);
  const totalDR = useMemo(() => filteredData.reduce((sum, item) => sum + (item.dr || 0), 0), [filteredData]);
  const totalCR = useMemo(() => filteredData.reduce((sum, item) => sum + (item.cr || 0), 0), [filteredData]);
  const closingBalance = totalDR - totalCR;

  const formatNumber = (num) => {
    if (num === 0 || !num) return '0.00';
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
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by account or parent account..."
          value={searchAccount}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>
      <table aria-label="Asset Transactions Table" style={styles.table}>
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
              <td>
                {Array.isArray(item.debited_account)
                  ? item.debited_account.map(acc => acc.name).join(', ')
                  : item.debited_account || item.credited_account}
              </td>
              <td>{item.parent_account}</td>
              <td>{formatNumber(item.dr)}</td>
              <td>{formatNumber(item.cr)}</td>
              <td>{formatNumber(item.amount)}</td>
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

export default AssetTransactions;
