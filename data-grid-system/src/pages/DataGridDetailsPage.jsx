import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGridDetails, updateGrid } from '../services/apiService';
import '../assets/css/dataGridDetailsPage.css';

const DataGridDetailsPage = () => {
  const { gridId } = useParams();
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedGridName, setEditedGridName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGridDetails = async () => {
      try {
        const gridData = await getGridDetails(gridId);
        setGrid(gridData);
        setEditedGridName(gridData.name);
      } catch (err) {
        setError('Error fetching grid details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGridDetails();
  }, [gridId]);

  const handleEditGrid = async (e) => {
    e.preventDefault();
    if (!editedGridName.trim()) return;

    try {
      const updatedGrid = { name: editedGridName };
      const updatedDataGrid = await updateGrid(gridId, updatedGrid);
      setGrid(updatedDataGrid);
      setEditing(false);
    } catch (err) {
      setError('Error updating grid');
      console.error(err);
    }
  };

  const handleDeleteGrid = async () => {
    try {
      if (window.confirm('Are you sure you want to delete this grid?')) {
        await deleteGrid(gridId);
        navigate('/user/data-grids');
      }
    } catch (err) {
      setError('Error deleting grid');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="data-grid-details-page">
      <header className="header">
        <h2>Data Grid Details</h2>
      </header>

      <div className="grid-details">
        {editing ? (
          <form onSubmit={handleEditGrid} className="edit-grid-form">
            <input
              type="text"
              value={editedGridName}
              onChange={(e) => setEditedGridName(e.target.value)}
              required
            />
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        ) : (
          <>
            <h3>{grid.name}</h3>
            <button onClick={() => setEditing(true)} className="edit-button">Edit Grid Name</button>
            <button onClick={handleDeleteGrid} className="delete-button">Delete Grid</button>
          </>
        )}

        <div className="grid-columns">
          <h4>Columns</h4>
          <ul>
            {grid.columns.map((column) => (
              <li key={column.id}>
                <span>{column.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid-rows">
          <h4>Rows</h4>
          <ul>
            {grid.rows.map((row) => (
              <li key={row.id}>
                {row.data.map((cell, index) => (
                  <span key={index}>{cell} </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataGridDetailsPage;
