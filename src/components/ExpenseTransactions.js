import React, { useEffect, useState } from 'react';

const ExpenseTransactions = ({ startDate, endDate }) => {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);

        const response = await fetch(`http://127.0.0.1:5000/expensetransactions?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();

        // Log the data for debugging
        console.log('API Response:', data);

        // Validate the response
        if (!data || Object.keys(data).length === 0) {
          throw new Error('No data available.');
        }

        // Normalize and combine data
        const normalizedData = [
          ...(data.transactions ?? []).map((txn) => {
            // Handle account_name, which can be a string or an array of objects
            const accountName =
              typeof txn.account_name === 'string'
                ? txn.account_name.trim()
                : Array.isArray(txn.account_name) && txn.account_name.length > 0
                ? txn.account_name[0].name.trim()
                : 'N/A';

            // Determine DR and CR amounts based on transaction type
            const debitedAmount = txn.type === 'Cash Disbursement' || txn.type === 'Invoice Received'
              ? Number(txn.dr_amount) || 0
              : 0;
            const creditedAmount = txn.type === 'Transaction'
              ? Number(txn.cr_amount) || 0
              : 0;

            return {
              type: txn.type,
              date: txn.date,
              reference: txn.reference || 'N/A',
              from: txn.from || 'N/A',
              description: txn.description?.trim() || 'No description',
              debited_amount: debitedAmount,
              credited_amount: creditedAmount,
              parent_account: txn.parent_account?.trim() || 'N/A',
              account_name: accountName,
            };
          }),
        ];

        setCombinedData(normalizedData);
        setFilteredData(normalizedData); // Initialize filtered data with all data
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]); // Re-fetch data when start or end date changes

  // Handle search by account, reference, or description
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term) {
      const filtered = combinedData.filter((item) =>
        item.type.toLowerCase().includes(term) ||
        item.reference.toLowerCase().includes(term) ||
        item.from.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.parent_account.toLowerCase().includes(term) ||
        item.account_name.toLowerCase().includes(term)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(combinedData); // Reset to all data if search is empty
    }
  };

  // Calculate total DR and CR amounts
  const totalDR = filteredData.reduce((sum, item) => sum + (Number(item.debited_amount) || 0), 0);
  const totalCR = filteredData.reduce((sum, item) => sum + (Number(item.credited_amount) || 0), 0);
  const closingBalance = totalDR - totalCR;

  // Format numbers with two decimal places
  const formatNumber = (num) => {
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
      <h1 style={styles.header}>Expense Transactions</h1>
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by type, reference, description, or account..."
          value={searchTerm}
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
            <th>DR Amount</th>
            <th>CR Amount</th>
            <th>Parent Account</th>
            <th>Account Name</th>
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
              <td>{formatNumber(item.debited_amount)}</td>
              <td>{formatNumber(item.credited_amount)}</td>
              <td>{item.parent_account}</td>
              <td>{item.account_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.totalAmount}>
        <div>Total DR: {formatNumber(totalDR)}</div>
        <div>Total CR: {formatNumber(totalCR)}</div>
        <div>Closing Balance: {formatNumber(closingBalance)}</div>
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
    '&:focus': {
      borderColor: '#007BFF',
    },
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
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#e6f2ff',
    },
  },
  oddRow: {
    backgroundColor: '#ffffff',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#e6f2ff',
    },
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

export default ExpenseTransactions;