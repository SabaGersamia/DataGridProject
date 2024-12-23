import React, { useEffect, useState } from 'react';
import { getColumns, getRows } from '../services/apiService';

const GridView = ({ gridId }) => {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  // Fetch Columns and Rows
  useEffect(() => {
    const fetchGridData = async () => {
      try {
        const columnsData = await getColumns(gridId);
        const rowsData = await getRows(gridId);
        setColumns(columnsData);
        setRows(rowsData);
      } catch (error) {
        console.error('Error fetching grid data:', error);
      }
    };

    if (gridId) fetchGridData();
  }, [gridId]);

  return (
    <div>
      <h3>Grid View</h3>

      {/* Columns */}
      <h4>Columns</h4>
      <ul>
        {columns.map((col) => (
          <li key={col.id}>{col.name}</li>
        ))}
      </ul>

      {/* Rows */}
      <h4>Rows</h4>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>Row {row.id}</li>
        ))}
      </ul>
    </div>
  );
};

export default GridView;