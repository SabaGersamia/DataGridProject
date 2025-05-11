import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGrids } from '../services/DataGridService';
import { useAuth } from '../context/AuthContext';
import { 
  Paper, Typography, List, ListItem, 
  CircularProgress, Snackbar, Alert, Chip
} from '@mui/material';
import TaskTable from '../components/TaskTable';
import '../assets/css/userDashboard.css';
import logo from '../assets/imgs/centaurea.jpg';

const UserDashboard = () => {
  const { user, logout: handleLogout } = useAuth();
  const navigate = useNavigate();
  const [grids, setGrids] = useState([]);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch only public grids or grids where user is allowed
  useEffect(() => {
    const loadGrids = async () => {
      try {
        if (!user) return; // Wait until user is loaded
        
        const allGrids = await getGrids();
        // Filter grids based on public status or allowed users
        const filteredGrids = allGrids.filter(grid => 
          grid.isPublic || 
          (grid.allowedUsers && grid.allowedUsers.includes(user.username)) ||
          grid.ownerId === user.id
        );
        
        setGrids(filteredGrids);
        if (filteredGrids.length > 0) setSelectedGrid(filteredGrids[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadGrids();
  }, [user]); // Add user as dependency

  const refreshSelectedGrid = async () => {
    if (!selectedGrid || !user) return;
    try {
      const updatedGrids = await getGrids();
      const filteredGrids = updatedGrids.filter(grid => 
        grid.isPublic || 
        (grid.allowedUsers && grid.allowedUsers.includes(user.username)) ||
        grid.ownerId === user.id
      );
      setGrids(filteredGrids);
  
      const refreshedGrid = filteredGrids.find(g => g.id === selectedGrid.id);
      setSelectedGrid(refreshedGrid || null);
    } catch (err) {
      console.error("Error refreshing grid:", err.message);
    }
  };

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="user-dashboard">
        <p>Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
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
          <span className="nav-link">Hi, {user.username} ({user.role})</span>
          <button className="logout-button" onClick={logoutAndRedirect}>Logout</button>
        </div>  
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-main">
        {/* Left Panel - Data Grids */}
        <div className="left-panel">
          <Paper className="panel-box">
            <div className="panel-header">
              <h2>Available Data Grids</h2>
            </div>

            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : grids.length > 0 ? (
              <List>
                {grids.map((grid) => (
                  <ListItem 
                    key={grid.id} 
                    className={`grid-item ${selectedGrid?.id === grid.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGrid(grid)}
                  >
                    <div className="grid-info">
                      <span className="grid-name">{grid.name}</span>
                      <Chip 
                        label={grid.isPublic ? 'Public' : 'Private'} 
                        size="small" 
                        color={grid.isPublic ? 'success' : 'default'}
                        className="privacy-chip"
                      />
                    </div>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No grids available</Typography>
            )}
          </Paper>
        </div>

        {/* Middle Panel - Task Table */}
        <div className="middle-panel">
          <Paper className="panel-box">
            <h2>{selectedGrid ? `${selectedGrid.name}` : 'Select a Data Grid'}</h2>
            {selectedGrid ? (
              <TaskTable 
                grid={selectedGrid} 
                refreshGrid={refreshSelectedGrid} 
                isAdmin={user.role === "Administrator"}
              />
            ) : (
              <Typography>Please select a grid</Typography>
            )}
          </Paper>
        </div>
      </main>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
    </div>
  );
};

export default UserDashboard;