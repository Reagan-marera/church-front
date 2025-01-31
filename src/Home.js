import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import the Link component
import './Home.css';

function Home() {
  const [loading, setLoading] = useState(true);

  // Simulate a loading delay (e.g., fetching data)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 seconds delay for demonstration
    return () => clearTimeout(timer);
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
          <div className="navbarhome">
  <div className="navbar-brand">
    <img src="https://i.pinimg.com/236x/59/c2/f2/59c2f2560376e073618614fbb0d9b9ed.jpg" alt="Logo" className="navbar-logo" />
    <span className="company-name">YOUMING TECHNOLOGIES</span>
  </div>
</div>

          
          {/* Hero Section */}
          <header className="hero">
            <div className="hero-content">
              <h1>Non-Profit Making Organizations Financial Management Tool Kit</h1>
              <h2>For Schools, Churches, and NGOs</h2>
              <p>Manage your invoices,receipts, disbursements, and generate accurate financial reports all in one place.</p>
              <Link to="/register" className="cta-button">Get Started</Link>
            </div>
          </header>

          {/* Features Section */}
          <section className="features">
            <h2>Our Core Features</h2>
            
            <div className="feature-cards">
            <div className="feature-card">
                <h3>Chart of accounts</h3>
                <p>This template provides you with a framework that categorizes and organize all Organization's financial transactions. It will provide you with a consistent and uniforn system of grouping similar accounts together making it easier to track and analyze financial data.  .</p>
              </div>
              <div className="feature-card">
                <h3>Invoice Management template</h3>
                <p>With predefined fields and structures,This template ensure all Invoices data is captured in a consistent format,Minimize risk of human error in data entriy and improve accurate revenue Tracking.</p>
              </div>
              <div className="feature-card">
                <h3>Cash Receipt  template</h3>
                <p>This template streamline data entry process and reduce time spent in recording receipt manually it is also essential for further generating accurate financial reports.</p>
              </div>
              <div className="feature-card">
                <h3>Cash Disbursement template</h3>
                <p>This template ensures data for outgoing cash adhere to a consistent standardized format and sets a precedence for effective analysis of financil information.</p>
              </div>
             
              <div className="feature-card">
                <h3>General Ledger </h3>
                <p>The data entry templates serves as the foundation for accurate and efficient general ledger (GL)creation.Therefor data entry templates are automatically analysed and data posted to their respective accounts in the GL,updating the balances for each accounts</p>
              </div>
              <div className="feature-card">
                <h3>Financial Reports</h3>
                <p>Ultimately,financial statements are generated to provide you with a comprehensive overview of your Organization'sfinancial health enabling informed decision-making by various stakeholders .</p>
              </div>
             
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

export default Home;
