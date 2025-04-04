import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState({
    invoices_issued: [],
    invoices_received: [],
    cash_receipts: [],
    cash_disbursements: [],
    transactions: []
  });
  const [loading, setLoading] = useState({
    users: false,
    transactions: false
  });
  const [error, setError] = useState({
    users: '',
    transactions: ''
  });

  // Fetch users from the API
  const getUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    setError(prev => ({ ...prev, users: '' }));

    try {
      const response = await fetch('https://yoming.boogiecoin.com/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(prev => ({ ...prev, users: 'Failed to fetch users' }));
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Fetch transactions from the API
  const getTransactions = async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    setError(prev => ({ ...prev, transactions: '' }));

    try {
      const response = await fetch('https://yoming.boogiecoin.com/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(prev => ({ ...prev, transactions: 'Failed to fetch transactions' }));
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`https://yoming.boogiecoin.com/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await getUsers(); // Refresh user list
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Fetch users and transactions when component mounts
  useEffect(() => {
    getUsers();
    getTransactions();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', backgroundColor: '#fff', padding: '20px' }}>
      <h1 style={{ color: '#000' }}>Dashboard</h1>

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#000' }}>Users</h2>
        {loading.users ? (
          <p>Loading users...</p>
        ) : error.users ? (
          <p style={{ color: '#ff0000' }}>{error.users}</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {users.map((user) => (
              <li key={user.id} style={{ marginBottom: '10px', color: '#000' }}>
                {user.username} - {user.email} ({user.role})
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.role === 'CEO'}
                  title={user.role === 'CEO' ? "Cannot delete CEO" : ""}
                  style={{
                    backgroundColor: '#ff0000',
                    color: '#fff',
                    border: 'none',
                    padding: '5px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#000' }}>Transactions</h2>
        {loading.transactions ? (
          <p>Loading transactions...</p>
        ) : error.transactions ? (
          <p style={{ color: '#ff0000' }}>{error.transactions}</p>
        ) : (
          <div>
            <h3 style={{ color: '#000' }}>Invoices Issued</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {transactions.invoices_issued.map((invoice) => (
                <li key={invoice.id} style={{ marginBottom: '10px', color: '#000' }}>
                  #{invoice.invoice_number} - {invoice.amount} ({invoice.date_issued})
                </li>
              ))}
            </ul>

            <h3 style={{ color: '#000' }}>Cash Receipts</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {transactions.cash_receipts.map((receipt) => (
                <li key={receipt.id} style={{ marginBottom: '10px', color: '#000' }}>
                  {receipt.receipt_no} - {receipt.total} ({receipt.receipt_date})
                </li>
              ))}
            </ul>

            <h3 style={{ color: '#000' }}>Cash Disbursements</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {transactions.cash_disbursements.map((disbursement) => (
                <li key={disbursement.id} style={{ marginBottom: '10px', color: '#000' }}>
                  {disbursement.cheque_no} - {disbursement.cash} ({disbursement.disbursement_date})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
