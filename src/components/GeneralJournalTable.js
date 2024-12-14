import React, { useEffect, useState } from 'react';

const GeneralJournalTable = () => {
  const [journals, setJournals] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    coa_id: '',  // Use coa_id to store the selected account's ID
    description: '',
    debit: '',
    credit: '',
  });

  useEffect(() => {
    const fetchChartOfAccounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/chart-of-accounts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chart of accounts');
        }

        const data = await response.json();
        setChartOfAccounts(data); // Store the chart of accounts for dropdown
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchJournals = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/general-journals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch journals because your session expired please login again');
        }

        const data = await response.json();
        setJournals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartOfAccounts();
    fetchJournals();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/general-journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: formData.date,
          coa_id: formData.coa_id, // Use coa_id in the API request
          description: formData.description,
          debit: parseFloat(formData.debit),
          credit: parseFloat(formData.credit),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create journal entry');
      }

      const newJournal = await response.json();
      setJournals([...journals, newJournal]);
      setFormData({ date: '', coa_id: '', description: '', debit: '', credit: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const getAccountNameById = (coaId) => {
    const account = chartOfAccounts.find((account) => account.id === coaId);
    return account ? account.account_name : 'N/A';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>General Journal</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <>
          <form style={styles.form} onSubmit={handleFormSubmit}>
            <div style={styles.formRow}>
              <label style={styles.label}>Date:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Account Name:</label>
              <select
                name="coa_id"
                value={formData.coa_id}
                onChange={handleInputChange}
                required
                style={styles.input}
              >
                <option value="">Select an Account</option>
                {chartOfAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Description:</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Debit:</label>
              <input
                type="number"
                name="debit"
                value={formData.debit}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Credit:</label>
              <input
                type="number"
                name="credit"
                value={formData.credit}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.button}>
              Add Entry
            </button>
          </form>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>ID</th>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Account Name</th>
                <th style={styles.tableHeader}>Description</th>
                <th style={styles.tableHeader}>Debit</th>
                <th style={styles.tableHeader}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((journal) => (
                <tr key={journal.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{journal.id}</td>
                  <td style={styles.tableCell}>{journal.date}</td>
                  <td style={styles.tableCell}>{getAccountNameById(journal.coa_id)}</td>
                  <td style={styles.tableCell}>{journal.description}</td>
                  <td style={styles.tableCell}>{journal.debit}</td>
                  <td style={styles.tableCell}>{journal.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    margin: '0 auto',
    padding: '20px',
    maxWidth: '1200px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '2rem',
    color: '#333',
  },
  form: {
    marginBottom: '20px',
  },
  formRow: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  button: {
    backgroundColor: '#007BFF',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#f8f8f8',
    color: '#333',
    padding: '12px 15px',
    border: '1px solid #ddd',
    textAlign: 'left',
    fontSize: '1rem',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  tableCell: {
    padding: '12px 15px',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
};

export default GeneralJournalTable;
