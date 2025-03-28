import React from 'react';
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
  FaPhone,
  FaWhatsapp, // Add WhatsApp icon
} from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si'; // Add TikTok icon
import './ContactUs.css'; // Assuming you have a CSS file for styling

const ContactUs = () => {
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm reaching out because I couldn't connect with you directly. Please let me know how I can assist you!"
  );
  const whatsappNumber = '+254783001125'; // Replace with your actual WhatsApp number
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="contact-us-container">
      <header className="contact-us-header">
        <h1>Contact Us</h1>
      </header>
      <section className="contact-us-section">
        <p>
          We'd love to hear from you! Whether you have a question about our services, want to provide feedback, or just want to say hello, feel free to reach out to us using the contact information below.
        </p>
        <div className="contact-info">
          <p><FaEnvelope /> Email: contact@youmingtechnologies.com</p>
          <p><FaPhone /> Phone: +254 783 001 125</p>
        </div>
        <div className="social-media-icons">
          {/* Existing social media links */}
          <a href="https://www.facebook.com/youmingtechnologies" target="_blank" rel="noopener noreferrer">
            <FaFacebook />
          </a>
          <a href="https://www.twitter.com/youmingtechnologies" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
          <a href="https://www.linkedin.com/company/youmingtechnologies" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://www.instagram.com/youmingtechnologies" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>

          {/* New WhatsApp link */}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <FaWhatsapp />
          </a>

          {/* New TikTok link */}
          <a href="https://www.tiktok.com/@youmingtechnologies" target="_blank" rel="noopener noreferrer">
            <SiTiktok />
          </a>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;