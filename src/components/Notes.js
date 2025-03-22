import React, { useEffect, useState } from 'react';
import './TransactionList.css'; // Import the CSS file

const AccountsTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token);

      if (!token) {
        setError(new Error('No token found. Please log in again.'));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/transactions/accounts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch transactions. Please try again later.');
        }

        const data = await response.json();
        console.log('Data:', data);

        // Convert the note groups into an array for easier rendering
        const enrichedNoteGroups = Object.entries(data).map(([noteNumber, group]) => ({
          note_number: noteNumber,
          ...group,
        }));

        setTransactions(enrichedNoteGroups);
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES', // Kenyan Shillings
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading financial data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Notes To The Financial Statements</h1>
      {transactions.length === 0 ? (
        <div className="no-data">No transactions available.</div>
      ) : (
        transactions.map((group, index) => (
          <div key={index} className="note-group">
            <h2>Note {group.note_number || 'N/A'}</h2>
            <table>
              <thead>
                <tr>
                  <th>Parent Account</th>
                  <th>Relevant Account</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Render Parent Account and Relevant Accounts */}
                {group.relevant_accounts.map((account, idx) => (
                  <tr key={idx}>
                    <td>{idx === 0 ? group.parent_account || 'N/A' : ''}</td>
                    <td style={{ paddingLeft: idx > 0 ? '20px' : '0' }}>
                      {idx > 0 ? '↳ ' : ''}
                      {account}
                    </td>
                    <td>{formatCurrency(group.amounts[idx])}</td>
                  </tr>
                ))}
                {/* Render Total Amount */}
                <tr>
                  <td colSpan="2"><strong>Total Amount</strong></td>
                  <td><strong>{formatCurrency(group.total_amount)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default AccountsTransactions;