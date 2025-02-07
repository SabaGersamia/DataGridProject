import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import "../assets/css/modal.css";
import ColumnModal from './ColumnModal';

const ColumnManager = ({ gridId }) => {
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const handleAddColumn = async (columnData) => {
    try {
      const response = await apiService.post(`/grids/${gridId}/columns`, columnData);
      setColumns((prev) => [...prev, response.data]);
      setIsModalOpen(false); // Close modal after saving
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
            {col.name} ({col.type}){' '}
            <button onClick={() => handleDeleteColumn(col.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={() => setIsModalOpen(true)}>Add Column</button>

      {/* Column Modal */}
      <ColumnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddColumn}
      />
    </div>
  );
};

export default ColumnManager;
