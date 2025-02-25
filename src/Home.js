import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartLine, FaFileInvoice, FaMoneyCheckAlt, FaCashRegister, FaBook, FaFileAlt } from "react-icons/fa"; // Icons for features
import { FiLoader } from "react-icons/fi"; // Loader icon
import "./Home.css"; // Ensure your CSS file is properly linked
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faMoneyBill,
  faCreditCard,
  
} from "@fortawesome/free-solid-svg-icons";
function Home() {
  const [loading, setLoading] = useState(true);

  // Simulate a loading delay (e.g., fetching data)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 seconds delay for demonstration purposes
    return () => clearTimeout(timer); // Cleanup the timeout on unmount
  }, []);

  return (
    <div className="App">
      {/* Loader */}
      {loading ? (
        <div className="loader">
          <FiLoader className="spinner-icon" />
          <div className="loader-text">Loading...</div>
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <nav className="navbarhome">
    <div className="navbar-brand">
        <i className="fas fa-laptop-code"></i> {/* Technology icon */}
        <span className="company-name">YOUMING TECHNOLOGIES</span>
    </div>
</nav>

          {/* Hero Section */}
          <header className="hero">
            <div className="hero-content">
              <h1 >Non-Profit Financial Management Toolkit</h1>
              <h2 className="navbar-brands">For Schools, Churches, and NGOs</h2>
              <h1><p className="intro">
                Manage invoices, receipts, disbursements, and generate accurate
                financial reports all in one place.
              </p></h1>
              <Link to="/register" className="cta-button">
                Get Started
              </Link>
            </div>
          </header>

          {/* Features Section */}
          <section className="features">
            <h2 className="intro2">Our Core Features</h2>
            <div className="feature-cards">
              <FeatureCard
                icon={<FaChartLine />}
                title="Chart of Accounts"
                description="Categorize and organize all financial transactions with a consistent system for tracking and analyzing data."
              />
              <FeatureCard
                icon={<FaFileInvoice />}
                title="Invoice Management Template"
                description="Capture invoice data consistently, minimizing errors and improving revenue tracking."
              />
              <FeatureCard
                icon={<FaMoneyCheckAlt />}
                title="Cash Receipt Template"
                description="Streamline data entry and reduce manual recording time while ensuring accurate financial reporting."
              />
              <FeatureCard
                icon={<FaCashRegister />}
                title="Cash Disbursement Template"
                description="Standardize outgoing cash data for effective analysis of financial information."
              />
              <FeatureCard
                icon={<FaBook />}
                title="General Ledger"
                description="Automatically analyze and post data to respective accounts, updating balances efficiently."
              />
              <FeatureCard
                icon={<FaFileAlt />}
                title="Financial Reports"
                description="Generate comprehensive financial statements for informed decision-making by stakeholders."
              />
            </div>
          </section>

          {/* Footer Section */}
          <footer className="footer">
            <div className="footer-content">
              <p>&copy; 2024 InstitutionFinance | All Rights Reserved</p>
              <div className="footer-links">
                <Link to="/privacy-policy">Privacy Policy</Link>
                <Link to="/terms-of-service">Terms of Service</Link>
                <Link to="/contact-us">Contact Us</Link>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

// Reusable Feature Card Component with Icons
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default Home;