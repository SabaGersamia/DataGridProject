import api from './apiService';
import { getSafeValues } from '../utils/rowUtils';
import { ensureValidDate } from '../utils/dateUtils';

const normalizeRow = (row) => {
  if (!row) return { 
    values: {}, 
    status: 'ToDo'
  };
  
  return {
    ...row,
    id: row.rowId || row.id,
    values: getSafeValues(row),
    status: row.status || 'ToDo',
    createdAt: ensureValidDate(row.createdAt)
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
      console.warn("Unauthorized access - redirecting to login.");
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = "/login";
    }

    return null;
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
    console.error("Error creating grid:", {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

// Update a grid
export const updateGrid = async (gridId, updatedGrid) => {
  try {
    const response = await api.put(`/DataGrids/${gridId}`, updatedGrid);
    return response.status === 204 ? null : response.data;
  } catch (error) {
    console.error("Error updating grid:", error.response?.data || error.message);
    throw error;
  }
};

// Delete a grid
export const deleteGrid = async (gridId) => {
  try {
    const response = await api.delete(`/DataGrids/${gridId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting grid:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch Columns for a Grid
export const getColumns = async (gridId) => {
  try {
    const response = await api.get(`/DataGrids/${gridId}/columns`);
    return response.data;
  } catch (error) {
    console.error("Error fetching columns:", error.response?.data || error.message);
    throw error;
  }
};

// Create a Column in a Grid
export const createColumn = async (gridId, columnData) => {
  try {
    const response = await api.post(`/DataGrids/${gridId}/columns`, columnData);
    return response.data;
  } catch (error) {
    console.error("Error creating column:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch Rows for a Grid
export const getRows = async (gridId) => {
  try {
    const response = await api.get(`/DataGrids/${gridId}/rows`);
    return Array.isArray(response.data) 
      ? response.data.map(normalizeRow)
      : [normalizeRow(response.data)];
  } catch (error) {
    console.error("Error fetching rows:", error.response?.data || error.message);
    throw error;
  }
};

export const createRow = async (gridId, rowData) => {
  const token = localStorage.getItem("authToken");
  try {
    const payload = {
      ...rowData,
      values: rowData.values || {}
    };
    
    const response = await api.post(`/Rows/${gridId}/rows`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    // Trust the backend's timestamp completely
    return normalizeRow(response.data);
  } catch (error) {
    console.error("Error creating row:", error.response?.data || error.message);
    throw error;
  }
};

// export const createRow = async (gridId, rowData) => {
//   const token = localStorage.getItem("authToken");
//   try {
//     const response = await api.post(`/Rows/${gridId}/rows`, {
//       ...rowData,
//       values: rowData.values || {}
//     }, {
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//     });
//     return normalizeRow(response.data);
//   } catch (error) {
//     console.error("Error creating row:", error.response?.data || error.message);
//     throw error;
//   }
// };

// export const updateRow = async (gridId, rowId, rowData) => {
//   try {
//     const payload = {
//       ...rowData,
//       RowId: rowId,
//       values: rowData.values || {}
//     };
    
//     const response = await api.put(`/Rows/${rowId}`, payload);
//     return normalizeRow(response.data);
//   } catch (error) {
//     console.error("Error updating row:", {
//       message: error.message,
//       response: error.response?.data,
//       config: error.config
//     });
//     throw error;
//   }
// };

// export const deleteRow = async (rowId) => {
//   try {
//     const token = localStorage.getItem('authToken');
//     const response = await api.delete(`/Rows/${rowId}`, { 
//       headers: token ? { Authorization: `Bearer ${token}` } : {}
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error deleting row:", {
//       message: error.message,
//       response: error.response?.data,
//       config: error.config
//     });
//     throw error;
//   }
// };

// export const deleteRows = async (rowIds) => {
//   try {
//     const token = localStorage.getItem('authToken');
//     const response = await api.delete('/api/Rows/batch', {
//       data: rowIds,
//       headers: token ? { Authorization: `Bearer ${token}` } : {}
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error deleting rows:", {
//       message: error.message,
//       response: error.response?.data,
//       config: error.config
//     });
//     throw error;
//   }
// };

export const updateRow = async (gridId, rowId, rowData) => {
  try {
    const payload = {
      ...rowData,
      GridId: gridId, // Include gridId in payload
      RowId: rowId,
      values: rowData.values || {},
      status: rowData.status || "ToDo" // Ensure status is always included
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
    console.error("Error deleting row:", {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

export const deleteRows = async (rowIds) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await api.delete('/Rows/batch', {  // Fixed endpoint path
      data: rowIds,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting rows:", {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

// Set permissions for a user on a specific grid
export const setGridPermissions = async (gridId, allowedUsers) => {
  try {
    console.log("🔹 Setting permissions for grid:", gridId, "Users:", allowedUsers);

    const response = await api.post(`/DataGrids/${gridId}/permissions`, { allowedUsers });

    console.log("Permissions set successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error setting grid permissions:", error.response?.data || error.message);
    throw error;
  }
};