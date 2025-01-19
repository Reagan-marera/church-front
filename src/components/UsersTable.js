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
  const JugglerLoader = () => (
    <div style={styles.jugglerContainer}>
      <div style={styles.juggler}>
        <div style={styles.person}></div>
        <div style={styles.jugglingBall}></div>
        <div style={styles.jugglingBall}></div>
        <div style={styles.jugglingBall}></div>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <JugglerLoader />
        <p style={styles.loading}>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return <p style={styles.error}>Error: {error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Transactions</h2>

      <input
        type="text"
        placeholder="Search by Parent Account"
        value={searchQuery}
        onChange={handleSearchChange}
        style={styles.searchInput}
      />

      <div style={styles.section}>
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
              <tr key={invoice.id} style={styles.fallIn}>
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
                      <div key={index} style={styles.subaccountContainer}>
                        <span style={styles.subaccountName}>{subaccount.name}: </span>
                        <span style={styles.subaccountAmount}>Amount: {subaccount.amount}</span>
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

      <div style={styles.section}>
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
              <tr key={receipt.id} style={styles.fallIn}>
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
                    Object.entries(receipt.sub_accounts).map(([name, amount]) => (
                      <div key={name} style={styles.subaccountContainer}>
                        <span style={styles.subaccountName}>{name}: </span>
                        <span style={styles.subaccountAmount}>Amount: {amount}</span>
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

      <div style={styles.section}>
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
              <tr key={disbursement.id} style={styles.fallIn}>
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
                  {disbursement.sub_accounts ? (
                    Object.entries(disbursement.sub_accounts).map(([name, amount]) => (
                      <div key={name} style={styles.subaccountContainer}>
                        <span style={styles.subaccountName}>{name}: </span>
                        <span style={styles.subaccountAmount}>Amount: {amount}</span>
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
    fontFamily: 'Roboto, sans-serif',
  },
  header: {
    color: '#003c5c',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  sectionHeader: {
    color: '#003c5c',
    fontSize: '1.8rem',
    marginBottom: '15px',
    borderBottom: '3px solid #006d8e',
    paddingBottom: '8px',
    marginTop: '30px',
  },
  table: {
    width: '100%',
    marginTop: '20px',
    borderCollapse: 'collapse',
    backgroundColor: '#006d8e',
    borderRadius: '4px',
  },
  th: {
    padding: '14px',
    textAlign: 'left',
    border: '1px solid #ccc',
    backgroundColor: '#006d8e',
    color: 'white',
    fontWeight: 'bold',
  },
  td: {
    padding: '14px',
    textAlign: 'left',
    border: '1px solid #ccc',
    backgroundColor: '#f4f9fb',
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
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
  },
  loading: {
    fontSize: '1.2rem',
    color: '#006d8e',
  },
  error: {
    fontSize: '1.2rem',
    color: '#e53935',
  },
  fallIn: {
    animation: 'fallIn 0.8s ease-out',
  },
  jugglerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100px',
    width: '100px',
    flexDirection: 'column',
  },
  juggler: {
    position: 'relative',
    width: '50px',
    height: '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    animation: 'jugglerAnimation 3s ease-in-out infinite',
  },
  person: {
    width: '30px',
    height: '30px',
    backgroundColor: '#003366',
    borderRadius: '50%',
    marginBottom: '20px',
  },
  jugglingBall: {
    position: 'absolute',
    width: '15px',
    height: '15px',
    backgroundColor: '#ff4d4d',
    borderRadius: '50%',
    animation: 'jugglingBalls 3s ease-in-out infinite',
  },
  subaccountContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '5px',
    backgroundColor: '#f0f8ff',
    padding: '5px',
    borderRadius: '5px',
  },
  subaccountName: {
    fontWeight: 'bold',
    color: 'black',
  },
  subaccountAmount: {
    color: 'blue',
  },
};

// Keyframe animations
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes jugglerAnimation {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(360deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes jugglingBalls {
    0% { transform: translateY(0); }
    25% { transform: translateY(-30px); }
    50% { transform: translateY(0); }
    75% { transform: translateY(30px); }
    100% { transform: translateY(0); }
  }

  @keyframes fallIn {
    0% { opacity: 0; transform: translateY(-20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

document.head.appendChild(styleSheet);

export default UserTransactions;
