import React from 'react';
import '../assets/css/aboutPage.css';
import logo from '../assets/imgs/centaurea.jpg';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="about-page">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
          <nav className="navigation">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="/about" className="nav-link">About</Link></li>
              <li><Link to="/contact" className="nav-link">Contact</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="about-main">
        <section className="about-section">
          <h1 className="about-title">Welcome to the DataGrid System</h1>
          <p className="about-description">
            The **DataGrid System v2.0** is an advanced web-based platform designed to help you effortlessly manage and organize your data using powerful, customizable grids. Whether you're tracking business data, managing project tasks, or organizing information in a team environment, DataGrid provides a seamless experience for data entry, management, and collaboration.
          </p>
        </section>

        <section className="about-features">
          <h2 className="features-title">Key Features</h2>
          <ul className="features-list">
            <li>⚡ **Flexible Grid Management** - Easily create and customize grids to suit your needs.</li>
            <li>💼 **Collaborative Workflow** - Share grids with your team for real-time updates and collaboration.</li>
            <li>🔒 **Role-Based Permissions** - Manage who can view or edit data with built-in role-based security.</li>
            <li>⏱️ **Efficient Batch Operations** - Perform actions on multiple data entries simultaneously for faster data handling.</li>
          </ul>
        </section>

        <section className="about-vision">
          <h2 className="vision-title">Our Vision</h2>
          <p>
            At **DataGrid**, we believe in empowering teams and individuals to manage and analyze data with ease. Our mission is to provide a user-friendly, intuitive platform that fosters real-time collaboration, while ensuring robust features to handle large datasets efficiently.
          </p>
        </section>

        <section className="cta-section">
          <h3 className="cta-title">Ready to Get Started?</h3>
          <Link to="/signup" className="cta-button">Sign Up Now</Link>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
