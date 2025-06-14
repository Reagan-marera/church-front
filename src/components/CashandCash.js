import React, { useEffect, useState } from 'react';
import { useBalance } from './BalanceContext';
import * as XLSX from 'xlsx';

const CashTransactions = ({ startDate, endDate }) => {
  const { updateBalances } = useBalance();
  const [transactions, setTransactions] = useState([]);
  const [groupedAccounts, setGroupedAccounts] = useState([]);
  const [searchAccount, setSearchAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markedTransactions, setMarkedTransactions] = useState(() => {
    const saved = localStorage.getItem('markedTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found. Please log in.');

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);

        const response = await fetch(`http://127.0.0.1:5000/api/transactions?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType.includes('application/json')) {
          const errorText = await response.text();
          throw new Error(`Expected JSON, got: ${contentType}. Response: ${errorText}`);
        }

        const data = await response.json();
        setTransactions(data.transactions.map((t, i) => ({ ...t, id: t.id || i })));
        setGroupedAccounts(data.filtered_grouped_accounts);

        const opening = calculateOpeningBalance(data.transactions);
        const closing = calculateClosingBalance(data.transactions);
        updateBalances(opening, closing);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, updateBalances]);

  useEffect(() => {
    localStorage.setItem('markedTransactions', JSON.stringify(markedTransactions));
  }, [markedTransactions]);

  const handleSearch = (e) => setSearchAccount(e.target.value);

  const handleCheckboxChange = (id) => {
    setMarkedTransactions((prev) => prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]);
  };

  const markAll = () => setMarkedTransactions(transactions.map(t => t.id));
  const unmarkAll = () => setMarkedTransactions([]);

  const exportToExcel = (data, fileName) => {
    if (!Array.isArray(data)) return console.error("Invalid data for export.");
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const filteredTransactions = transactions.filter((item) => {
    const debit = item.account_debited || '';
    const credit = item.account_credited ? JSON.stringify(item.account_credited) : '';
    return debit.toLowerCase().includes(searchAccount.toLowerCase()) ||
           credit.toLowerCase().includes(searchAccount.toLowerCase());
  });

  const markedList = filteredTransactions.filter(t => markedTransactions.includes(t.id));
  const unmarkedList = filteredTransactions.filter(t => !markedTransactions.includes(t.id));

  const calculateOpeningBalance = (txns) => {
    const filtered = txns.filter(t => t.transaction_type === "Transaction" && t.description === "Opening Balance");
    const totalDebited = filtered.reduce((acc, t) => acc + (t.amount_debited || 0), 0);
    const totalCredited = filtered.reduce((acc, t) => acc + (t.amount_credited || 0), 0);
    return totalDebited + totalCredited;
  };

  const calculateClosingBalance = (txns) => {
    const dr = txns.reduce((acc, t) => acc + (t.amount_debited || 0), 0);
    const cr = txns.reduce((acc, t) => acc + (t.amount_credited || 0), 0);
    return dr - cr;
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

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
      <div>
        <button onClick={markAll} style={styles.exportButton}>Mark All</button>
        <button onClick={unmarkAll} style={styles.exportButton}>Unmark All</button>
        <button onClick={() => exportToExcel(markedList, "MarkedTransactions")} style={styles.exportButton}>Export Marked</button>
        <button onClick={() => exportToExcel(unmarkedList, "UnmarkedTransactions")} style={styles.exportButton}>Export Unmarked</button>
      </div>

      <TransactionTable
        transactions={filteredTransactions}
        markedTransactions={markedTransactions}
        handleCheckboxChange={handleCheckboxChange}
      />
      <UnmarkedTransactionTable transactions={unmarkedList} />
      <CashbookReconciliationTable />
    </div>
  );
};

const TransactionTable = ({ transactions, markedTransactions, handleCheckboxChange }) => {
  const formatNumber = (n) => (!n ? "0.00" : n.toLocaleString('en-US', { minimumFractionDigits: 2 }));

  const totalDebited = transactions.reduce((acc, t) =>
    acc + ((t.transaction_type === "Cash Receipt" && t.total) || (t.transaction_type === "Transaction" && t.amount_debited) || 0), 0);

  const totalCredited = transactions.reduce((acc, t) =>
    acc + ((t.transaction_type === "Cash Disbursement" && t.total) || (["Transaction", "Invoice Issued"].includes(t.transaction_type) && t.amount_credited) || 0), 0);

  const closing = totalDebited - totalCredited;

  return (
    <div>
      <h2 style={styles.subHeader}>Cash & Cash Transactions</h2>
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Mark</th>
            <th>Type</th>
            <th>Date</th>
            <th>Reference</th>
            <th>Receipt No.</th>
            <th>From/To</th>
            <th>Description</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Amount Debited</th>
            <th>Amount Credited</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={t.id % 2 === 0 ? styles.evenRow : styles.oddRow}>
              <td><input type="checkbox" checked={markedTransactions.includes(t.id)} onChange={() => handleCheckboxChange(t.id)} /></td>
              <td>{t.transaction_type}</td>
              <td>{t.date}</td>
              <td>{t.ref_no}</td>
              <td>{t.receipt_no || t.id}</td>
              <td>{t.from_whom_received || t.to_whom_paid || t.name}</td>
              <td>{t.description}</td>
              <td>{t.account_debited}</td>
              <td>{Array.isArray(t.account_credited) ? t.account_credited.map((a, i) => <span key={i}>{a.name}{i < t.account_credited.length - 1 ? ', ' : ''}</span>) : t.account_credited}</td>
              <td>{formatNumber((t.transaction_type === "Cash Receipt" ? t.total : t.amount_debited) || 0)}</td>
              <td>{formatNumber((["Cash Disbursement", "Transaction", "Invoice Issued"].includes(t.transaction_type) ? t.total || t.amount_credited : 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.tableFooter}><td colSpan="9" style={styles.totalText}>Total DR</td><td colSpan="2" style={styles.totalAmount}>{formatNumber(totalDebited)}</td></tr>
          <tr style={styles.tableFooter}><td colSpan="9" style={styles.totalText}>Total CR</td><td colSpan="2" style={styles.totalAmount}>{formatNumber(totalCredited)}</td></tr>
          <tr style={styles.tableFooter}><td colSpan="9" style={styles.totalText}>Closing Balance</td><td colSpan="2" style={styles.totalAmount}>{formatNumber(closing)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
};

const UnmarkedTransactionTable = ({ transactions }) => {
  const formatNumber = (num) => (!num ? "0.00" : num.toLocaleString('en-US', { minimumFractionDigits: 2 }));

  const totalDebited = transactions.reduce((acc, t) => acc + ((t.transaction_type === "Cash Receipt" && t.total) || (t.transaction_type === "Transaction" && t.amount_debited) || 0), 0);
  const totalCredited = transactions.reduce((acc, t) => acc + ((t.transaction_type === "Cash Disbursement" && t.total) || (["Transaction", "Invoice Issued"].includes(t.transaction_type) && t.amount_credited) || 0), 0);
  const closingBalance = totalDebited - totalCredited;

  return (
    <div>
      <h2 style={styles.subHeader}>Bank Statement Reconciliation</h2>
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Type</th>
            <th>Date</th>
            <th>Reference</th>
            <th>Receipt No.</th>
            <th>From/To</th>
            <th>Description</th>
            <th>Account Debited</th>
            <th>Account Credited</th>
            <th>Amount Debited</th>
            <th>Amount Credited</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={styles.evenRow}>
              <td>{t.transaction_type}</td>
              <td>{t.date}</td>
              <td>{t.ref_no}</td>
              <td>{t.receipt_no || t.id}</td>
              <td>{t.from_whom_received || t.to_whom_paid || t.name}</td>
              <td>{t.description}</td>
              <td>{t.account_debited}</td>
              <td>{Array.isArray(t.account_credited) ? t.account_credited.map((a, i) => <span key={i}>{a.name}{i < t.account_credited.length - 1 ? ', ' : ''}</span>) : t.account_credited}</td>
              <td>{formatNumber((t.transaction_type === "Cash Receipt" ? t.total : t.amount_debited) || 0)}</td>
              <td>{formatNumber((["Cash Disbursement", "Transaction", "Invoice Issued"].includes(t.transaction_type) ? t.total || t.amount_credited : 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.tableFooter}><td colSpan="8" style={styles.totalText}>Total DR</td><td colSpan="2" style={styles.totalAmount}>{formatNumber(totalDebited)}</td></tr>
          <tr style={styles.tableFooter}><td colSpan="8" style={styles.totalText}>Total CR</td><td colSpan="2" style={styles.totalAmount}>{formatNumber(totalCredited)}</td></tr>
          <tr style={styles.tableFooter}><td colSpan="8" style={styles.totalText}>Cash Closing Balance</td><td colSpan="2" style={styles.totalAmount}>{formatNumber(closingBalance)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
};

const CashbookReconciliationTable = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found. Please log in.');

        const response = await fetch('http://localhost:5000/api/cashbook-reconciliations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType.includes('application/json')) {
          const errorText = await response.text();
          throw new Error(`Expected JSON, got: ${contentType}. Response: ${errorText}`);
        }

        const data = await response.json();
        setReconciliations(data);
      } catch (err) {
        console.error('Error fetching reconciliations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReconciliations();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  const formatNumber = (n) => (!n ? "0.00" : n.toLocaleString('en-US', { minimumFractionDigits: 2 }));

  const totalReceipts = reconciliations
    .filter(item => item.transaction_type === "Receipt")
    .reduce((sum, item) => sum + parseFloat(item.amount), 0);

  const totalPayments = reconciliations
    .filter(item => item.transaction_type === "Payment")
    .reduce((sum, item) => sum + parseFloat(item.amount), 0);

  const netAmount = totalReceipts - totalPayments;

  return (
    <div>
      <h2 style={styles.subHeader}>Cashbook Reconciliation</h2>
      <table style={styles.unmarkedTable}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Type</th>
            <th>Date</th>
            <th>Bank Account</th>
            <th>Details</th>
            <th>Transaction Details</th>
            <th>Amount</th>
            <th>Serial Number</th>
          </tr>
        </thead>
        <tbody>
          {reconciliations.map((item) => (
            <tr key={item.id} style={styles.row}>
              <td>{item.transaction_type}</td>
              <td>{item.date}</td>
              <td>{item.bank_account}</td>
              <td>{item.details}</td>
              <td>{item.transaction_details}</td>
              <td>{formatNumber(item.amount)}</td>
              <td>{item.manual_number}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.tableFooter}>
            <td colSpan="5" style={styles.totalText}>Unpresented Deposits</td>
            <td style={styles.totalAmount}>{formatNumber(totalReceipts)}</td>
            <td></td>
          </tr>
          <tr style={styles.tableFooter}>
            <td colSpan="5" style={styles.totalText}>Unpresented Payments</td>
            <td style={styles.totalAmount}>{formatNumber(totalPayments)}</td>
            <td></td>
          </tr>
          <tr style={styles.tableFooter}>
            <td colSpan="5" style={styles.totalText}>Net Amount</td>
            <td style={styles.totalAmount}>{formatNumber(netAmount)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const styles = {
  container: { padding: '20px', fontFamily: 'Arial' },
  header: { fontSize: '28px', marginBottom: '20px' },
  subHeader: { fontSize: '22px', marginTop: '30px', marginBottom: '10px' },
  searchContainer: { marginBottom: '10px' },
  searchInput: { padding: '8px', fontSize: '14px', width: '250px' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
  tableHeader: { backgroundColor: '#ddd', fontWeight: 'bold' },
  tableFooter: { backgroundColor: '#eee', fontWeight: 'bold' },
  totalText: { textAlign: 'right', paddingRight: '10px' },
  totalAmount: { textAlign: 'right', fontWeight: 'bold' },
  row: { textAlign: 'left' },
  evenRow: { backgroundColor: '#f9f9f9' },
  oddRow: { backgroundColor: '#ffffff' },
  unmarkedTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
  exportButton: { padding: '8px 12px', margin: '5px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' },
  loading: { padding: '20px', fontSize: '18px' },
  error: { padding: '20px', fontSize: '18px', color: 'red' },
};

export default CashTransactions;
