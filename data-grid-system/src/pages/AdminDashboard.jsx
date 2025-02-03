import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGrids, deleteGrid } from '../services/apiService';
import logo from '../assets/imgs/centaurea.jpg';
import '../assets/css/adminDashboard.css';

const AdminDashboard = () => {
  const { user, logout: handleLogout } = useAuth();
  const [grids, setGrids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGridName, setNewGridName] = useState('');
    const [editingGrid, setEditingGrid] = useState(null);
    const [editedGridName, setEditedGridName] = useState('');
    const [selectedGrid, setSelectedGrid] = useState(null);
  

  useEffect(() => {
    const fetchGrids = async () => {
      try {
        const data = await getGrids();
        console.log("Fetched Grids:", data);
      } catch (err) {
        setError('Failed to fetch data grids. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrids();
  }, []);  

  // Handle grid deletion
  const handleDeleteGrid = async (gridId) => {
    console.log("Attempting to delete grid with ID:", gridId);
  
    if (!gridId) {
      console.error("Error: gridId is undefined in handleDeleteGrid");
      return;
    }
  
    try {
      const response = await deleteGrid(gridId);
      console.log("Grid deleted successfully:", response);
  
      // Remove the grid from the UI after successful deletion
      setGrids((prevGrids) => prevGrids.filter((grid) => grid.id !== gridId));
    } catch (error) {
      console.error("Error deleting grid:", error);
    }
  };
  

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
                <Link to={user ? "/user/dashboard" : "/login"} className="nav-link">
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
            <li><Link to="/admin/data-grids">Data Grids</Link></li>
            <li><Link to="/admin/settings">Settings</Link></li>
          </ul>
        </div>

        <div className="dashboard-content">
          <h1>Manage Data Grids</h1>
          <button className="create-grid-button">Create New Data Grid</button>

          <div className="data-grids-list">
            <h3>Existing Data Grids</h3>
            <ul>
              {grids.length > 0 ? (
                grids.map((grid) => (
                  <li key={grid.id}>
                    <div className="grid-item">
                      <span>{grid.name}</span>
                      <button className="edit-grid-button">Edit</button>
                      <button
                        className="delete-grid-button"
                        onClick={() => handleDeleteGrid(grid.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p>No grids available.</p>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
