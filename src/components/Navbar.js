import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Importing the new CSS file

const Navbar = ({ token, role }) => {
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    // Clear the token and role from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');  // Ensure userId is removed too

    // Refresh the page to reflect the changes
    window.location.reload();  // This will refresh the entire page
  };

  // Retrieve token and userId from localStorage
  const storedToken = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {/* Home Link */}
        <li><Link to="/" className="nav-link">Home</Link></li>

        {/* Other navigation links */}
        <li><Link to="/chart-of-accounts" className="nav-link">Chart of Accounts</Link></li>
        <li><Link to="/invoices" className="nav-link">Invoice Issued</Link></li>
        <li><Link to="/cash-receipt-journal" className="nav-link">Cash Receipt Journal</Link></li>
        <li><Link to="/cash-disbursement-journal" className="nav-link">Cash Disbursement Journal</Link></li>

        {/* Financial Report Link (protected) */}
        {storedToken && (
          <li><Link to="/financial-report" className="nav-link">Financial Report</Link></li>
        )}

        {/* Show General Report link to all users, no token required */}
        <li><Link to="/general-report" className="nav-link">General Ledger Accounts</Link></li>

        {/* Show Customer List and Payee List links */}
        {storedToken && (
          <>
            <li><Link to="/customer-list" className="nav-link">Customer List</Link></li>
            <li><Link to="/payee-list" className="nav-link">Payee List</Link></li>
          </>
        )}

        {/* Show the Dashboard link only if the user is logged in */}
        {storedToken && (
          <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
        )}

        {/* Show Register and Login only if the user is not logged in */}
        {!storedToken && (
          <>
            <li><Link to="/register" className="nav-link">Register</Link></li>
            <li><Link to="/login" className="nav-link">Login</Link></li>
          </>
        )}

        {/* Show Create Pledge and Member Info only if the user is logged in and has a userId */}
        {storedToken && storedUserId && (
          <>
            <li><Link to="/create-pledge" className="nav-link">Create Pledge</Link></li>
            <li><Link to={`/member/${storedUserId}`} className="nav-link">Member Info</Link></li>
          </>
        )}

        {/* Show Payment link only if the user is logged in */}
        {storedToken && (
          <li><Link to="/payment-form" className="nav-link">Payment</Link></li>
        )}

        {/* Show Invoice Received link only if the user is logged in */}
        {storedToken && (
          <li><Link to="/invoice-received" className="nav-link">Invoice Received</Link></li>
        )}

        {/* Show Logout link only for logged-in users */}
        {storedToken && (
          <li><button onClick={handleLogout} className="nav-link">Logout</button></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
