import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [users, setUsers] = useState([]); // Default to an empty array
  const [transactions, setTransactions] = useState([]); // Default to an empty array
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: '' });
  const [newTransaction, setNewTransaction] = useState({ amount: '', description: '' });
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [errorTransactions, setErrorTransactions] = useState('');

  // Fetch users from the API
  const getUsers = async () => {
    try {
      const response = await fetch('htps://finance.boogiecoin.com/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Fetched Users:', data); // Log the fetched data

      // Ensure data is an array before setting the state
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Expected an array but got:', data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch transactions from the API
  const getTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch('htps://finance.boogiecoin.com/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Fetched Transactions:', data);

      // Check if the response contains the expected arrays
      if (data && data.cash_disbursements && data.cash_receipts && data.invoices_issued) {
        const allTransactions = [
          ...data.cash_disbursements,
          ...data.cash_receipts,
          ...data.invoices_issued
        ];
        setTransactions(allTransactions);
      } else {
        setErrorTransactions('Invalid transactions data');
      }
    } catch (error) {
      setErrorTransactions('Error fetching transactions');
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle creating a new user
  const handleCreateUser = async () => {
    try {
      const response = await fetch('htps://finance.boogiecoin.com/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      if (response.ok) {
        getUsers(); // Refresh user list after creating a new user
      } else {
        console.error('Error creating user:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Handle creating a new transaction
  const handleCreateTransaction = async () => {
    try {
      const response = await fetch('htps://finance.boogiecoin.com/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction),
      });
      if (response.ok) {
        getTransactions(); // Refresh transaction list after creating a new transaction
      } else {
        console.error('Error creating transaction:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  // Fetch users and transactions when component mounts
  useEffect(() => {
    getUsers();
    getTransactions();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      <div>
        <h2>Users</h2>
        <ul>
          {Array.isArray(users) && users.map((user) => (
            <li key={user.id}>
              {user.username} - {user.email} ({user.role})
            </li>
          ))}
        </ul>

        <h2>Create User</h2>
        <input
          type="text"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          placeholder="Username"
        />
        <input
          type="email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          placeholder="Email"
        />
        <input
          type="password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          placeholder="Password"
        />
        <input
          type="text"
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          placeholder="Role (ceo/user)"
        />
        <button onClick={handleCreateUser}>Create User</button>
      </div>

      <div>
        <h2>Transactions</h2>
        {loadingTransactions ? (
          <p>Loading transactions...</p>
        ) : errorTransactions ? (
          <p>{errorTransactions}</p>
        ) : (
          <ul>
            {Array.isArray(transactions) && transactions.map((transaction, index) => (
              <li key={index}>
                Amount: {transaction.amount} - Description: {transaction.description} ({transaction.date})
              </li>
            ))}
          </ul>
        )}

        <h2>Create Transaction</h2>
        <input
          type="number"
          value={newTransaction.amount}
          onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
          placeholder="Amount"
        />
        <input
          type="text"
          value={newTransaction.description}
          onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
          placeholder="Description"
        />
        <button onClick={handleCreateTransaction}>Create Transaction</button>
      </div>
    </div>
  );
};

export default Dashboard;
