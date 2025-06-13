import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCog,
  FaExchangeAlt,
  FaFileInvoice,
  FaChartLine,
  FaBook,
  FaEllipsisH,
  FaUserPlus,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaFacebook,
  FaWhatsapp,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    window.location.reload();
  };

  const storedToken = localStorage.getItem("token");
  const storedUserId = localStorage.getItem("userId");

  const socialMediaLinks = [
    {
      name: "Facebook",
      icon: <FaFacebook className="dropdown-icon" />,
      url: "https://www.facebook.com/profile.php?id=61575497248754",
    },
    {
      name: "TikTok",
      icon: <FaTiktok className="dropdown-icon" />,
      url: "https://www.tiktok.com/@youmingtechnologies",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp className="dropdown-icon" />,
      url: "https://wa.me/0783001125",
    },
  ];

  const contactInfo = [
    {
      name: "Email",
      icon: <FaEnvelope className="dropdown-icon" />,
      url: "mailto:youmingtechnologies@gmail.com",
    },
    {
      name: "Phone",
      icon: <FaPhone className="dropdown-icon" />,
      url: "tel:+254783001125",
    },
  ];

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {/* Home */}
        <li>
          <Link to="/" className="nav-link">
            <FaHome className="nav-icon" /> Home
          </Link>
        </li>
        <li>
          <Link to="/about-us" className="nav-link">
            <FaEllipsisH className="nav-icon" /> About us
          </Link>
        </li>

        {/* Dashboard */}
        <li>
          <Link to="/dashboard" className="nav-link">
            <FaTachometerAlt className="nav-icon" /> Dashboard
          </Link>
        </li>

        {/* Setup Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setShowSetup(true)}
          onMouseLeave={() => setShowSetup(false)}
        >
          <span className="nav-link">
            <FaCog className="nav-icon" /> Setup
          </span>
          {showSetup && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/chart-of-accounts" className="dropdown-link">
                  <FaChartLine className="dropdown-icon" /> Chart of Accounts
                </Link>
              </li>
              <li>
                <Link to="/customer-list" className="dropdown-link">
                  <FaBook className="dropdown-icon" /> Customer List
                </Link>
              </li>
              <li>
                <Link to="/payee-list" className="dropdown-link">
                  <FaBook className="dropdown-icon" /> Payee List
                </Link>
              </li>
              <li>
                <Link to="/Estimate" className="dropdown-link">
                  <FaBook className="dropdown-icon" /> Budget
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Transactions Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setShowTransactions(true)}
          onMouseLeave={() => setShowTransactions(false)}
        >
          <span className="nav-link">
            <FaExchangeAlt className="nav-icon" /> Transactions
          </span>
          {showTransactions && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/general-journal" className="dropdown-link">
                  <FaBook className="dropdown-icon" /> General Journal
                </Link>
              </li>
              <li>
                <Link to="/cash-receipt-journal" className="dropdown-link">
                  <FaFileInvoice className="dropdown-icon" /> Cash Receipt Journal
                </Link>
              </li>
              <li>
                <Link to="/cash-disbursement-journal" className="dropdown-link">
                  <FaFileInvoice className="dropdown-icon" /> Cash Disbursement Journal
                </Link>
              </li>
              <li>
                <Link to="/invoices" className="dropdown-link">
                  <FaFileInvoice className="dropdown-icon" /> Invoice Issued
                </Link>
              </li>
              <li>
                <Link to="/invoice-received" className="dropdown-link">
                  <FaFileInvoice className="dropdown-icon" /> Invoice Received
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* General Ledger (if logged in) */}
        {storedToken && (
          <li>
            <Link to="/financial-report" className="nav-link">
              <FaChartLine className="nav-icon" /> General Ledger
            </Link>
          </li>
        )}

        {/* Accounts Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setShowAccounts(true)}
          onMouseLeave={() => setShowAccounts(false)}
        >
          <span className="nav-link">
            <FaBook className="nav-icon" /> Accounts
          </span>
          {showAccounts && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/debtors" className="dropdown-link">
                  <FaBook className="dropdown-icon" /> Debtors
                </Link>
              </li>
              <li>
                <Link to="/creditors" className="dropdown-link">
                  <FaBook className="dropdown-icon" /> Creditors
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Financial Report */}
        <li>
          <Link to="/general-report" className="nav-link">
            <FaBook className="nav-icon" /> Financial Report
          </Link>
        </li>

        {/* More Dropdown */}
        {storedToken && (
          <li
            className="dropdown"
            onMouseEnter={() => setShowMore(true)}
            onMouseLeave={() => setShowMore(false)}
          >
            <span className="nav-link">
              <FaEllipsisH className="nav-icon" /> More
            </span>
            {showMore && (
              <ul className="dropdown-menu">
                <li className="dropdown-section-header">Connect With Us</li>
                {socialMediaLinks.map((social, index) => (
                  <li key={index}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-link social-link"
                    >
                      {social.icon} {social.name}
                    </a>
                  </li>
                ))}
                <li className="dropdown-section-header">Contact Us</li>
                {contactInfo.map((contact, index) => (
                  <li key={index}>
                    <a
                      href={contact.url}
                      className="dropdown-link contact-link"
                    >
                      {contact.icon} {contact.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}

        {/* Logout */}
        {storedToken && (
          <li>
            <button onClick={handleLogout} className="nav-link logout-button">
              <FaSignOutAlt className="nav-icon" /> Logout
            </button>
          </li>
        )}

        {/* Register / Login */}
        {!storedToken && (
          <>
          
            <li>
              <Link to="/login" className="nav-link">
                <FaSignInAlt className="nav-icon" /> Login
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
