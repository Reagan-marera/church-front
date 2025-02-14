import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Importing the CSS file

const Navbar = () => {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false); // State to toggle "Setup" dropdown
  const [showTransactions, setShowTransactions] = useState(false); // State to toggle "Transactions" dropdown
  const [showMore, setShowMore] = useState(false); // State to toggle "More" dropdown

  // Handle logout
  const handleLogout = () => {
    // Clear the token, role, and userId from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');

    // Refresh the page to reflect the changes
    window.location.reload();
  };

  // Retrieve token and userId from localStorage
  const storedToken = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {/* Home Link */}
        <li><Link to="/" className="nav-link">Home</Link></li>

        {/* Setup Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setShowSetup(true)}
          onMouseLeave={() => setShowSetup(false)}
        >
          <span className="nav-link">Setup</span>
          {showSetup && (
            <ul className="dropdown-menu">
              <li><Link to="/chart-of-accounts" className="dropdown-link">Chart of Accounts</Link></li>
              <li><Link to="/customer-list" className="dropdown-link">Customer List</Link></li>
              <li><Link to="/payee-list" className="dropdown-link">Payee List</Link></li>
            </ul>
          )}
        </li>

        {/* Transactions Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setShowTransactions(true)}
          onMouseLeave={() => setShowTransactions(false)}
        >
          <span className="nav-link">Transactions</span>
          {showTransactions && (
            <ul className="dropdown-menu">
              <li><Link to="/cash-receipt-journal" className="dropdown-link">Cash Receipt Journal</Link></li>
              <li><Link to="/cash-disbursement-journal" className="dropdown-link">Cash Disbursement Journal</Link></li>
              <li><Link to="/invoices" className="dropdown-link">Invoice Issued</Link></li>
              {storedToken && (
                <li><Link to="/invoice-received" className="dropdown-link">Invoice Received</Link></li>
              )}
            </ul>
          )}
        </li>

        {/* Financial Report Link (protected) */}
        {storedToken && (
          <li><Link to="/financial-report" className="nav-link">Financial Report</Link></li>
        )}

        {/* General Ledger Accounts Link */}
        <li><Link to="/general-report" className="nav-link">General Ledger Accounts</Link></li>

        {/* More Dropdown */}
        {storedToken && (
          <li
            className="dropdown"
            onMouseEnter={() => setShowMore(true)}
            onMouseLeave={() => setShowMore(false)}
          >
            <span className="nav-link">More</span>
            {showMore && (
              <ul className="dropdown-menu">
                <li><Link to="/subaccounts" className="dropdown-link">Subaccounts</Link></li>
                {storedUserId && (
                  <>
                    <li><Link to="/create-pledge" className="dropdown-link">Create Pledge</Link></li>
                    <li><Link to={`/member/${storedUserId}`} className="dropdown-link">Member Info</Link></li>
                  </>
                )}
                <li><Link to="/payment-form" className="dropdown-link">Payment</Link></li>
              </ul>
            )}
          </li>
        )}

        {/* Logout Link */}
        {storedToken && (
          <li><button onClick={handleLogout} className="nav-link logout-button">Logout</button></li>
        )}

        {/* Register and Login Links */}
        {!storedToken && (
          <>
            <li><Link to="/register" className="nav-link">Register</Link></li>
            <li><Link to="/login" className="nav-link">Login</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;