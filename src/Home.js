import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiLoader } from "react-icons/fi"; // Correct import for Feather Icons loader
import {
  FaChartLine,
  FaFileInvoice,
  FaMoneyCheckAlt,
  FaCashRegister,
  FaBook,
  FaFileAlt,
  FaLaptopCode,
} from "react-icons/fa"; // All other Font Awesome icons
import "./Home.css"; // Ensure your CSS file is properly linked

// Reusable Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

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
        <div className="loader" aria-label="Loading">
          <FiLoader className="spinner-icon" />
          <div className="loader-text">Loading...</div>
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <nav className="navbar-home">
            <div className="navbar-brand">
              <FaLaptopCode className="brand-icon" />
              <span className="company-name">YOUMING TECHNOLOGIES</span>
            </div>
            <div className="navbar-links">
              
            </div>
          </nav>

          {/* Hero Section */}
          <header className="hero">
            <div className="hero-content">
              <h1>Non-Profit Financial Management Toolkit</h1>
              <h2>For Schools, Churches, and NGOs</h2>
              <p className="intro">
                Manage invoices, receipts, disbursements, and generate accurate
                financial reports—all in one place.
              </p>
              <Link to="/register" className="cta-button">
                Get Started
              </Link>
            </div>
          </header>

          {/* Features Section */}
          <section className="features">
            <h2 className="features-title">Our Core Features</h2>
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
              <p className="attractive-text">
                Code Engineered and Maintained by{" "}
                <a href="mailto:marierareagan@gmail.com" className="highlight">
                  marierareagan@gmail.com
                </a>
              </p>
              <div className="footer-links">
                <Link to="/privacy-policy">Privacy Policy</Link>
                <Link to="/terms-of-service">Terms of Service</Link>
                <Link to="/about-us">About Us</Link>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default Home;