import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/css/homePage.css';
import logo from '../assets/imgs/centaurea.jpg';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDashboardNavigation = () => {
    if (user) {
      navigate('/user/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
          <nav className="navigation">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="/about" className="nav-link">About</Link></li>
              <li>
                <Link 
                  to={user ? "/user/dashboard" : "/login"} 
                  className="nav-link">
                  Dashboard
                </Link>
              </li>     
              <li><Link to="/contact" className="nav-link">Contact</Link></li>
            </ul>
          </nav>
        </div>
        <div className="user-actions">
          {user ? (
            <>
              <span className="nav-link">Hi, {user.username}</span>
              <button className="logout-button" onClick={handleLogout} aria-label="Logout">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-button" aria-label="Login">Login</Link>
          )}
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to the DataGrid System</h1>
            <p className="hero-description">
              Easily manage and organize your data with powerful grids, columns, and rows.
            </p>
            <button onClick={handleDashboardNavigation} className="cta-button">
              Get Started
            </button>
          </div>
        </section>
        <section className="features-section">
          <div className="features">
            <div className="feature-card">
              <h3>Flexible Data Management</h3>
              <p>Design grids, add rows, and customize columns with ease.</p>
            </div>
            <div className="feature-card">
              <h3>Collaborative Workflow</h3>
              <p>Share and manage data grids with your team effortlessly.</p>
            </div>
            <div className="feature-card">
              <h3>Real-Time Updates</h3>
              <p>Keep your data up to date with live collaboration features.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2024 DataGrid System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
