import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
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
import CustomerList from './components/CustomerList'; // Import CustomerList
import PayeeList from './components/PayeeList'; // Import PayeeList
import InvoiceReceived from './components/InvoiceReceived'; // Import the InvoiceReceived component
import Subaccounts from './components/Subaccounts ';
import RevenueTransactions from './components/RevenueTransactions'; // Import the RevenueTransactions component
import ExpenseTransactions from './components/ExpenseTransactions';
import AssetTransactions from './components/AssetTransactions';
import LiabilityTransactions from './components/LiabilityTransactions';
import NetAssets from './components/NetAssets';
import TrialBalance from './components/TrialBalance';
import AccountsTransactions from './components/AccountsTransactions';
import Balance from './components/Balance';

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

          {/* General Report Route (protected) */}
          <Route
            path="/general-report"
            element={
              <ProtectedRoute>
                <GeneralReport />
              </ProtectedRoute>
            }
          />

          {/* Customer List Route (protected) */}
          <Route
            path="/customer-list"
            element={
              <ProtectedRoute>
                <CustomerList />
              </ProtectedRoute>
            }
          />

          {/* Payee List Route (protected) */}
          <Route
            path="/payee-list"
            element={
              <ProtectedRoute>
                <PayeeList />
              </ProtectedRoute>
            }
          />
          
          {/* Add Route for InvoiceReceived */}
          <Route
            path="/invoice-received"
            element={
              <ProtectedRoute>
                <InvoiceReceived />
              </ProtectedRoute>
            }
          />

          {/* Add Subaccounts Route (protected) */}
          <Route
            path="/subaccounts"
            element={
              <ProtectedRoute>
                <Subaccounts />
              </ProtectedRoute>
            }
          />

          {/* Add RevenueTransactions Route (protected) */}
          <Route
            path="/revenue-transactions"
            element={
              
                <RevenueTransactions />
              
            }
          />
        <Route
            path="/expense-transactions"
            element={
              
                <ExpenseTransactions />
              
            }
          />
          <Route
            path="/asset-transactions"
            element={
              
                <AssetTransactions />
              
            }
          />
           <Route
            path="/liability-transactions"
            element={
              
                <LiabilityTransactions />
              
            }
          />
           <Route
            path="/net-transactions"
            element={
              
                <NetAssets />
              
            }
          />
           <Route
            path="/trial-transactions"
            element={
              
                <TrialBalance />
              
            }
          />
           <Route
            path="/accounts-transactions"
            element={
              
                <AccountsTransactions />
              
            }
          />
           <Route
            path="/balance-transactions"
            element={
              
                <Balance />
              
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
