import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button, Modal, Box, Typography, CircularProgress } from '@mui/material';
import { createBatchRows } from '../services/DataGridService';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ExcelImportModal = ({ gridId, open, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  const handleFileChange = (e) => {
    setError(null);
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    if (!['xlsx', 'xls', 'csv'].some(ext => selectedFile.name.endsWith(`.${ext}`))) {
      setError('Please upload a valid Excel file (.xlsx, .xls, .csv)');
      return;
    }

    setFile(selectedFile);
    previewExcel(selectedFile);
  };

  const previewExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const preview = jsonData.slice(0, 5).map(row => ({
          values: Object.entries(row).reduce((acc, [key, value]) => {
            acc[key] = value !== null && value !== undefined ? value : '';
            return acc;
          }, {})
        }));
        
        setPreviewData(preview);
      } catch (err) {
        setError('Failed to parse Excel file');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const createBatchRowsWithTimeout = async (gridId, data) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
  
    try {
      const response = await createBatchRows(gridId, data, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response format from server');
      }
      
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };
  
  
  const handleImport = async () => {
    if (!file || !gridId) return;
    
    setIsLoading(true);
    setError(null);
  
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
  
          // Excel data
          const rowsToImport = jsonData
          .filter(row => row["Description"])
          .map(row => {
            const statusMap = {
              "to do": "ToDo",
              "in progress": "In Progress", 
              "finished": "Finished"
            };
            
            const rawStatus = String(row["Status"] || "To Do").toLowerCase();
            const status = statusMap[rawStatus] || "ToDo";

            const values = {
              "Created At": new Date().toISOString(),
              "Description": String(row["Description"] || ""),
              "Status": status,
              "Notes": String(row["Notes"] || ""),
              "Due Date": row["Due Date"] ? new Date(row["Due Date"]).toISOString() : "",
              "Teams": String(row["Teams"] || "")
            };

            return {
              values,
              status: values["Status"]
            };
          });
          console.log('Final payload:', JSON.stringify(rowsToImport, null, 2));
          
          const response = await createBatchRowsWithTimeout(gridId, rowsToImport);
          console.log('Import response:', response);
  
          if (!response || !Array.isArray(response)) {
            throw new Error('Invalid response format from server');
          }
  
          onImportSuccess(response);
          onClose();
        } catch (err) {
          console.error("Import processing error:", err);
          setError(`Import failed: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File handling error:", err);
      setError(`File error: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Import from Excel
        </Typography>
        
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ margin: '16px 0' }}
        />
        
        {previewData.length > 0 && (
          <div style={{ margin: '16px 0', maxHeight: '200px', overflow: 'auto' }}>
            <Typography variant="subtitle2">Preview:</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {Object.keys(previewData[0]?.values || {}).map((header) => (
                    <th key={header} style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row.values).map((value, j) => (
                      <td key={j} style={{ border: '1px solid #ddd', padding: '4px' }}>
                        {value === null || value === undefined ? '' : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {error && (
          <Typography color="error" style={{ margin: '8px 0' }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Importing...' : 'Import'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ExcelImportModal;