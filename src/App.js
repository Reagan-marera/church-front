import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import UsersTable from './components/UsersTable';
import ChartOfAccountsTable from './components/ChartOfAccountsTable';
import InvoicesTable from './components/InvoicesTable';
import CashReceiptJournalTable from './components/CashReceiptJournalTable';
import CashDisbursementJournalTable from './components/CashDisbursementJournalTable';
import Navbar from './components/Navbar'; // Import the Navbar

function App() {
  const [token, setToken] = useState(null); // Manage the authentication token
  const [role, setRole] = useState(null); // Manage the user role

  // Check if user is logged in on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
    }
  }, []);

  return (
    <Router>
      {/* Navbar - It will check token to display relevant links */}
      <Navbar token={token} role={role} />

      <div className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />

          {/* Protected Routes (only accessible if logged in) */}
          <Route path="/" element={token ? <UsersTable /> : <Login setToken={setToken} setRole={setRole} />} />
          <Route path="/chart-of-accounts" element={token ? <ChartOfAccountsTable /> : <Login setToken={setToken} setRole={setRole} />} />
          <Route path="/invoices" element={token ? <InvoicesTable /> : <Login setToken={setToken} setRole={setRole} />} />
          <Route path="/cash-receipt-journal" element={token ? <CashReceiptJournalTable /> : <Login setToken={setToken} setRole={setRole} />} />
          <Route path="/cash-disbursement-journal" element={token ? <CashDisbursementJournalTable /> : <Login setToken={setToken} setRole={setRole} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
