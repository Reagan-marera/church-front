import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Import the Link component for navigation
import "./Home.css"; // Ensure your CSS file is properly linked

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
          <div className="juggler">
            <div className="person"></div>
            <div className="juggling-ball"></div>
            <div className="juggling-ball"></div>
            <div className="juggling-ball"></div>
          </div>
          <div className="loader-text">Loading...</div>
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <nav className="navbarhome">
            <div className="navbar-brand">
            
              <span className="company-name">YOUMING TECHNOLOGIES</span>
            </div>
          </nav>

          {/* Hero Section */}
          <header className="hero">
            <div className="hero-content">
              <i><h1>Non-Profit Financial Management Toolkit</h1></i>
              <h2>For Schools, Churches, and NGOs</h2>
              <p className="intro">
                Manage invoices, receipts, disbursements, and generate accurate
                financial reports all in one place.
              </p>
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
                title="Chart of Accounts"
                description="Categorize and organize all financial transactions with a consistent system for tracking and analyzing data."
              />
              <FeatureCard
                title="Invoice Management Template"
                description="Capture invoice data consistently, minimizing errors and improving revenue tracking."
              />
              <FeatureCard
                title="Cash Receipt Template"
                description="Streamline data entry and reduce manual recording time while ensuring accurate financial reporting."
              />
              <FeatureCard
                title="Cash Disbursement Template"
                description="Standardize outgoing cash data for effective analysis of financial information."
              />
              <FeatureCard
                title="General Ledger"
                description="Automatically analyze and post data to respective accounts, updating balances efficiently."
              />
              <FeatureCard
                title="Financial Reports"
                description="Generate comprehensive financial statements for informed decision-making by stakeholders."
              />
            </div>
          </section>

          {/* Footer Section */}
          <footer className="footer">
            <p>&copy; 2024 InstitutionFinance | All Rights Reserved</p>
          </footer>
        </>
      )}
    </div>
  );
}

// Reusable Feature Card Component
const FeatureCard = ({ title, description }) => (
  <div className="feature-card">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default Home;