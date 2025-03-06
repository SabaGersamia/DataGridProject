import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGrids } from '../services/DataGridService';
import { useAuth } from '../context/AuthContext';
import '../assets/css/userDashboard.css';
import logo from '../assets/imgs/centaurea.jpg';

const UserDashboard = () => {
  const { user, logout: handleLogout } = useAuth();
  const navigate = useNavigate();
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState(null);

  useEffect(() => {
    const fetchGrids = async () => {
      try {
        const data = await getGrids();
        if (user?.role === "Administrator") {
          setGrids(data);
        } else {
          setGrids(data.filter(grid => grid.isPublic || grid.ownerId === user?.id));
        }
      } catch (err) {
        setError('Failed to fetch data grids. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrids();
  }, [user]);

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/");
  };

  const handleViewGrid = (grid) => {
    console.log("Opening grid:", grid);
    setSelectedGrid(grid);
    setViewModalOpen(true);
  };

  return (
    <div className="user-dashboard">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
          <nav className="navigation">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="#about" className="nav-link">About</Link></li>
              <li><Link to="#contact" className="nav-link">Contact</Link></li>
            </ul>
          </nav>
        </div>
        <div className="user-actions">
          {user ? (
            <>
              <span className="nav-link">Hi, {user.username} ({user.role})</span>
              <button className="logout-button" onClick={logoutAndRedirect}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-button">Login</Link>
          )}
        </div>  
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Data Grids</h1>

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

      {viewModalOpen && selectedGrid && (
        <div className="modal-overlay" onClick={() => setViewModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Grid Details</h2>
            <p><strong>Name:</strong> {selectedGrid?.name}</p>

            <div className="grid-table-container">
              <table className="grid-table">
                <thead>
                  <tr>
                    {selectedGrid?.columns?.map((col) => (
                      <th key={col.id}>{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedGrid?.rows?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.values.map((value, colIndex) => (
                        <td key={colIndex}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="close-modal" onClick={() => setViewModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
