import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const RowManager = ({ gridId }) => {
  const [rows, setRows] = useState([]);
  const [newRow, setNewRow] = useState({});

  // Fetch rows
  useEffect(() => {
    const fetchRows = async () => {
      try {
        const response = await apiService.get(`/grids/${gridId}/rows`);
        setRows(response.data);
      } catch (error) {
        console.error('Error fetching rows:', error);
      }
    };
    fetchRows();
  }, [gridId]);

  // Add row
  const handleAddRow = async () => {
    try {
      const response = await apiService.post(`/grids/${gridId}/rows`, newRow);
      setRows((prev) => [...prev, response.data]);
      setNewRow({});
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  // Delete row
  const handleDeleteRow = async (rowId) => {
    try {
      await apiService.delete(`/grids/${gridId}/rows/${rowId}`);
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };

  return (
    <div>
      <h3>Manage Rows</h3>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            Row {row.id}{' '}
            <button onClick={() => handleDeleteRow(row.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="New row value"
        onChange={(e) => setNewRow({ ...newRow, value: e.target.value })}
      />
      <button onClick={handleAddRow}>Add Row</button>
    </div>
  );
};

export default RowManager;
