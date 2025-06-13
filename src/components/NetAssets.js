import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

const NetAssets = ({ startDate, endDate }) => {
  const [netAssetsData, setNetAssetsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    const fetchNetAssets = async () => {
      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);

        const response = await fetch(`https://backend.youmingtechnologies.co.ke/net-assets?${queryParams.toString()}`, {
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
        setNetAssetsData(data);
        setFilteredTransactions(data.transactions);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNetAssets();
  }, [startDate, endDate]);

  useEffect(() => {
    if (netAssetsData && searchTerm) {
      const filtered = netAssetsData.transactions.filter((txn) => {
        const search = searchTerm.toLowerCase();
        const creditedAccount = Array.isArray(txn.credited_account_name)
          ? txn.credited_account_name.some(acc => acc.toLowerCase().includes(search))
          : txn.credited_account_name.toLowerCase().includes(search);
        const debitedAccount = Array.isArray(txn.debited_account_name)
          ? txn.debited_account_name.some(acc => acc.toLowerCase().includes(search))
          : txn.debited_account_name.toLowerCase().includes(search);
        const parentAccountCredited = txn.parent_account_credited.toLowerCase().includes(search);
        const parentAccountDebited = txn.parent_account_debited.toLowerCase().includes(search);

        return creditedAccount || debitedAccount || parentAccountCredited || parentAccountDebited;
      });
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(netAssetsData?.transactions || []);
    }
  }, [searchTerm, netAssetsData]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(txn => ({
      'Credited Account': Array.isArray(txn.credited_account_name) ? txn.credited_account_name.join(', ') : txn.credited_account_name,
      'Debited Account': Array.isArray(txn.debited_account_name) ? txn.debited_account_name.join(', ') : txn.debited_account_name,
      'Amount Credited': txn.amount_credited,
      'Amount Debited': txn.amount_debited,
      'Description': txn.description,
      'Date Issued': txn.date_issued || 'N/A',
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "NetAssets");
    XLSX.writeFile(workbook, "NetAssets.xlsx");
  };

  const totalCredits = useMemo(() =>
    filteredTransactions.reduce((sum, txn) => sum + txn.amount_credited, 0),
    [filteredTransactions]
  );

  const totalDebits = useMemo(() =>
    filteredTransactions.reduce((sum, txn) => sum + txn.amount_debited, 0),
    [filteredTransactions]
  );

  const netAssets = totalCredits - totalDebits;

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Net Assets</h1>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by Account or Parent Account..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      <button onClick={exportToExcel} style={styles.exportButton}>
        Export to Excel
      </button>
      <div style={styles.totals}>
        <p>Total Credits: {totalCredits.toFixed(2)}</p>
        <p>Total Debits: {totalDebits.toFixed(2)}</p>
        <p>Net Assets: {netAssets.toFixed(2)}</p>
      </div>
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
              <td>{Array.isArray(txn.credited_account_name) ? txn.credited_account_name.join(', ') : txn.credited_account_name}</td>
              <td>{Array.isArray(txn.debited_account_name) ? txn.debited_account_name.join(', ') : txn.debited_account_name}</td>
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
  exportButton: {
    padding: '10px 15px',
    backgroundColor: '#003366',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '20px',
  },
  totals: {
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#e0f7fa',
    borderRadius: '5px',
    textAlign: 'center',
    color: 'black',
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
