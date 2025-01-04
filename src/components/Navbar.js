import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    <nav style={styles.navbar}>
      <ul style={styles.navList}>
        {/* Home Link */}
        <li><Link to="/" style={styles.navLink}>Home</Link></li>

        {/* Other navigation links */}
        <li><Link to="/usertransaction" style={styles.navLink}>Transactions</Link></li>
        <li><Link to="/chart-of-accounts" style={styles.navLink}>Chart of Accounts</Link></li>
        <li><Link to="/invoices" style={styles.navLink}>Invoices</Link></li>
        <li><Link to="/cash-receipt-journal" style={styles.navLink}>Cash Receipt Journal</Link></li>
        <li><Link to="/cash-disbursement-journal" style={styles.navLink}>Cash Disbursement Journal</Link></li>

        {/* Show the Dashboard link only if the user is logged in */}
        {storedToken && (
          <li><Link to="/dashboard" style={styles.navLink}>Dashboard</Link></li>
        )}

        {/* Show Register and Login only if the user is not logged in */}
        {!storedToken && (
          <>
            <li><Link to="/register" style={styles.navLink}>Register</Link></li>
            <li><Link to="/login" style={styles.navLink}>Login</Link></li>
          </>
        )}

        {/* Show Create Pledge and Member Info only if the user is logged in and has a userId */}
        {storedToken && storedUserId && (
          <>
            <li><Link to="/create-pledge" style={styles.navLink}>Create Pledge</Link></li>
            <li><Link to={`/member/${storedUserId}`} style={styles.navLink}>Member Info</Link></li>
          </>
        )}

        {/* Show Logout link only for logged-in users */}
        {storedToken && (
          <li><button onClick={handleLogout} style={styles.navLink}>Logout</button></li>
        )}
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#005a8d', // World Bank blue
    padding: '15px 30px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Slight shadow for modern look
  },
  navList: {
    listStyleType: 'none',
    display: 'flex',
    justifyContent: 'center', // Align items to the center
    padding: 0,
  },
  navLink: {
    color: '#ffffff', // White text for links
    textDecoration: 'none',
    padding: '12px 20px',
    fontSize: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", // Clean font
    fontWeight: '600', // Bold for emphasis
    transition: 'all 0.3s ease',
  },
};

export default Navbar;
