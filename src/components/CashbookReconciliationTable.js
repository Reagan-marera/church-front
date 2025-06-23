import React, { useEffect, useState } from 'react';

const CashbookReconciliationTable = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in.');
        }

        const response = await fetch('https://backend.youmingtechnologies.co.ke/api/cashbook-reconciliations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType.includes('application/json')) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data = await response.json();
        setReconciliations(data);
      } catch (error) {
        console.error('Error fetching reconciliations:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReconciliations();
  }, []);

  const formatNumber = (num) => {
    if (!num || num === 0) return "0.00";
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDelete = async (reconciliationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }

      const response = await fetch(`https://backend.youmingtechnologies.co.ke/api/cashbook-reconciliations/${reconciliationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Refresh the list after deletion
      setReconciliations(reconciliations.filter(item => item.id !== reconciliationId));

    } catch (error) {
      console.error('Error deleting reconciliation:', error);
      setError(error.message);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  return (
    <div>
      <h2 style={styles.subHeader}>Cashbook Reconciliation</h2>
      <table style={styles.unmarkedTable}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Type</th>
            <th>Date</th>
            <th>Bank Account</th>
            <th>Amount</th>
            <th>Details</th>
            <th>Transaction Details</th>
            <th>Manual Ref</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reconciliations.map((item) => (
            <tr key={item.id} style={styles.row}>
              <td>{item.transaction_type}</td>
              <td>{item.date}</td>
              <td>{item.bank_account}</td>
              <td>{formatNumber(item.amount)}</td>
              <td>{item.details}</td>
              <td>{item.transaction_details}</td>
              <td>{item.manual_number}</td>
              <td>
                <button onClick={() => handleDelete(item.id)} style={styles.deleteButton}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  subHeader: {
    marginTop: '30px',
    marginBottom: '15px',
    fontSize: '1.5rem',
    color: '#003366',
  },
  unmarkedTable: {
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
  row: {
    backgroundColor: '#ffffff',
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
  deleteButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
  },
};

export default CashbookReconciliationTable;
