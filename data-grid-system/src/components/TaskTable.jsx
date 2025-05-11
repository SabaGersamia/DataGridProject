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
  Button,
  Snackbar
} from "@mui/material";
import Alert from '@mui/material/Alert';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { 
  updateRow, 
  createRow, 
  deleteRow,
  getRows,
  deleteBatchRows,
  createBatchRows
} from "../services/DataGridService";
import { getSafeValues } from '../utils/rowUtils';
import { formatDate } from '../utils/dateUtils';
import { convertValueToType, getFieldType } from '../utils/typeConversion';
import { getClipboardData } from '../services/ClipboardService';
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
  const [lastPasteResult, setLastPasteResult] = useState(null);
  const statusOptions = ["ToDo", "In Progress", "Finished"];
  const [fields, setFields] = useState(defaultFields);
  const [anchorEl, setAnchorEl] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importIssues, setImportIssues] = useState([]);

  const loadData = async () => {
    if (!grid?.gridId) {
      setRows([]);
      return;
    }
  
    try {
      setLoading(true);
      const response = await getRows(grid.gridId);
      
      const normalizedRows = response
        .filter(row => row.gridId === grid.gridId)
        .map(row => ({
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
      if (error.response?.status !== 403) {
        alert(`Failed to refresh data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopySelection = async () => {
    if (selectedRows.length === 0) {
      setLastPasteResult({
        message: 'Please select at least one row to copy',
        severity: 'warning'
      });
      return;
    }

    try {
      const rowsToCopy = rows.filter(row => selectedRows.includes(row.id));
      const visibleFields = fields.filter(field => 
        field.enabled && field.key !== 'createdAt'
      );
      
      const headers = visibleFields.map(field => field.label).join('\t');
      
      const dataRows = rowsToCopy.map(row => {
        return visibleFields.map(field => {
          let value = row[field.key] || '';
          if (field.type === 'date' && value) {
            value = formatDate(value);
          }
          return String(value)
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n');
        }).join('\t');
      });

      const tsvData = [headers, ...dataRows].join('\n');

      try {
        await navigator.clipboard.writeText(tsvData);
        setLastPasteResult({
          message: `Copied ${selectedRows.length} row(s) to clipboard`,
          severity: 'success'
        });
      } catch (err) {
        try {
          const blob = new Blob([tsvData], { type: 'text/plain' });
          const clipboardItem = new ClipboardItem({ 'text/plain': blob });
          await navigator.clipboard.write([clipboardItem]);
          setLastPasteResult({
            message: `Copied ${selectedRows.length} row(s) to clipboard`,
            severity: 'success'
          });
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
          setLastPasteResult({
            message: 'Copy failed. Please check browser permissions.',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Copy failed:', error);
      setLastPasteResult({
        message: 'Copy failed: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handlePaste = async (targetRowIndex, targetFieldKey) => {
    const clipboard = getClipboardData();
    if (!clipboard) return;

    const targetField = fields.find(f => f.key === targetFieldKey);
    if (!targetField) return;

    try {
      const targetType = getFieldType(targetField);
      const convertedValues = clipboard.values.map(value => 
        convertValueToType(value, targetType)
      );

      const validValues = convertedValues.filter(v => v !== '');
      if (validValues.length === 0) {
        setLastPasteResult({
          message: 'No valid data to paste after type conversion',
          severity: 'error'
        });
        return;
      }

      const updatedRows = [...rows];
      updatedRows[targetRowIndex] = {
        ...updatedRows[targetRowIndex],
        [targetFieldKey]: validValues[0],
        values: {
          ...updatedRows[targetRowIndex].values,
          [targetFieldKey]: validValues[0]
        }
      };

      setRows(updatedRows);

      if (grid?.gridId) {
        await updateRow(
          grid.gridId,
          updatedRows[targetRowIndex].id,
          { 
            values: {
              ...updatedRows[targetRowIndex].values,
              [targetFieldKey]: validValues[0]
            }
          }
        );
      }

      setLastPasteResult({
        message: `Pasted ${validValues.length} value(s)`,
        severity: 'success'
      });

      if (validValues.length > 1) {
        setTimeout(() => {
          if (window.confirm(`Paste remaining ${validValues.length - 1} values to next rows?`)) {
            handleMultiPaste(targetRowIndex, targetFieldKey, validValues.slice(1));
          }          
        }, 300);
      }
    } catch (error) {
      setLastPasteResult({
        message: `Paste failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleMultiPaste = async (startIndex, fieldKey, values) => {
    try {
      let successCount = 0;
      
      for (let i = 0; i < values.length; i++) {
        const rowIndex = startIndex + i + 1;
        
        if (rowIndex >= rows.length) {
          await handleAddRow();
          continue;
        }
  
        const updatedRows = [...rows];
        if (updatedRows[rowIndex]) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            [fieldKey]: values[i],
            values: {
              ...updatedRows[rowIndex].values,
              [fieldKey]: values[i]
            }
          };
  
          setRows(updatedRows);
  
          if (grid?.gridId) {
            await updateRow(
              grid.gridId,
              updatedRows[rowIndex].id,
              { 
                values: {
                  ...updatedRows[rowIndex].values,
                  [fieldKey]: values[i]
                }
              }
            );
          }
          successCount++;
        }
      }
  
      setLastPasteResult({
        message: `Pasted ${successCount} additional values`,
        severity: 'success'
      });
    } catch (error) {
      setLastPasteResult({
        message: `Multi-paste failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    const loadDataOnGridChange = async () => {
      if (grid?.gridId) {
        await loadData();
      }
    };
    loadDataOnGridChange();
  }, [grid?.gridId]);

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
  
      setRows(prevRows => [...prevRows, normalizedRow]);
      
      if (onRowCreated) onRowCreated(normalizedRow);
      return normalizedRow;
    } catch (error) {
      console.error("Error creating row:", error);
      alert("Failed to create row. Please check column definitions.");
      throw error;
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

  const handlePasteImport = async (e) => {
    e.preventDefault();
    try {
      const clipboardData = e.clipboardData?.getData('text') || await navigator.clipboard.readText();
      if (!grid?.gridId || !clipboardData.trim()) return;

      setBatchProcessing(true);
      
      const allRows = clipboardData.split('\n').filter(row => row.trim());
      const importIssues = [];

      const expectedColumns = [
        { key: 'description', names: ['description', 'desc', 'task'], display: 'Description' },
        { key: 'status', names: ['status', 'state'], display: 'Status' },
        { key: 'notes', names: ['notes', 'note', 'comments'], display: 'Notes' },
        { key: 'dueDate', names: ['due date', 'due', 'date', 'target date'], display: 'Due Date' },
        { key: 'teams', names: ['teams', 'team', 'group'], display: 'Teams' }
      ];

      const firstRow = allRows[0].toLowerCase();
      let headers = [];
      let hasHeaders = false;

      // Check if first row contains at least 3 valid headers
      const potentialHeaders = allRows[0].split(/\t|,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map(h => h.trim().replace(/^"(.*)"$/, '$1'));
      
      const validHeaderCount = potentialHeaders.filter(header => {
        const headerLower = header.toLowerCase();
        return expectedColumns.some(col => 
          col.names.some(name => headerLower.includes(name))
        );
      }).length;

      if (validHeaderCount >= 3) {
        headers = potentialHeaders;
        allRows.shift();
        hasHeaders = true;
      }

      const unrecognizedColumns = [];
      if (hasHeaders) {
        headers.forEach(header => {
          const headerLower = header.toLowerCase();
          const isRecognized = expectedColumns.some(col => 
            col.names.some(name => headerLower.includes(name))
          );
          if (!isRecognized) {
            unrecognizedColumns.push(header);
          }
        });
      }

      if (unrecognizedColumns.length > 0) {
        importIssues.push({
          message: `These columns were ignored: ${unrecognizedColumns.join(', ')}`
        });
      }

      const rowsToImport = allRows.map((row, rowIndex) => {
        const cells = row.split(/\t|,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
        
        const rowData = {
          values: {},
          status: 'ToDo',
          createdAt: new Date().toISOString()
        };

        cells.forEach((value, index) => {
          if (hasHeaders && headers[index]) {
            const header = headers[index].toLowerCase();
            const field = expectedColumns.find(col => 
              col.names.some(name => header.includes(name))
            );

            if (field) {
              try {
                if (field.key === 'status') {
                  const converted = convertValueToType(value, 'status');
                  rowData.status = converted;
                  rowData.values[field.display] = converted;
                } 
                else if (field.key === 'dueDate') {
                  const converted = convertValueToType(value, 'date');
                  rowData.dueDate = converted;
                  rowData.values[field.display] = converted;
                }
                else {
                  rowData[field.key] = value;
                  rowData.values[field.display] = value;
                }
              } catch (error) {
                importIssues.push({
                  row: rowIndex + 1,
                  column: field.display,
                  value: value,
                  message: `Row ${rowIndex + 1}: Error processing ${field.display}`
                });
              }
            }
          } else if (!hasHeaders && index < expectedColumns.length) {
            const field = expectedColumns[index];
            try {
              if (field.key === 'status') {
                const converted = convertValueToType(value, 'status');
                rowData.status = converted;
                rowData.values[field.display] = converted;
              } 
              else if (field.key === 'dueDate') {
                const converted = convertValueToType(value, 'date');
                rowData.dueDate = converted;
                rowData.values[field.display] = converted;
              }
              else {
                rowData[field.key] = value;
                rowData.values[field.display] = value;
              }
            } catch (error) {
              importIssues.push({
                row: rowIndex + 1,
                column: field.display,
                value: value,
                message: `Row ${rowIndex + 1}: Error processing ${field.display}`
              });
            }
          }
        });

        return rowData;
      });

      if (rowsToImport.length === 0) {
        throw new Error('No valid data found in clipboard');
      }

      const response = await createBatchRows(grid.gridId, rowsToImport);
      
      const newRows = response.map(row => ({
        id: row.rowId,
        rowId: row.rowId,
        gridId: row.gridId,
        status: row.status || "ToDo",
        createdAt: row.createdAt,
        description: row.values?.Description || '',
        notes: row.values?.Notes || '',
        dueDate: row.values?.["Due Date"] || '',
        teams: row.values?.Teams || '',
        values: row.values || {}
      }));

      setRows(prev => [...prev, ...newRows]);

      let resultMessage = `${newRows.length} row(s) imported successfully`;
      if (importIssues.length > 0) {
        resultMessage += ` with ${importIssues.length} issue(s)`;
      }

      setLastPasteResult({
        message: resultMessage,
        severity: importIssues.length ? 'warning' : 'success',
        details: importIssues.length > 0 ? (
          <div>
            <p>Import completed with:</p>
            <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
              {importIssues.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null
      });

    } catch (error) {
      setLastPasteResult({
        message: `Paste failed: ${error.message}`,
        severity: 'error'
      });
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
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
  
                setRows(prev => [...prev, ...newRows]);
                alert(`${newRows.length} rows imported successfully!`);
              } catch (error) {
                console.error('Import processing error:', error);
                loadData();
              }
            }}
          />
  
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopySelection}
            disabled={selectedRows.length === 0 || batchProcessing}
          >
            Copy ({selectedRows.length})
          </Button>
  
          <Button
            variant="outlined"
            startIcon={<ContentPasteIcon />}
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                const pasteEvent = {
                  preventDefault: () => {},
                  clipboardData: { getData: () => text }
                };
                await handlePasteImport(pasteEvent);
              } catch (error) {
                console.error('Paste failed:', error);
                alert('Failed to read clipboard. Please paste directly into a cell.');
              }
            }}
            disabled={batchProcessing}
          >
            Paste Data
          </Button>
  
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
                <TableRow 
                  key={row.id || rowIndex} 
                  hover
                  selected={selectedRows.includes(row.id)}
                  style={{ 
                    backgroundColor: selectedRows.includes(row.id) ? '#e3f2fd' : 'inherit'
                  }}
                >
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
                      onDoubleClick={() => handlePaste(rowIndex, field.key)}
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
  
        <Snackbar
          open={!!lastPasteResult}
          autoHideDuration={importIssues?.length ? 10000 : 6000}
          onClose={() => {
            setLastPasteResult(null);
            setImportIssues([]);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={lastPasteResult?.severity || 'info'} 
            onClose={() => {
              setLastPasteResult(null);
              setImportIssues([]);
            }}
            sx={{ 
              width: '100%', 
              maxWidth: '600px',
              '& .MuiAlert-message': {
                overflow: 'auto',
                maxHeight: '300px'
              }
            }}
          >
            {lastPasteResult?.details || lastPasteResult?.message}
          </Alert>
        </Snackbar>
      </Paper>
    </LocalizationProvider>
  );
};

export default TaskTable;