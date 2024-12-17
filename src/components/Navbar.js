import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ token, role }) => {
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    // Clear the token and role from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // Refresh the page to reflect the changes
    window.location.reload();  // This will refresh the entire page
  };

  return (
    <nav style={styles.navbar}>
      <ul style={styles.navList}>
        <li><Link to="/" style={styles.navLink}>Home</Link></li>
        <li><Link to="/chart-of-accounts" style={styles.navLink}>Chart of Accounts</Link></li>
        <li><Link to="/invoices" style={styles.navLink}>Invoices</Link></li>
        <li><Link to="/cash-receipt-journal" style={styles.navLink}>Cash Receipt Journal</Link></li>
        <li><Link to="/cash-disbursement-journal" style={styles.navLink}>Cash Disbursement Journal</Link></li>

        {/* Show the Dashboard link only if the user is logged in */}
        {token && (
          <li><Link to="/dashboard" style={styles.navLink}>Dashboard</Link></li>
        )}

        {/* Show Register and Login only if the user is not logged in */}
        {!token && (
          <>
            <li><Link to="/register" style={styles.navLink}>Register</Link></li>
            <li><Link to="/login" style={styles.navLink}>Login</Link></li>
          </>
        )}

        {/* Show Logout link only for logged-in users */}
        {token && (
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
  navLinkHover: {
    color: '#f2f2f2', // Slightly lighter text on hover
    backgroundColor: '#004b6d', // Darker blue background on hover
    borderRadius: '4px',
  }
};

export default Navbar;
