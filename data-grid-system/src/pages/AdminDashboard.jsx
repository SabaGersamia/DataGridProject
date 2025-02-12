import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGrids, deleteGrid, createGrid, updateGrid } from '../services/apiService'; // Added updateGrid
import logo from '../assets/imgs/centaurea.jpg';
import '../assets/css/adminDashboard.css';

const AdminDashboard = () => {
  const { user, logout: handleLogout } = useAuth();
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedGrid, setEditedGrid] = useState(null);

  useEffect(() => {
    const fetchGrids = async () => {
      try {
        const data = await getGrids();
        if (Array.isArray(data)) {
          setGrids(data);
        } else {
          setError("Invalid data format received from server.");
        }
      } catch (err) {
        setError("Failed to fetch data grids. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchGrids();
  }, []);

  const handleViewGrid = (grid) => {
    setSelectedGrid(grid);
    setViewModalOpen(true);
  };

  const handleEditGrid = (grid) => {
    // Clone the grid to avoid direct mutations
    setEditedGrid({ ...grid, rows: [...grid.rows] });
    setEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      await updateGrid(editedGrid.id, editedGrid); // Call API to update the grid
      setGrids(grids.map(grid => (grid.id === editedGrid.id ? editedGrid : grid))); // Update UI state
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating grid:", error);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
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
        <div className="dashboard-content">
          <h1>Manage Data Grids</h1>
          <div className="data-grids-list">
            {loading ? (
              <p>Loading grids...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : grids.length > 0 ? (
              <ul>
                {grids.map((grid) => (
                  <li key={grid.id}>
                    <div className="grid-item">
                      <span>{grid.name}</span>
                      <button className="view-grid-button" onClick={() => handleViewGrid(grid)}>View</button>
                      <button className="edit-grid-button" onClick={() => handleEditGrid(grid)}>Edit</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No grids available.</p>
            )}
          </div>
        </div>
      </main>

      {/* View Grid Modal */}
      {viewModalOpen && selectedGrid && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Grid Details</h2>
            <table>
              <tbody>
                {selectedGrid.rows?.map((row, index) => (
                  <tr key={index}>
                    {row.values.map((value, idx) => (
                      <td key={idx}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="close-modal" onClick={() => setViewModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Edit Grid Modal */}
      {viewModalOpen && selectedGrid && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Grid Details</h2>
      <p><strong>Name:</strong> {selectedGrid.name}</p>
      <table>
        <thead>
          <tr>
            {selectedGrid.columns?.map((col, index) => (
              <th key={index}>{col.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedGrid.rows?.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.values.map((value, colIndex) => (
                <td key={colIndex}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="close-modal" onClick={() => setViewModalOpen(false)}>Close</button>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;
