import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <ul style={styles.navList}>
        <li><Link to="/" style={styles.navLink}>Home</Link></li>
        <li><Link to="/chart-of-accounts" style={styles.navLink}>Chart of Accounts</Link></li>
        <li><Link to="/invoices" style={styles.navLink}>Invoices</Link></li>
        <li><Link to="/cash-receipt-journal" style={styles.navLink}>Cash Receipt Journal</Link></li>
        <li><Link to="/cash-disbursement-journal" style={styles.navLink}>Cash Disbursement Journal</Link></li>
        <li><Link to="/register" style={styles.navLink}>Register</Link></li>
        <li><Link to="/login" style={styles.navLink}>Login</Link></li>
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#333',
    padding: '10px 20px',
  },
  navList: {
    listStyleType: 'none',
    display: 'flex',
    justifyContent: 'space-around',
    padding: 0,
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
  }
};

export default Navbar;
