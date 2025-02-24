import React, { useEffect, useState } from 'react';

const NetAssets = () => {
  const [netAssetsData, setNetAssetsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for the search term
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    // Fetch data from the /net-assets route
    const fetchNetAssets = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/net-assets');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setNetAssetsData(data);
        setFilteredTransactions(data.transactions); // Initialize filtered transactions
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNetAssets();
  }, []);

  useEffect(() => {
    // Filter transactions when search term changes
    if (netAssetsData && searchTerm) {
      const filtered = netAssetsData.transactions.filter((txn) => {
        const creditedAccount = txn.credited_account_name.toLowerCase();
        const debitedAccount = txn.debited_account_name.toLowerCase();
        const parentAccountCredited = txn.parent_account_credited.toLowerCase();
        const parentAccountDebited = txn.parent_account_debited.toLowerCase();
        
        const search = searchTerm.toLowerCase();
        
        return (
          creditedAccount.includes(search) ||
          debitedAccount.includes(search) ||
          parentAccountCredited.includes(search) ||
          parentAccountDebited.includes(search)
        );
      });
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(netAssetsData?.transactions || []); // Show all if no search term
    }
  }, [searchTerm, netAssetsData]);

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Net Assets</h1>

      {/* Search Input */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by Account or Parent Account..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Display Totals */}
      <div style={styles.totals}>
        <p>Total Credits: {netAssetsData.total_credits.toFixed(2)}</p>
        <p>Total Debits: {netAssetsData.total_debits.toFixed(2)}</p>
        <p>Net Assets: {netAssetsData.net_assets.toFixed(2)}</p>
      </div>

      {/* Display Transactions Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Credited Account</th>
            <th>Debited Account</th>
            <th>Amount Credited</th>
            <th>Amount Debited</th>
            <th>Description</th>
            <th>Date Issued</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((txn) => (
            <tr key={txn.id}>
              <td>{txn.credited_account_name}</td>
              <td>{txn.debited_account_name}</td>
              <td>{txn.amount_credited.toFixed(2)}</td>
              <td>{txn.amount_debited.toFixed(2)}</td>
              <td>{txn.description}</td>
              <td>{txn.date_issued || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    marginBottom: '20px',
    textAlign: 'center',
  },
  searchInput: {
    padding: '10px',
    fontSize: '1rem',
    width: '60%',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  totals: {
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#e0f7fa',
    borderRadius: '5px',
    textAlign: 'center',
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

export default NetAssets;
