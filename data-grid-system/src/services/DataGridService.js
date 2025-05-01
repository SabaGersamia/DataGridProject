import api from './apiService';
import { getSafeValues } from '../utils/rowUtils';
import { ensureValidDate } from '../utils/dateUtils';

const normalizeRow = (row) => {
  if (!row) return { 
    values: {}, 
    status: 'ToDo',
    createdAt: new Date().toISOString(),
    id: 'temp-' + Math.random().toString(36).substr(2, 9)
  };
  
  return {
    id: row.rowId || row.id, // Prefer rowId from backend
    rowId: row.rowId, // Keep original rowId
    gridId: row.gridId,
    values: row.values || getSafeValues(row),
    status: row.status || 'ToDo',
    createdAt: ensureValidDate(row.createdAt) || new Date().toISOString(),
    ...(row.values || {}) // Spread values for backward compatibility
  };
};

// Fetch all grids
export const getGrids = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await api.get('/DataGrids', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching grids:', error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = "/login";
    }
    throw error;
  }
};

export const createGrid = async (gridData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await api.post('/DataGrids', gridData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error("Error creating grid:", error);
    throw error;
  }
};

export const updateGrid = async (gridId, updatedGrid) => {
  try {
    const response = await api.put(`/DataGrids/${gridId}`, updatedGrid);
    return response.status === 204 ? null : response.data;
  } catch (error) {
    console.error("Error updating grid:", error);
    throw error;
  }
};

export const deleteGrid = async (gridId) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error("Authentication required");
    if (!gridId) throw new Error("Grid ID is required");

    const response = await api.delete(`/DataGrids/${gridId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error("Delete grid error:", {
      gridId,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const getColumns = async (gridId) => {
  try {
    const response = await api.get(`/DataGrids/${gridId}/columns`);
    return response.data;
  } catch (error) {
    console.error("Error fetching columns:", error);
    throw error;
  }
};

export const createColumn = async (gridId, columnData) => {
  try {
    const response = await api.post(`/DataGrids/${gridId}/columns`, columnData);
    return response.data;
  } catch (error) {
    console.error("Error creating column:", error);
    throw error;
  }
};

export const getRows = async (gridId) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = "/login";
      throw new Error("No authentication token found");
    }

    const response = await api.get(`/Rows/${gridId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.map(row => ({
      id: row.rowId,
      rowId: row.rowId,
      gridId: row.gridId,
      values: row.values || {},
      status: row.status || "ToDo",
      createdAt: row.createdAt
    }));

  } catch (error) {
    console.error("API Error Details:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      error: error.message
    });

    if (error.response?.status === 401) {
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      alert("You do not have permission to view this grid.");
    }

    throw error;
  }
};

export const createRow = async (gridId, rowData) => {
  const token = localStorage.getItem("authToken");
  try {
    const response = await api.post(`/Rows/${gridId}/rows`, {
      gridId, // <-- ADD THIS
      values: rowData.values || {},
      status: rowData.status || "ToDo"
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return normalizeRow(response.data);
  } catch (error) {
    console.error("Error creating row:", error.response?.data || error.message);
    throw error;
  }
};

export const updateRow = async (gridId, rowId, rowData) => {
  try {
    const payload = {
      ...rowData,
      GridId: gridId,
      RowId: rowId,
      values: rowData.values || {},
      status: rowData.status || "ToDo"
    };
    
    const response = await api.put(`/Rows/${rowId}`, payload);
    return response.data; // Return raw response data
  } catch (error) {
    console.error("Error updating row:", {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    throw error;
  }
};


export const deleteRow = async (rowId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await api.delete(`/Rows/${rowId}`, { 
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting row:", error);
    throw error;
  }
};

export const deleteBatchRows = async (rowIds) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await api.delete('/Rows/batch', {
      data: rowIds,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error("Error in batch delete:", error);
    throw error;
  }
};

export const createBatchRows = async (gridId, rowsData) => {
  const token = localStorage.getItem("authToken");
  try {
    const response = await api.post(`/Rows/${gridId}/batch`, 
      rowsData.map(row => ({
        values: row.values || {},
        status: row.status || "ToDo"
      })),
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return response.data.map(normalizeRow);
  } catch (error) {
    console.error("Error creating batch rows:", error);
    throw error;
  }
};

export const pasteSpreadsheetData = async (gridId, clipboardData, columns) => {
  try {
    // Parse the clipboard data (tab-separated values)
    const rows = clipboardData
      .trim()
      .split('\n')
      .map(row => row.split('\t'));

    if (rows.length === 0) {
      throw new Error("No data found in clipboard");
    }
    
    // Create payload for each row
    const rowPayloads = rows.map(rowValues => {
      const values = {};
      columns.forEach((col, index) => {
        if (col.name && rowValues[index]) {
          values[col.name] = rowValues[index].trim();
        }
      });

      return {
        gridId,
        values,
        status: "ToDo"
      };
    });

    // Use existing createRow instead of batch create for reliability
    const createdRows = [];
    for (const payload of rowPayloads) {
      try {
        const row = await createRow(gridId, payload);
        createdRows.push(row);
      } catch (error) {
        console.error("Error creating row from paste:", error);
        // Continue with other rows even if one fails
      }
    }

    return createdRows;
  } catch (error) {
    console.error("Error in paste operation:", error);
    throw new Error(`Paste failed: ${error.message}`);
  }
};

export const setGridPermissions = async (gridId, allowedUsers) => {
  try {
    const response = await api.post(`/DataGrids/${gridId}/permissions`, { allowedUsers });
    return response.data;
  } catch (error) {
    console.error("Error setting grid permissions:", error);
    throw error;
  }
};