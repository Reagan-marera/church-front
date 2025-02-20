import React, { useEffect, useState } from 'react';

const NetAssets = () => {
  const [netAssetsData, setNetAssetsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNetAssets();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Net Assets</h1>

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
          {netAssetsData.transactions.map((txn) => (
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