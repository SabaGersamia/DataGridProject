import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const ColumnManager = ({ gridId }) => {
  const [columns, setColumns] = useState([]);
  const [newColumn, setNewColumn] = useState('');

  // Fetch columns
  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const response = await apiService.get(`/grids/${gridId}/columns`);
        setColumns(response.data);
      } catch (error) {
        console.error('Error fetching columns:', error);
      }
    };
    fetchColumns();
  }, [gridId]);

  // Add column
  const handleAddColumn = async () => {
    try {
      const response = await apiService.post(`/grids/${gridId}/columns`, {
        name: newColumn,
      });
      setColumns((prev) => [...prev, response.data]);
      setNewColumn('');
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  // Delete column
  const handleDeleteColumn = async (columnId) => {
    try {
      await apiService.delete(`/grids/${gridId}/columns/${columnId}`);
      setColumns((prev) => prev.filter((col) => col.id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  return (
    <div>
      <h3>Manage Columns</h3>
      <ul>
        {columns.map((col) => (
          <li key={col.id}>
            {col.name}{' '}
            <button onClick={() => handleDeleteColumn(col.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={newColumn}
        onChange={(e) => setNewColumn(e.target.value)}
        placeholder="New column name"
      />
      <button onClick={handleAddColumn}>Add Column</button>
    </div>
  );
};

export default ColumnManager;
