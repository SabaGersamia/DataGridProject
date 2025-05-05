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
  CircularProgress,
  Button
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import { 
  updateRow, 
  createRow, 
  deleteRow,
  getRows,
  deleteBatchRows,
  pasteSpreadsheetData
} from "../services/DataGridService";
import { getSafeValues } from '../utils/rowUtils';
import { formatDate } from '../utils/dateUtils';
import ExcelImportModal from './ExcelImportModal';

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
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const statusOptions = ["ToDo", "In Progress", "Finished"];
  const [fields, setFields] = useState(defaultFields);
  const [anchorEl, setAnchorEl] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const loadData = async () => {
    if (!grid?.gridId) {
      setRows([]);
      return;
    }
  
    try {
      setLoading(true);
      setRows([]);
      
      const response = await getRows(grid.gridId);
      
      const normalizedRows = response.map(row => ({
        id: row.rowId,
        rowId: row.rowId,
        gridId: row.gridId,
        status: row.status || row.values?.Status || "ToDo",
        createdAt: row.createdAt || row.values?.["Created At"] || '',
        description: row.values?.["Description"] || '',
        notes: row.values?.["Notes"] || '',
        dueDate: row.values?.["Due Date"] || '',
        teams: row.values?.["Teams"] || '',
        values: row.values || {}
      }));
  
      setRows(normalizedRows);
    } catch (error) {
      console.error("Failed to load rows:", error);
      setRows([]);
      if (error.response?.status !== 403) {
        alert(`Failed to refresh data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      setRows([]);
    };
  }, []);

  const handleInputChange = async (e, rowIndex, fieldKey) => {
    const newValue = e.target.value;
    const originalRows = [...rows];
    
    try {
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
        status: rows[rowIndex].status
      };
  
      const updatedRow = await updateRow(grid.gridId, rowId, updatePayload);
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
      const existingColumnKeys = grid.columns.map(col => col.key);
  
      const cleanValues = Object.fromEntries(
        defaultFields
          .filter(f => f.enabled && f.key !== "createdAt" && existingColumnKeys.includes(f.key))
          .map(f => [f.key, ""])
      );
  
      const newRow = {
        gridId: grid.gridId,
        values: cleanValues,
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
      alert("Failed to create row. Please check column definitions.");
    } finally {
      setLoading(false);
    }
  };  

  const handleDeleteRow = async (rowId, rowIndex) => {
    setDeleteLoading(rowIndex);
    try {
      await deleteRow(rowId);
      setRows(prev => prev.filter(row => row.id !== rowId));
      setSelectedRows(prev => prev.filter(id => id !== rowId));
      if (onRowDeleted) onRowDeleted(rowId);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRowSelect = (rowId) => {
    setSelectedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete ${selectedRows.length} selected rows?`)) return;
    
    try {
      setBatchProcessing(true);
      await deleteBatchRows(selectedRows);
      setRows(prev => prev.filter(row => !selectedRows.includes(row.id)));
      setSelectedRows([]);
      alert(`Deleted ${selectedRows.length} rows successfully`);
    } catch (error) {
      alert(`Failed to delete rows: ${error.message}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    
    try {
      setBatchProcessing(true);
      const newRows = await pasteSpreadsheetData(
        grid.gridId, 
        clipboardData, 
        fields.filter(f => f.enabled).map(f => ({ name: f.key, type: f.type || 'text' }))
      );
      
      const normalizedRows = newRows.map(row => ({
        id: row.rowId,
        status: row.status || "ToDo",
        createdAt: row.createdAt,
        ...getSafeValues(row)
      }));
      
      setRows(prev => [...prev, ...normalizedRows]);
      if (onRowCreated) {
        normalizedRows.forEach(row => onRowCreated(row));
      }
      alert(`Added ${newRows.length} rows from clipboard`);
    } catch (error) {
      alert(`Paste failed: ${error.message}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleDateChange = (date, rowIndex, fieldKey) => {
    const formattedDate = date ? dayjs(date).format("YYYY-MM-DD") : null;
    const updatedRows = [...rows];
    
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [fieldKey]: formattedDate,
      values: {
        ...(updatedRows[rowIndex].values || {}),
        [fieldKey]: formattedDate
      }
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

  const handleStatusChange = async (event, rowIndex) => {
    const newStatus = event.target.value;
    const originalRows = [...rows];
    const rowId = rows[rowIndex].id;
  
    const updatedRow = {
      ...rows[rowIndex],
      status: newStatus
    };
    const updatedRows = [...rows];
    updatedRows[rowIndex] = updatedRow;
    setRows(updatedRows);
  
    try {
      const updatePayload = {
        status: newStatus,
        values: { ...(rows[rowIndex].values || {}) }
      };
      const response = await updateRow(grid.gridId, rowId, updatePayload);
      
      setRows(prevRows =>
        prevRows.map(row => (row.id === rowId ? { ...row, ...response } : row))
      );
    } catch (error) {
      console.error("Error updating status:", error);
      setRows(originalRows);
      alert(`Failed to update status: ${error.response?.data || error.message}`);
    }
  };  

  const toggleField = (key) => {
    setFields(prev =>
      prev.map(field =>
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
      <Paper 
        style={{ padding: "16px", borderRadius: "8px", overflowX: "auto", width: "100%" }}
        onPaste={handlePaste}
      >
        {/* Batch Operations Toolbar */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => setImportModalOpen(true)}
            startIcon={<UploadIcon />}
            disabled={!grid?.gridId}
          >
            Import Data
          </Button>

          <ExcelImportModal
          gridId={grid?.gridId}
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={(importedRows) => {
            try {
              const newRows = importedRows.map(row => ({
                id: row.rowId,
                rowId: row.rowId,
                gridId: row.gridId,
                status: row.status || row.values?.Status || "ToDo",
                createdAt: row.createdAt || row.values?.["Created At"] || '',
                description: row.values?.["Description"] || '',
                notes: row.values?.["Notes"] || '',
                dueDate: row.values?.["Due Date"] || '',
                teams: row.values?.["Teams"] || '',
                values: row.values || {}
              }));

              setRows(prev => {
                const updatedRows = [...prev, ...newRows];
                localStorage.setItem(`grid-${grid.gridId}-rows`, JSON.stringify(updatedRows));
                return updatedRows;
              });
              
              alert(`${newRows.length} rows imported successfully!`);
            } catch (error) {
              console.error('Import processing error:', error);
              loadData();
            }
          }}
        />
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={selectedRows.length === 0 || batchProcessing}
            onClick={handleBatchDelete}
          >
            Delete Selected ({selectedRows.length})
          </Button>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Columns
          </Button>
        </div>

        <div style={{ overflowX: "auto", width: "100%" }}>
          <Table size="small" style={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < rows.length}
                    checked={rows.length > 0 && selectedRows.length === rows.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(rows.map(row => row.id));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </TableCell>
                
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
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleRowSelect(row.id)}
                    />
                  </TableCell>
                  
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
                      disabled={deleteLoading === rowIndex || batchProcessing}
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
                  onClick={() => !batchProcessing && handleAddRow()}
                  style={{ 
                    cursor: batchProcessing ? 'not-allowed' : 'pointer', 
                    backgroundColor: "#fafafa",
                    opacity: batchProcessing ? 0.7 : 1
                  }}
                >
                  <TableCell 
                    colSpan={fields.filter(f => f.enabled).length + 2}
                    style={{ textAlign: "center", fontWeight: "bold", color: "#1976d2" }}
                  >
                    {loading || batchProcessing ? <CircularProgress size={24} /> : "+ New Row"}
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