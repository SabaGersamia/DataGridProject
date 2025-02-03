import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'https://localhost:7289/api';

// Create an axios instance for reusable API requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to add the authorization token dynamically
api.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// POST request for login
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { userName: username, password });

    if (response.data?.token) {
      const token = response.data.token;
      localStorage.setItem('authToken', token);
      return token;
    }

    throw new Error('No token received');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};


// Example GET request to fetch data
export const fetchData = async () => {
  try {
    const response = await api.get(`/data-endpoint`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


// Fetch all grids
export const getGrids = async () => {
  try {
    const response = await api.get('/DataGrids');
    return response.data;
  } catch (error) {
    console.error('Error fetching grids:', error.response || error.message);
    throw error;
  }
};

// Create a new grid
export const createGrid = async (gridData) => {
  try {
    const response = await api.post('/DataGrids', gridData);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error creating grid:', error.response.data.errors);
    }
    throw error;
  }
};


// Update a grid
export const updateGrid = async (gridId, updatedData) => {
  try {
    const response = await api.put(`/DataGrids/${gridId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating grid:', error.response || error.message);
    throw error;
  }
};

// Delete a grid
export const deleteGrid = async (gridId) => {
  if (!gridId) {
    console.error("Error: gridId is undefined");
    return;
  }

  try {
    const token = localStorage.getItem("authToken"); // Ensure auth token is sent
    console.log("Attempting API call to delete grid with ID:", gridId);

    const response = await api.delete(`/DataGrids/${gridId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Grid deleted successfully from API:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting grid:", error);
    throw error;
  }
};

// Fetch Columns for a Grid
export const getColumns = async (gridId) => {
  try {
    const response = await api.get(`/grids/${gridId}/columns`);
    return response.data;
  } catch (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }
};

// Create a Column in a Grid
export const createColumn = async (gridId, columnData) => {
  try {
    const response = await api.post(`/grids/${gridId}/columns`, columnData);
    return response.data;
  } catch (error) {
    console.error('Error creating column:', error);
    throw error;
  }
};

// Fetch Rows for a Grid
export const getRows = async (gridId) => {
  try {
    const response = await api.get(`/grids/${gridId}/rows`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rows:', error);
    throw error;
  }
};

// Create a Row in a Grid
export const createRow = async (gridId, rowData) => {
  try {
    const response = await api.post(`/grids/${gridId}/rows`, rowData);
    return response.data;
  } catch (error) {
    console.error('Error creating row:', error);
    throw error;
  }
};

// Update Row Data
export const updateRow = async (gridId, rowId, rowData) => {
  try {
    const response = await api.put(`/grids/${gridId}/rows/${rowId}`, rowData);
    return response.data;
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  }
};

// Delete Row Data
export const deleteRow = async (gridId, rowId) => {
  try {
    const response = await api.delete(`/grids/${gridId}/rows/${rowId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
};

// User registration
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Set permissions for a user on a specific grid
export const setGridPermissions = async (gridId, userId, permissions) => {
  try {
    const response = await api.post(`/grids/${gridId}/permissions`, { userId, permissions });
    return response.data;
  } catch (error) {
    console.error('Error setting grid permissions:', error.response || error.message);
    throw error;
  }
};

// Filter rows in a grid
export const filterRows = async (gridId, filterCriteria) => {
  try {
    const response = await api.get(`/grids/${gridId}/rows`, { params: { filter: filterCriteria } });
    return response.data;
  } catch (error) {
    console.error('Error filtering rows:', error.response || error.message);
    throw error;
  }
};

// Sort columns in a grid
export const sortColumns = async (gridId, sortCriteria) => {
  try {
    const response = await api.get(`/grids/${gridId}/columns`, { params: { sort: sortCriteria } });
    return response.data;
  } catch (error) {
    console.error('Error sorting columns:', error.response || error.message);
    throw error;
  }
};

// Batch update rows in a grid
export const batchUpdateRows = async (gridId, rowsData) => {
  try {
    const response = await api.put(`/grids/${gridId}/rows/batch`, { rows: rowsData });
    return response.data;
  } catch (error) {
    console.error('Error batch updating rows:', error.response || error.message);
    throw error;
  }
};

// Batch delete rows from a grid
export const batchDeleteRows = async (gridId, rowIds) => {
  try {
    const response = await api.delete(`/grids/${gridId}/rows/batch`, { data: { rowIds } });
    return response.data;
  } catch (error) {
    console.error('Error batch deleting rows:', error.response || error.message);
    throw error;
  }
};
