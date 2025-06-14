import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import ChartOfAccountsTable from './components/ChartOfAccountsTable';
import InvoicesTable from './components/InvoicesTable';
import CashReceiptJournalTable from './components/CashReceiptJournalTable';
import CashDisbursementJournalTable from './components/CashDisbursementJournalTable';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Home from './Home';
import MemberInfo from './components/MemberInfo';
import CreatePledge from './components/CreatePledge';
import PaymentForm from './components/Stk';
import FinancialReport from './components/FinancialReport';
import GeneralReport from './components/GeneralReport';
import CustomerList from './components/CustomerList';
import PayeeList from './components/PayeeList';
import InvoiceReceived from './components/InvoiceReceived';
import AccountSelection from './components/GeneralJournal';
import RevenueTransactions from './components/RevenueTransactions';
import ExpenseTransactions from './components/ExpenseTransactions';
import AssetTransactions from './components/AssetTransactions';
import LiabilityTransactions from './components/LiabilityTransactions';
import NetAssets from './components/NetAssets';
import TrialBalance from './components/TrialBalance';
import AccountsTransactions from './components/Notes';
import Incomestatement from './components/Income';
import CashFlowApp from './components/CashFlowApp';
import AboutUs from './components/AboutUs';
import { BalanceProvider } from './components/BalanceContext'; // Import BalanceProvider
import Debtors from './components/Debtors';
import CashbookReconciliationTable from './components/CashbookReconciliationTable';
import Creditors from './components/Creditors';
import CashbookReconciliationForm from './components/CashbookReconciliationForm';
import EstimateTable from './components/EstimateTable';
function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');

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

  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const ProtectedRouteWithRole = ({ children, allowedRoles }) => {
    if (!token || !allowedRoles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <BalanceProvider> {/* Wrap the application with BalanceProvider */}
        <Navbar token={token} role={role} />
        <div className="container">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/debtors" element={<Debtors />} />
            <Route path="/creditors" element={<Creditors />} />
            <Route path="/Estimate" element={<EstimateTable/>} />
            <Route path="/cashreco" element={<CashbookReconciliationTable/>} />
            <Route path="/cashrecoform" element={<CashbookReconciliationForm/>} />




            <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
            <Route path="/chart-of-accounts" element={<ProtectedRoute><ChartOfAccountsTable /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesTable /></ProtectedRoute>} />
            <Route path="/cash-receipt-journal" element={<ProtectedRoute><CashReceiptJournalTable /></ProtectedRoute>} />
            <Route path="/cash-disbursement-journal" element={<ProtectedRoute><CashDisbursementJournalTable /></ProtectedRoute>} />
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/member/:user_id" element={<ProtectedRoute><MemberInfo /></ProtectedRoute>} />
            <Route path="/create-pledge" element={<ProtectedRoute><CreatePledge username={username} /></ProtectedRoute>} />
            <Route path="/payment-form" element={<ProtectedRoute><PaymentForm /></ProtectedRoute>} />
            <Route path="/financial-report" element={<ProtectedRoute><FinancialReport /></ProtectedRoute>} />
            <Route path="/general-report" element={<ProtectedRoute><GeneralReport /></ProtectedRoute>} />
            <Route path="/customer-list" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
            <Route path="/payee-list" element={<ProtectedRoute><PayeeList /></ProtectedRoute>} />
            <Route path="/invoice-received" element={<ProtectedRoute><InvoiceReceived /></ProtectedRoute>} />
            <Route path="/general-journal" element={<ProtectedRoute><AccountSelection /></ProtectedRoute>} />
            <Route path="/revenue-transactions" element={<ProtectedRoute><RevenueTransactions /></ProtectedRoute>} />
            <Route path="/expense-transactions" element={<ProtectedRoute><ExpenseTransactions /></ProtectedRoute>} />
            <Route path="/asset-transactions" element={<ProtectedRoute><AssetTransactions /></ProtectedRoute>} />
            <Route path="/liability-transactions" element={<ProtectedRoute><LiabilityTransactions /></ProtectedRoute>} />
            <Route path="/net-transactions" element={<ProtectedRoute><NetAssets /></ProtectedRoute>} />
            <Route path="/trial-transactions" element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />
            <Route path="/accounts-transactions" element={<ProtectedRoute><AccountsTransactions /></ProtectedRoute>} />
            <Route path="/income-transactions" element={<ProtectedRoute><Incomestatement /></ProtectedRoute>} />
            <Route path="/cash-flow" element={<ProtectedRoute><CashFlowApp /></ProtectedRoute>} />
          </Routes>
        </div>
      </BalanceProvider>
    </Router>
  );
}

export default App;
