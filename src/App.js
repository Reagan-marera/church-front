import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import UsersTable from './components/UsersTable';
import ChartOfAccountsTable from './components/ChartOfAccountsTable';
import InvoicesTable from './components/InvoicesTable';
import CashReceiptJournalTable from './components/CashReceiptJournalTable';
import CashDisbursementJournalTable from './components/CashDisbursementJournalTable';
import Navbar from './components/Navbar'; // Import the Navbar
import Dashboard from './components/Dashboard'; // Import Dashboard component
import Home from './Home';
import MemberInfo from './components/MemberInfo';
import CreatePledge from './components/CreatePledge';
import PaymentForm from './components/Stk';
import FinancialReport from './components/FinancialReport';
import GeneralReport from './components/GeneralReport'; // Add the import for GeneralReport

function App() {
  const [token, setToken] = useState(null); // Manage the authentication token
  const [role, setRole] = useState(null); // Manage the user role
  const [username, setUsername] = useState('');

  // Fetch username and token from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      console.log('No username found');
    }

    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
    }
  }, []);

  // ProtectedRoute component to wrap around routes that require authentication
  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // ProtectedRouteWithRole component for role-based protection (admin, user, etc.)
  const ProtectedRouteWithRole = ({ children, allowedRoles }) => {
    if (!token || !allowedRoles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

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
          <Route path="/usertransaction" element={<ProtectedRoute><UsersTable /></ProtectedRoute>} />
          <Route path="/chart-of-accounts" element={<ProtectedRoute><ChartOfAccountsTable /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoicesTable /></ProtectedRoute>} />
          <Route path="/cash-receipt-journal" element={<ProtectedRoute><CashReceiptJournalTable /></ProtectedRoute>} />
          <Route path="/cash-disbursement-journal" element={<ProtectedRoute><CashDisbursementJournalTable /></ProtectedRoute>} />

          {/* Home Route */}
          <Route path="/" element={<Home />} />

          {/* Dashboard Route (protected) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Member Info Route (protected) */}
          <Route
            path="/member/:user_id"
            element={
              <ProtectedRoute>
                <MemberInfo />
              </ProtectedRoute>
            }
          />

          {/* Create Pledge Route (protected) */}
          <Route
            path="/create-pledge"
            element={
              <ProtectedRoute>
                <CreatePledge username={username} />
              </ProtectedRoute>
            }
          />

          {/* Payment Form Route (protected) */}
          <Route
            path="/payment-form"
            element={
              <ProtectedRoute>
                <PaymentForm />
              </ProtectedRoute>
            }
          />

          {/* Financial Report Route (protected) */}
          <Route
            path="/financial-report"
            element={
              <ProtectedRoute>
                <FinancialReport />
              </ProtectedRoute>
            }
          />

<Route
          path="/general-report"
          element={
            <ProtectedRoute>
              <GeneralReport />
            </ProtectedRoute>
          }
        />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
