import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGrids, deleteGrid, createGrid } from '../services/apiService';
import logo from '../assets/imgs/centaurea.jpg';
import '../assets/css/adminDashboard.css';
import '../assets/css/modal.css';

const AdminDashboard = () => {
  const { user, logout: handleLogout } = useAuth();
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [gridName, setGridName] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

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

  const handleDeleteGrid = async (gridId) => {
    console.log("Attempting to delete grid with ID:", gridId);

    if (!gridId) {
      console.error("Error: gridId is undefined in handleDeleteGrid");
      return;
    }

    try {
      await deleteGrid(gridId);
      console.log(`Grid with ID ${gridId} deleted successfully`);

      // ✅ Fix: Update UI after deletion
      setGrids((prevGrids) => prevGrids.filter((grid) => grid.gridId !== gridId));
    } catch (error) {
      console.error("Error deleting grid:", error);
      setError("Failed to delete grid. Please try again.");
    }
  };

  const handleViewGrid = (grid) => {
    setSelectedGrid(grid);
    setViewModalOpen(true);
  };

  const handleCreateGrid = async () => {
    try {
      const newGrid = {
        name: gridName,
        isPublic: true,
        columns: columns.map(col => ({ name: col, dataType: 'string' })),
        rows: rows.map(row => ({ values: row.split(',') }))
      };
      
      const createdGrid = await createGrid(newGrid);
      setGrids([...grids, createdGrid]);
      setShowModal(false);
    } catch (error) {
      console.error("Error creating grid:", error);
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
              <button className="logout-button" onClick={handleLogout} aria-label="Logout">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-button" aria-label="Login">Login</Link>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1>Manage Data Grids</h1>
          <button className="create-grid-button" onClick={() => setShowModal(true)}>Create New Data Grid</button>

          {showModal && (
            <div className="modal">
              <h2>Create New Data Grid</h2>
              <input type="text" placeholder="Grid Name" value={gridName} onChange={(e) => setGridName(e.target.value)} />
              <input type="text" placeholder="Columns (comma-separated)" onBlur={(e) => setColumns(e.target.value.split(','))} />
              <textarea placeholder="Rows (comma-separated values per row)" onBlur={(e) => setRows(e.target.value.split('\n'))}></textarea>
              <button onClick={handleCreateGrid}>Create</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          )}

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
                      <button
                        className="delete-grid-button"
                        onClick={() => handleDeleteGrid(grid.gridId)}
                      >
                        Delete
                      </button>
                      <button
                        className="view-grid-button"
                        onClick={() => handleViewGrid(grid)}
                      >
                        View
                      </button>
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
  <div className="modal-overlay">
    <div className="modal-content">
      <h2 className="modal-title">Grid Details</h2>
      <p><strong>Name:</strong> {selectedGrid.name}</p>

      <div className="grid-table-container">
        <table className="grid-table">
          <thead>
            <tr>
              {selectedGrid.columns?.map((col) => (
                <th key={col.id}>{col.name}</th>
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
      </div>

      <button className="close-modal" onClick={() => setViewModalOpen(false)}>Close</button>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;