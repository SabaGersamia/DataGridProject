import React from 'react';
import '../assets/css/contactPage.css';
import { Link } from 'react-router-dom';
import logo from '../assets/imgs/centaurea.jpg';

const ContactPage = () => {
  return (
    <div className="contact-page">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
          <nav className="navigation">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="/about" className="nav-link">About</Link></li>
              <li><Link to="/contact" className="nav-link active">Contact</Link></li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="contact-main">
      <section className="about-me">
            <h3>About Me</h3>
            <p>
              Hello, I'm <strong>Saba Gersamia</strong>, the creator of the DataGrid System v2.0. I developed this project to help users manage and organize their data efficiently. With a passion for building powerful and user-friendly systems, I wanted to create a tool that makes it easier for teams to collaborate and manage data in a seamless way. I hope you find it useful and empowering!
            </p>
          </section>

        <section className="contact-info">
          <h2>Contact</h2>
          <div className="contact-details">
            <div className="contact-item">
              <h3>Email</h3>
              <p>gersamia.saba25@gmail.com</p>
            </div>
            <div className="contact-item">
              <h3>Phone</h3>
              <p>(+995) 579-18-96-69</p>
            </div>
            <div className="contact-item">
              <h3>Address</h3>
              <p>Georgia, Tbilisi</p>
            </div>
          </div>

          <section className="social-media">
            <h3>Follow</h3>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/sabagersamia/" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                LinkedIn
              </a>
              <a href="https://github.com/SabaGersamia" target="_blank" rel="noopener noreferrer" className="social-link github">
                GitHub
              </a>
            </div>
          </section>
        </section>
      </main>
      <footer className="footer">
        <p>&copy; 2024 DataGrid System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ContactPage;
