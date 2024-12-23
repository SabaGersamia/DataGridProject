import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/adminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
          <nav className="navigation">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="#about" className="nav-link">About</Link></li>
              <li>
                <Link 
                  to={user ? "/user/dashboard" : "/login"} 
                  className="nav-link">
                  Dashboard
                </Link>
              </li>     
              <li><Link to="#contact" className="nav-link">Contact</Link></li>
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

      <main className="dashboard-main">
        <div className="dashboard-sidebar">
          <h2>Admin Panel</h2>
          <ul>
            <li>
              <Link to="/admin/data-grids">Data Grids</Link>
            </li>
            <li>
              <Link to="/admin/settings">Settings</Link>
            </li>
          </ul>
        </div>

        <div className="dashboard-content">
          <h1>Manage Data Grids</h1>
          <button className="create-grid-button">Create New Data Grid</button>

          <div className="data-grids-list">
            <h3>Existing Data Grids</h3>
            <ul>
              {/* This would be populated dynamically with API data */}
              <li>
                <div className="grid-item">
                  <span>Data Grid 1</span>
                  <button className="edit-grid-button">Edit</button>
                  <button className="delete-grid-button">Delete</button>
                </div>
              </li>
              <li>
                <div className="grid-item">
                  <span>Data Grid 2</span>
                  <button className="edit-grid-button">Edit</button>
                  <button className="delete-grid-button">Delete</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
