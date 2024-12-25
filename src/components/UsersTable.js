import React, { useState, useEffect } from 'react';

const UserTransactions = () => {
  const [transactions, setTransactions] = useState({
    invoices_issued: [],
    cash_receipts: [],
    cash_disbursements: [],
  });
  const [filteredTransactions, setFilteredTransactions] = useState({
    invoices_issued: [],
    cash_receipts: [],
    cash_disbursements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch all transactions first
  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token'); // Ensure the JWT token is stored locally

      try {
        const response = await fetch('https://finance.boogiecoin.com/usertransactions', {
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
        setFilteredTransactions(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  
    // Filter transactions based on the search query
    const filterData = (data) => {
      return data.filter((item) => {
        // Check if the parent_account or any subaccount contains the query
        const matchesParentAccount = item.parent_account && item.parent_account.toLowerCase().includes(query.toLowerCase());
        const matchesSubaccounts = item.sub_accounts && Object.values(item.sub_accounts).some(subaccount =>
          subaccount.name && subaccount.name.toLowerCase().includes(query.toLowerCase())
        );
        return matchesParentAccount || matchesSubaccounts;
      });
    };
  
    // Apply filter to each transaction type
    setFilteredTransactions({
      invoices_issued: filterData(transactions.invoices_issued),
      cash_receipts: filterData(transactions.cash_receipts),
      cash_disbursements: filterData(transactions.cash_disbursements),
    });
  };
  
  
  if (loading) {
    return <p style={styles.loading}>Loading transactions...</p>;
  }

  if (error) {
    return <p style={styles.error}>Error: {error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Transactions</h2>

      <input
        type="text"
        placeholder="Search by Parent Account "
        value={searchQuery}
        onChange={handleSearchChange}
        style={styles.searchInput}
      />

      <div>
        <h3 style={styles.sectionHeader}>Invoices Issued</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Invoice Number</th>
              <th style={styles.th}>Date Issued</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Account Debited</th>
              <th style={styles.th}>Account Credited</th>
              
              <th style={styles.th}>GRN Number</th>
              <th style={styles.th}>Parent Account</th>
              <th style={styles.th}>Subaccounts</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.invoices_issued.map((invoice) => (
              <tr key={invoice.id}>
                <td style={styles.td}>{invoice.id}</td>
                <td style={styles.td}>{invoice.invoice_number}</td>
                <td style={styles.td}>{invoice.date_issued}</td>
                <td style={styles.td}>{invoice.amount}</td>
                <td style={styles.td}>{invoice.account_debited}</td>
                <td style={styles.td}>{invoice.account_credited}</td>
                <td style={styles.td}>{invoice.grn_number}</td>
                <td style={styles.td}>{invoice.parent_account}</td>
                <td style={styles.td}>
  {invoice.sub_accounts ? (
    Object.values(invoice.sub_accounts).map((subaccount, index) => (
      <div key={index}>
        {subaccount.name}: Amount: {subaccount.amount}
      </div>
    ))
  ) : (
    'No subaccounts'
  )}
</td>
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
              <th style={styles.th}>Account Debited</th>
              <th style={styles.th}>Account Credited</th>
            
              <th style={styles.th}>Parent Account</th>
              <th style={styles.th}>Subaccounts</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.cash_receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td style={styles.td}>{receipt.id}</td>
                <td style={styles.td}>{receipt.receipt_date}</td>
                <td style={styles.td}>{receipt.receipt_no}</td>
                <td style={styles.td}>{receipt.from_whom_received}</td>
                <td style={styles.td}>{receipt.description}</td>
                <td style={styles.td}>{receipt.account_debited}</td>
                <td style={styles.td}>{receipt.account_credited}</td>
              
                <td style={styles.td}>{receipt.parent_account}</td>
                <td style={styles.td}>
  {receipt.sub_accounts ? (
    Object.values(receipt.sub_accounts).map((subaccount, index) => (
      <div key={index}>
        {subaccount.name}: Amount: {subaccount.amount}
      </div>
    ))
  ) : (
    'No subaccounts'
  )}
</td>
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
        <th style={styles.th}>Account Debited</th>
        <th style={styles.th}>Account Credited</th>
      
        <th style={styles.th}>Parent Account</th>
        <th style={styles.th}>Subaccounts</th>
      </tr>
    </thead>
    <tbody>
      {filteredTransactions.cash_disbursements.map((disbursement) => (
        <tr key={disbursement.id}>
          <td style={styles.td}>{disbursement.id}</td>
          <td style={styles.td}>{disbursement.disbursement_date}</td>
          <td style={styles.td}>{disbursement.cheque_no}</td>
          <td style={styles.td}>{disbursement.to_whom_paid}</td>
          <td style={styles.td}>{disbursement.payment_type}</td>
          <td style={styles.td}>{disbursement.description}</td>
          <td style={styles.td}>{disbursement.account_debited}</td>
          <td style={styles.td}>{disbursement.account_credited}</td>
         
          <td style={styles.td}>{disbursement.parent_account}</td>
          <td style={styles.td}>
            {/* Check if sub_accounts exists and render the amount along with name */}
            {disbursement.sub_accounts && Object.entries(disbursement.sub_accounts).length > 0 ? (
              Object.entries(disbursement.sub_accounts).map(([name, amount]) => (
                <div key={name}>
                  {name}: Amount: {amount}
                </div>
              ))
            ) : (
              'No subaccounts'
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
      </div>
    </div>
  );
};
// Styles
const styles = {
  container: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#fff',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif', // World Bank uses clean sans-serif fonts
  },
  header: {
    color: '#003c5c', // A darker blue shade used in World Bank's branding
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  sectionHeader: {
    color: '#003c5c', // Matching dark blue for section headers
    fontSize: '1.8rem',
    marginBottom: '15px',
    borderBottom: '3px solid #006d8e', // A lighter blue for emphasis
    paddingBottom: '8px',
    marginTop: '30px',
  },
  table: {
    width: '100%',
    marginTop: '20px',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '4px',
  },
  th: {
    padding: '14px',
    textAlign: 'left',
    border: '1px solid #ccc',
    backgroundColor: '#006d8e', // World Bank's primary accent color
    color: 'white',
    fontWeight: 'bold',
  },
  td: {
    padding: '14px',
    textAlign: 'left',
    border: '1px solid #ccc',
    backgroundColor: '#f4f9fb', // Light background with a hint of blue
  },
  loading: {
    fontSize: '1.2rem',
    color: '#006d8e', // Using World Bank's primary color for loading text
  },
  error: {
    fontSize: '1.2rem',
    color: '#e53935', // A red color for error messages
  },
  searchInput: {
    padding: '12px',
    fontSize: '1rem',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '420px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    backgroundColor: '#eaf1f6', 
  },
  subaccountContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '5px', 
  },
  subaccountName: {
    fontWeight: 'bold',
    color: '#003c5c', 
  },
  subaccountAmount: {
    color: '#005f71', 
  },
};

export default UserTransactions;