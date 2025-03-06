import api from './apiService';

// Fetch all grids
export const getGrids = async () => {
  try {
    const token = localStorage.getItem('authToken')
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

// Create a new grid
export const createGrid = async (gridData) => {
  try {
    console.log("Creating grid with data:", gridData);

    const response = await api.post('/DataGrids', gridData);

    console.log("Grid created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating grid:", error.response?.data?.errors || error.message);
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
    return response.data;
  } catch (error) {
    console.error("Error fetching rows:", error.response?.data || error.message);
    throw error;
  }
};

// Create a Row in a Grid
export const createRow = async (gridId, rowData) => {
  try {
    const response = await api.post(`/DataGrids/${gridId}/rows`, rowData);
    return response.data;
  } catch (error) {
    console.error("Error creating row:", error.response?.data || error.message);
    throw error;
  }
};

// Update Row Data
export const updateRow = async (gridId, rowId, rowData) => {
  try {
    const response = await api.put(`/DataGrids/${gridId}/rows/${rowId}`, rowData);
    return response.data;
  } catch (error) {
    console.error("Error updating row:", error.response?.data || error.message);
    throw error;
  }
};

// Delete Row Data
export const deleteRow = async (gridId, rowId) => {
  try {
    const response = await api.delete(`/DataGrids/${gridId}/rows/${rowId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting row:", error.response?.data || error.message);
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