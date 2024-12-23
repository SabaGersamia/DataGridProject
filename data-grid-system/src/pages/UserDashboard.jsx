import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGrids, createGrid, deleteGrid, updateGrid } from '../services/apiService';
import GridView from './GridView';
import '../assets/css/userDashboard.css';
import logo from '../assets/imgs/centaurea.jpg';


const UserDashboard = () => {
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
        setGrids(data);
      } catch (err) {
        setError('Failed to fetch data grids. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrids();
  }, []);

  const handleCreateGrid = async (e) => {
    e.preventDefault();
    if (!newGridName.trim()) return;
    try {
      const createdGrid = await createGrid({ name: newGridName });
      setGrids([...grids, createdGrid]);
      setNewGridName('');
      setShowCreateForm(false);
    } catch (err) {
      setError('Error creating grid. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteGrid = async (gridId) => {
    try {
      await deleteGrid(gridId);
      setGrids(grids.filter((grid) => grid.id !== gridId));
    } catch (err) {
      setError('Error deleting grid. Please try again.');
      console.error(err);
    }
  };

  const handleEditGrid = async (e) => {
    e.preventDefault();
    if (!editedGridName.trim()) return;
    try {
      const updatedGrid = await updateGrid(editingGrid.id, { name: editedGridName });
      setGrids(grids.map((grid) => (grid.id === editingGrid.id ? updatedGrid : grid)));
      setEditingGrid(null);
      setEditedGridName('');
    } catch (err) {
      setError('Error updating grid. Please try again.');
      console.error(err);
    }
  };

  const handleViewGrid = (grid) => {
    setSelectedGrid(grid);
  };

  const handleBackToGrids = () => {
    setSelectedGrid(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
        <div className="dashboard-header">
          <h1>Welcome</h1>
          <p>Manage your data grids with ease.</p>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sidebar">
          <h2>User Dashboard</h2>
          <ul>
            <li>
              <Link to="/user/data-grids">My Data Grids</Link>
            </li>
            <li>
              <Link to="/user/settings">Settings</Link>
            </li>
          </ul>
        </div>

        <div className="dashboard-content">
          {selectedGrid ? (
            <>
              <button onClick={handleBackToGrids} className="back-button">
                Back to Grids
              </button>
              <GridView gridId={selectedGrid.id} />
            </>
          ) : (
            <>
              <h1>Manage Your Data Grids</h1>

              <button
                className="create-grid-button"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : 'Create New Data Grid'}
              </button>

              {showCreateForm && (
                <form onSubmit={handleCreateGrid} className="create-grid-form">
                  <input
                    type="text"
                    value={newGridName}
                    onChange={(e) => setNewGridName(e.target.value)}
                    placeholder="Enter grid name"
                    required
                  />
                  <button type="submit">Create Grid</button>
                </form>
              )}

              {editingGrid && (
                <form onSubmit={handleEditGrid} className="edit-grid-form">
                  <input
                    type="text"
                    value={editedGridName}
                    onChange={(e) => setEditedGridName(e.target.value)}
                    placeholder="Edit grid name"
                    required
                  />
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setEditingGrid(null)}>
                    Cancel
                  </button>
                </form>
              )}

              <div className="data-grids-list">
                <h3>Your Data Grids</h3>
                <ul>
                  {grids.map((grid) => (
                    <li key={grid.id}>
                      <div className="grid-item">
                        <span>{grid.name}</span>
                        <button
                          className="view-grid-button"
                          onClick={() => handleViewGrid(grid)}
                        >
                          View
                        </button>
                        <button
                          className="edit-grid-button"
                          onClick={() => {
                            setEditingGrid(grid);
                            setEditedGridName(grid.name);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-grid-button"
                          onClick={() => handleDeleteGrid(grid.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
