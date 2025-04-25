import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGrids, createGrid, deleteGrid } from '../services/DataGridService';
import { 
  Grid, Paper, Typography, List, ListItem, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Checkbox, Chip, Box, CircularProgress, Snackbar, Alert
} from '@mui/material';
import TaskTable from '../components/TaskTable';
import AddIcon from '@mui/icons-material/Add';
import '../assets/css/adminDashboard.css';
import logo from '../assets/imgs/centaurea.jpg';

const AdminDashboard = () => {
  const { user, logout: handleLogout } = useAuth();
  const [grids, setGrids] = useState([]);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Create dialog state
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newGrid, setNewGrid] = useState({
    name: '',
    isPublic: true,
    allowedUsers: []
  });

  // Fetch grids on mount
  useEffect(() => {
    const loadGrids = async () => {
      try {
        const data = await getGrids();
        setGrids(data);
        if (data.length > 0) setSelectedGrid(data[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadGrids();
  }, []);

  const handleCreateGrid = async () => {
    try {
      // Validate required fields
      if (!newGrid.name.trim()) {
        setError('Grid name is required');
        return;
      }

      const createdGrid = await createGrid(newGrid);
      setGrids([...grids, createdGrid]);
      setSelectedGrid(createdGrid);
      setOpenCreateDialog(false);
      setSuccess('Grid created successfully!');
      setNewGrid({
        name: '',
        isPublic: true,
        allowedUsers: []
      });
    } catch (err) {
      setError(err.message || 'Failed to create grid');
    }
  };

  const handleDeleteGrid = async (gridId) => {
    try {
      await deleteGrid(gridId);
      setGrids(grids.filter(g => g.id !== gridId));
      if (selectedGrid?.id === gridId) setSelectedGrid(null);
      setSuccess('Grid deleted successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshSelectedGrid = async () => {
    if (!selectedGrid) return;
    try {
      const updatedGrids = await getGrids();
      setGrids(updatedGrids);
  
      const refreshedGrid = updatedGrids.find(g => g.id === selectedGrid.id);
      setSelectedGrid(refreshedGrid || null);
    } catch (err) {
      console.error("Error refreshing grid:", err.message);
    }
  };
  

  return (
    <div className="admin-dashboard">
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
          {user ? (
            <>
              <span className="nav-link">Hi, {user.username}</span>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-button">Login</Link>
          )}
        </div>  
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-main">
        {/* Left Panel - Data Grids */}
        <div className="left-panel">
          <Paper className="panel-box">
            <div className="panel-header">
              <h2>Data Grids</h2>
              <Button 
                variant="contained" 
                onClick={() => setOpenCreateDialog(true)}
                startIcon={<AddIcon />}
                className="create-grid-btn"
              >
                Create DataGrid
              </Button>
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
              <TaskTable grid={selectedGrid} refreshGrid={refreshSelectedGrid} allGrids={grids} />
            ) : (
              <Typography>Please select or create a grid</Typography>
            )}
          </Paper>
        </div>
      </main>

      {/* Create Grid Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Data Grid</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Grid Name"
            fullWidth
            value={newGrid.name}
            onChange={(e) => setNewGrid({...newGrid, name: e.target.value})}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={newGrid.isPublic}
                onChange={(e) => setNewGrid({...newGrid, isPublic: e.target.checked})}
              />
            }
            label="Public Grid"
          />
          
          {!newGrid.isPublic && (
            <TextField
              label="Allowed Users (comma separated)"
              fullWidth
              margin="dense"
              value={newGrid.allowedUsers.join(',')}
              onChange={(e) => setNewGrid({
                ...newGrid, 
                allowedUsers: e.target.value.split(',').map(u => u.trim())
              })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGrid} 
            variant="contained"
            disabled={!newGrid.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

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

export default AdminDashboard;