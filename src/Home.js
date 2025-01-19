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
        <div className="loader">Loading...</div>
      ) : (
        <>
          {/* Navigation Bar */}
          <i><div className="navbar-brand">YOUMING TECHNOLOGIES</div></i> 
          
          {/* Hero Section */}
          <header className="hero">
            <div className="hero-content">
              <h1>Non-Profit Making Organizations Financial Management tool kit</h1>
              <h2>For Schools, Churches, and NGOs</h2>
              <p>Manage your invoices, disbursements, receipts, and transactions all in one place.</p>
              <Link to="/register" className="cta-button">Get Started</Link>
            </div>
          </header>

          {/* Features Section */}
          <section className="features">
            <h2>Our Core Features</h2>
            <div className="feature-cards">
              <div className="feature-card">
                <h3>Invoice Management</h3>
                <p>Easily generate, track, and manage your institution's invoices in real-time.</p>
              </div>
              <div className="feature-card">
                <h3>Disbursement Tracking</h3>
                <p>Track and manage all disbursements made by your institution, ensuring accuracy.</p>
              </div>
              <div className="feature-card">
                <h3>Receipt Management</h3>
                <p>Store and manage receipts for all financial transactions and ensure compliance.</p>
              </div>
              <div className="feature-card">
                <h3>Transaction Monitoring</h3>
                <p>Monitor and track all financial transactions, providing transparency and reporting.</p>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="testimonials">
            <h2>What Our Clients Say</h2>
            <div className="testimonial-cards">
              <div className="testimonial-card">
                <p>"This platform has streamlined our financial operations and reduced errors in accounting."</p>
                <span>- Finance Director, Moses Ngaruya.</span>
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
