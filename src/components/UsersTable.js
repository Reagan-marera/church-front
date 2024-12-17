import React, { useState, useEffect } from 'react';

const UserTransactions = () => {
  const [transactions, setTransactions] = useState({
    invoices_issued: [],
    cash_receipts: [],
    cash_disbursements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token'); // Ensure the JWT token is stored locally

      try {
        const response = await fetch('http://127.0.0.1:5000/usertransactions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Include the JWT token in the request header
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText} PLEASE LOGIN`);
        }

        const data = await response.json();
        setTransactions(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <p style={styles.loading}>Loading transactions...</p>;
  }

  if (error) {
    return <p style={styles.error}>Error: {error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Transactions</h2>

      <div>
        <h3 style={styles.sectionHeader}>Invoices Issued</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Invoice Number</th>
              <th style={styles.th}>Date Issued</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Account Class</th>
              <th style={styles.th}>Account Type</th>
              <th style={styles.th}>Account Debited</th>
              <th style={styles.th}>Account Credited</th>
              <th style={styles.th}>Invoice Type</th>
              <th style={styles.th}>GRN Number</th>
              <th style={styles.th}>Parent Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.invoices_issued.map((invoice) => (
              <tr key={invoice.id}>
                <td style={styles.td}>{invoice.id}</td>
                <td style={styles.td}>{invoice.invoice_number}</td>
                <td style={styles.td}>{invoice.date_issued}</td>
                <td style={styles.td}>{invoice.amount}</td>
                <td style={styles.td}>{invoice.account_class}</td>
                <td style={styles.td}>{invoice.account_type}</td>
                <td style={styles.td}>{invoice.account_debited}</td>
                <td style={styles.td}>{invoice.account_credited}</td>
                <td style={styles.td}>{invoice.invoice_type}</td>
                <td style={styles.td}>{invoice.grn_number}</td>
                <td style={styles.td}>{invoice.parent_account}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style={styles.sectionHeader}>Cash Receipts</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Receipt Date</th>
              <th style={styles.th}>Receipt No</th>
              <th style={styles.th}>From Whom Received</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Account Class</th>
              <th style={styles.th}>Account Type</th>
              <th style={styles.th}>Receipt Type</th>
              <th style={styles.th}>Account Debited</th>
              <th style={styles.th}>Account Credited</th>
              <th style={styles.th}>Cash</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Parent Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.cash_receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td style={styles.td}>{receipt.id}</td>
                <td style={styles.td}>{receipt.receipt_date}</td>
                <td style={styles.td}>{receipt.receipt_no}</td>
                <td style={styles.td}>{receipt.from_whom_received}</td>
                <td style={styles.td}>{receipt.description}</td>
                <td style={styles.td}>{receipt.account_class}</td>
                <td style={styles.td}>{receipt.account_type}</td>
                <td style={styles.td}>{receipt.receipt_type}</td>
                <td style={styles.td}>{receipt.account_debited}</td>
                <td style={styles.td}>{receipt.account_credited}</td>
                <td style={styles.td}>{receipt.cash}</td>
                <td style={styles.td}>{receipt.total}</td>
                <td style={styles.td}>{receipt.parent_account}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style={styles.sectionHeader}>Cash Disbursements</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Disbursement Date</th>
              <th style={styles.th}>Cheque No</th>
              <th style={styles.th}>To Whom Paid</th>
              <th style={styles.th}>Payment Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Account Class</th>
              <th style={styles.th}>Account Type</th>
              <th style={styles.th}>Account Debited</th>
              <th style={styles.th}>Account Credited</th>
              <th style={styles.th}>Cash</th>
              <th style={styles.th}>Bank</th>
              <th style={styles.th}>Parent Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.cash_disbursements.map((disbursement) => (
              <tr key={disbursement.id}>
                <td style={styles.td}>{disbursement.id}</td>
                <td style={styles.td}>{disbursement.disbursement_date}</td>
                <td style={styles.td}>{disbursement.cheque_no}</td>
                <td style={styles.td}>{disbursement.to_whom_paid}</td>
                <td style={styles.td}>{disbursement.payment_type}</td>
                <td style={styles.td}>{disbursement.description}</td>
                <td style={styles.td}>{disbursement.account_class}</td>
                <td style={styles.td}>{disbursement.account_type}</td>
                <td style={styles.td}>{disbursement.account_debited}</td>
                <td style={styles.td}>{disbursement.account_credited}</td>
                <td style={styles.td}>{disbursement.cash}</td>
                <td style={styles.td}>{disbursement.bank}</td>
                <td style={styles.td}>{disbursement.parent_account}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#fff',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
  },
  header: {
    color: '#005f71',
    fontSize: '2rem',
    marginBottom: '20px',
  },
  sectionHeader: {
    color: '#333',
    fontSize: '1.5rem',
    marginBottom: '10px',
    borderBottom: '2px solid #005f71',
    paddingBottom: '5px',
    marginTop: '30px',
  },
  table: {
    width: '100%',
    marginTop: '20px',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    border: '1px solid #ddd',
    backgroundColor: '#005f71',
    color: 'white',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px',
    textAlign: 'left',
    border: '1px solid #ddd',
    backgroundColor: '#fafafa',
  },
  loading: {
    fontSize: '1.2rem',
    color: '#888',
  },
  error: {
    fontSize: '1.2rem',
    color: '#ff4e4e',
  },
};

export default UserTransactions;
