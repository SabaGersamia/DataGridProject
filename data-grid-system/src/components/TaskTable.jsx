import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TextField,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  CircularProgress
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from '@mui/icons-material/Delete';
import { updateRow, createRow, deleteRow } from "../services/DataGridService";
import { getSafeValues } from '../utils/rowUtils';
import { formatDate, ensureValidDate } from '../utils/dateUtils';

const defaultFields = [
  { key: "createdAt", label: "Created At", editable: false, enabled: true },
  { key: "description", label: "Description", editable: true, enabled: true },
  { key: "status", label: "Status", editable: true, enabled: true, type: "status" },
  { key: "notes", label: "Notes", editable: true, enabled: true },
  { key: "dueDate", label: "Due Date", editable: true, enabled: true, type: "date" },
  { key: "teams", label: "Teams", editable: true, enabled: true },
];

const TaskTable = ({ grid, onRowCreated, onRowUpdated, onRowDeleted }) => {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const statusOptions = ["ToDo", "In progress", "Finished"];
  
  useEffect(() => {
    const loadData = async () => {
      if (grid?.gridId) {
        try {
          const response = await getRows(grid.gridId);
          const normalizedRows = response.map(row => ({
            id: row.rowId,
            status: row.status || "ToDo",
            createdAt: row.createdAt,
            ...getSafeValues(row)
          }));
          setRows(normalizedRows);
        } catch (error) {
          console.error("Failed to load rows:", error);
          alert("Failed to refresh data. Please try again.");
        }
      }
    };
  
    loadData();
  }, [grid]);

  const [fields, setFields] = useState(defaultFields);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleInputChange = async (e, rowIndex, fieldKey) => {
    const newValue = e.target.value;
    const originalRows = [...rows];
    
    try {
      // Optimistic update
      const updatedRows = rows.map((row, index) => 
        index === rowIndex 
          ? { 
              ...row, 
              [fieldKey]: newValue,
              values: {
                ...(row.values || {}),
                [fieldKey]: newValue
              }
            }
          : row
      );
      
      setRows(updatedRows);
      
      const rowId = rows[rowIndex].id;
      const updatePayload = {
        values: {
          ...(rows[rowIndex].values || {}),
          [fieldKey]: newValue
        },
        status: rows[rowIndex].status // Include current status
      };
  
      // Wait for update to complete and get the updated row
      const updatedRow = await updateRow(grid.gridId, rowId, updatePayload);
      
      // Update local state with the server's response
      setRows(prevRows => prevRows.map(row => 
        row.id === rowId ? { ...row, ...updatedRow } : row
      ));
      
      if (onRowUpdated) {
        onRowUpdated(rowId, { [fieldKey]: newValue });
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setRows(originalRows);
      alert(`Failed to save changes: ${error.response?.data || error.message}`);
    }
  };

  const handleAddRow = async () => {
    setLoading(true);
    try {
      const newRow = {
        gridId: grid.gridId,
        values: Object.fromEntries(columns.map(col => [col.name, ""])),
        status: "ToDo"
      };
      const createdRow = await createRow(grid.gridId, newRow);
      const normalizedRow = {
        id: createdRow.rowId,
        status: createdRow.status,
        createdAt: createdRow.createdAt,
        ...getSafeValues(createdRow)
      };
      setRows([...rows, normalizedRow]);
      if (onRowCreated) onRowCreated(normalizedRow);
    } catch (error) {
      console.error("Error creating row:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (rowId, rowIndex) => {
    setDeleteLoading(rowIndex);
    try {
      const updatedRows = rows.filter(row => row.id !== rowId);
      setRows(updatedRows);
      await deleteRow(rowId);
      if (onRowDeleted) onRowDeleted(rowId);
    } catch (error) {
      console.error("Delete failed:", error);
      setRows(rows);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDateChange = (date, rowIndex, fieldKey) => {
    const formattedDate = date ? dayjs(date).format("YYYY-MM-DD") : null;
    const updatedRows = [...rows];
    
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [fieldKey]: formattedDate
    };
    
    setRows(updatedRows);
    
    if (grid?.gridId && updatedRows[rowIndex].id) {
      updateRow(grid.gridId, updatedRows[rowIndex].id, { 
        values: {
          ...getSafeValues(updatedRows[rowIndex]),
          [fieldKey]: formattedDate
        }
      }).catch(error => console.error("Error updating date:", error));
    }
  };

  const handleStatusChange = (event, rowIndex) => {
    const newStatus = event.target.value;
    const updatedRows = [...rows];
    
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      status: newStatus
    };
    
    setRows(updatedRows);
    
    if (grid?.gridId && updatedRows[rowIndex].id) {
      updateRow(grid.gridId, updatedRows[rowIndex].id, { 
        status: newStatus,
        values: getSafeValues(updatedRows[rowIndex])
      }).catch(error => console.error("Error updating status:", error));
    }
  };

  const toggleField = (key) => {
    setFields((prev) =>
      prev.map((field) =>
        field.key === key ? { ...field, enabled: !field.enabled } : field
      )
    );
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper style={{ padding: "16px", borderRadius: "8px", overflowX: "auto", width: "100%" }}>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <Table size="small" style={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                {fields.filter((field) => field.enabled).map((field) => (
                  <TableCell 
                    key={field.key} 
                    style={{ 
                      fontWeight: "bold", 
                      textAlign: "center",
                      width: field.key === "createdAt" ? "180px" : undefined
                    }}
                  >
                    {field.label}
                  </TableCell>
                ))}
                <TableCell style={{ width: "120px", textAlign: "center" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <IconButton 
                      onClick={handleMenuOpen} 
                      size="small" 
                      color="primary" 
                      style={{ background: "#f1f1f1", borderRadius: "5px" }}
                    >
                      <AddIcon />
                    </IconButton>
                    <span style={{ lineHeight: '40px' }}>Actions</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex}>
                  {fields.filter((field) => field.enabled).map((field) => (
                    <TableCell 
                      key={field.key} 
                      style={{ 
                        textAlign: "center", 
                        padding: "8px",
                        width: field.key === "createdAt" ? "180px" : undefined
                      }}
                    >
                      {field.key === "createdAt" ? (
                        <span>{formatDate(row.createdAt)}</span>
                      ) : field.type === "date" ? (
                        <DatePicker
                          value={row[field.key] ? dayjs(row[field.key]) : null}
                          onChange={(date) => handleDateChange(date, rowIndex, field.key)}
                          slotProps={{
                            textField: { 
                              size: "small", 
                              sx: { width: "120px" },
                              variant: "outlined"
                            },
                          }}
                        />
                      ) : field.type === "status" ? (
                        <Select
                          value={row.status}
                          onChange={(e) => handleStatusChange(e, rowIndex)}
                          size="small"
                          fullWidth
                          variant="outlined"
                        >
                          {statusOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : field.editable ? (
                        <TextField
                          variant="outlined"
                          size="small"
                          value={row[field.key] || ""}
                          onChange={(e) => handleInputChange(e, rowIndex, field.key)}
                          fullWidth
                        />
                      ) : (
                        <span>{row[field.key] || "N/A"}</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell style={{ width: '120px', textAlign: 'center' }}>
                    <IconButton 
                      onClick={() => handleDeleteRow(row.id, rowIndex)}
                      color="error"
                      size="small"
                      disabled={deleteLoading === rowIndex}
                    >
                      {deleteLoading === rowIndex ? (
                        <CircularProgress size={24} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {grid?.gridId && (
                <TableRow 
                  onClick={() => handleAddRow(grid.gridId)}
                  style={{ cursor: "pointer", backgroundColor: "#fafafa" }}
                >
                  <TableCell 
                    colSpan={fields.filter(f => f.enabled).length + 1}
                    style={{ textAlign: "center", fontWeight: "bold", color: "#1976d2" }}
                  >
                    {loading ? <CircularProgress size={24} /> : "+ New Row"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <Menu 
          anchorEl={anchorEl} 
          open={Boolean(anchorEl)} 
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {fields.map((field) => (
            <MenuItem key={field.key} onClick={() => toggleField(field.key)}>
              <ListItemIcon>
                <Checkbox checked={field.enabled} edge="start" tabIndex={-1} disableRipple />
              </ListItemIcon>
              <ListItemText primary={field.label} />
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </LocalizationProvider>
  );
};

export default TaskTable;